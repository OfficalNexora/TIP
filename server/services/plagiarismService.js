/**
 * plagiarismService.js — Plagiarism detection via internal cross-check + external scraping.
 * 
 * Architecture:
 * 1. Internal check: Compare against all existing documents by the same user in the DB.
 *    Uses worker_threads for CPU-bound similarity computation.
 * 2. External check: Best-effort scraping of public research repositories.
 *    Network failures are caught and do not block the pipeline.
 * 
 * The internal check is the primary mechanism. External is supplementary.
 */

const { Worker } = require('worker_threads');
const path = require('path');
const { supabase } = require('./supabaseClient');
const crypto = require('crypto');

const WORKER_PATH = path.join(__dirname, 'plagiarismWorker.js');
const SHINGLE_SIZE = 5;           // 5-word n-grams
const SIMILARITY_THRESHOLD = 15;  // Minimum % to report as a match
const MAX_COMPARISONS = 50;       // Cap internal comparisons to avoid unbounded memory
const WORKER_TIMEOUT_MS = 60000;  // 60s worker timeout (increased for serialized load)
const EXTERNAL_TIMEOUT_MS = 10000; // 10s per external source

// --- Persistent Worker Management ---
let worker = null;
const pendingTasks = new Map();

function getWorker() {
    if (!worker) {
        worker = new Worker(WORKER_PATH);
        worker.on('message', (msg) => {
            const { id, results, error } = msg;
            const resolver = pendingTasks.get(id);
            if (resolver) {
                if (error) resolver.reject(new Error(error));
                else resolver.resolve(results || []);
                pendingTasks.delete(id);
            }
        });
        worker.on('error', (err) => {
            console.error('[Plagiarism] Worker thread error:', err);
            // Fail all pending tasks
            for (const [id, resolver] of pendingTasks) {
                resolver.reject(new Error(`Worker crashed: ${err.message}`));
            }
            pendingTasks.clear();
            worker = null; // Force recreation on next call
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`[Plagiarism] Worker exited with code ${code}`);
                // Fail pending tasks immediately if worker dies
                for (const [id, resolver] of pendingTasks) {
                    resolver.reject(new Error(`Worker process died with code ${code}`));
                }
                pendingTasks.clear();
            }
            worker = null;
        });
    }
    return worker;
}

/**
 * Dispatch task to persistent worker.
 */
function runWorker(sourceText, comparisons) {
    return new Promise((resolve, reject) => {
        const taskId = crypto.randomUUID();

        // Timeout check
        const timeoutTimer = setTimeout(() => {
            if (pendingTasks.has(taskId)) {
                pendingTasks.delete(taskId);
                reject(new Error(`Plagiarism worker timed out after ${WORKER_TIMEOUT_MS}ms`));
            }
        }, WORKER_TIMEOUT_MS);

        pendingTasks.set(taskId, {
            resolve: (res) => { clearTimeout(timeoutTimer); resolve(res); },
            reject: (err) => { clearTimeout(timeoutTimer); reject(err); }
        });

        const w = getWorker();
        w.postMessage({ id: taskId, sourceText, comparisons, shingleSize: SHINGLE_SIZE });
    });
}

/**
 * Internal cross-check: Compare source text against existing analyses in the DB.
 * 
 * Query strategy:
 * - Fetch completed analyses with full_text for the same user
 * - Exclude the current analysis being processed
 * - Cap at MAX_COMPARISONS to prevent memory explosion
 * - Delegate similarity computation to worker thread
 */
async function checkInternal(text, analysisId, userId) {
    try {
        // Fetch existing documents for this user (most recent first)
        const { data: existingDocs, error } = await supabase
            .from('analyses')
            .select('id, filename, full_text')
            .eq('user_id', userId)
            .eq('status', 'COMPLETED')
            .neq('id', analysisId)
            .not('full_text', 'is', null)
            .order('created_at', { ascending: false })
            .limit(MAX_COMPARISONS);

        if (error) {
            console.error('[Plagiarism] DB query failed:', error.message);
            return { matches: [], error: error.message };
        }

        if (!existingDocs || existingDocs.length === 0) {
            return { matches: [] };
        }

        // Prepare comparisons for worker thread
        const comparisons = existingDocs.map(doc => ({
            id: doc.id,
            text: doc.full_text,
            filename: doc.filename
        }));

        // Offload CPU-bound computation to worker thread
        const results = await runWorker(text, comparisons);

        // Filter to meaningful matches and enrich with filenames
        const matches = results
            .filter(r => r.similarity >= SIMILARITY_THRESHOLD)
            .map(r => {
                const doc = existingDocs.find(d => d.id === r.id);
                return {
                    source: 'internal',
                    analysisId: r.id,
                    filename: doc?.filename || 'Unknown',
                    similarity: r.similarity,
                    matchingShingles: r.matchingShingles,
                    snippet: r.snippet
                };
            })
            .sort((a, b) => b.similarity - a.similarity);

        return { matches };

    } catch (err) {
        console.error('[Plagiarism] Internal check failed:', err.message);
        return { matches: [], error: err.message };
    }
}

/**
 * External scraping: Check text against public research repositories.
 * 
 * This is best-effort. Each source has an independent timeout.
 * Failures are silently caught per-source — the overall analysis never fails because of this.
 * 
 * Strategy: Extract key phrases from the source text, search them against
 * public APIs or scrape-safe endpoints, compare returned abstracts.
 */
async function checkExternal(text) {
    const externalMatches = [];
    const keyPhrases = extractKeyPhrases(text);

    if (keyPhrases.length === 0) {
        return { matches: [] };
    }

    // Source 1: Google Scholar (via scraping abstracts)
    try {
        const scholarResults = await searchGoogleScholar(keyPhrases[0]);
        externalMatches.push(...scholarResults);
    } catch (err) {
        console.warn('[Plagiarism] Google Scholar check failed (non-blocking):', err.message);
    }

    // Source 2: Google Books API (Robust, reliable)
    try {
        const booksResults = await searchGoogleBooks(keyPhrases[0]);
        externalMatches.push(...booksResults);
    } catch (err) {
        console.warn('[Plagiarism] Google Books check failed (non-blocking):', err.message);
    }

    // Source 3: Crossref API (free, no auth required, returns DOI metadata)
    try {
        const crossrefResults = await searchCrossref(keyPhrases[0]);
        externalMatches.push(...crossrefResults);
    } catch (err) {
        console.warn('[Plagiarism] Crossref check failed (non-blocking):', err.message);
    }

    return { matches: externalMatches };
}

/**
 * Extract top 3 key phrases from text for external searching.
 * Uses a simple heuristic: longest unique sentences from the first 2000 chars.
 * 
 * We avoid sending the full text externally for privacy and rate-limit reasons.
 */
function extractKeyPhrases(text) {
    const sentences = text
        .slice(0, 2000)
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 200)
        .sort((a, b) => b.length - a.length); // Longest first

    return sentences.slice(0, 3);
}

/**
 * Search Google Books API.
 * Returns title + URL + Author matches.
 * No API key required for public access tiers, but recommended for higher quotas.
 */
async function searchGoogleBooks(query) {
    const searchQuery = encodeURIComponent(query.slice(0, 100));
    // Use API Key if available, otherwise anonymous (lower limits but functional)
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}${apiKey}&maxResults=3`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) return [];

        const json = await response.json();
        const items = json.items || [];

        return items.map(item => ({
            source: 'google_books',
            url: item.volumeInfo?.infoLink || item.volumeInfo?.previewLink,
            title: item.volumeInfo?.title || 'Untitled',
            authors: item.volumeInfo?.authors || [],
            similarity: null
        }));

    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') console.warn('[Plagiarism] Google Books request timed out');
        return [];
    }
}

/**
 * Search Google Scholar by scraping.
 * Rate-limited to 1 request. Returns title + URL matches.
 * 
 * NOTE: Google Scholar has no official API.
 * This uses a simple fetch + regex extraction.
 * Production systems should use a proper API service (e.g., SerpAPI).
 */
async function searchGoogleScholar(query) {
    const searchQuery = encodeURIComponent(query.slice(0, 100));
    const url = `https://scholar.google.com/scholar?q=${searchQuery}&hl=en`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) return [];

        const html = await response.text();

        // Extract titles and links (basic regex, not full HTML parser)
        const titleRegex = /<h3[^>]*class="gs_rt"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs;
        const matches = [];
        let match;

        while ((match = titleRegex.exec(html)) !== null && matches.length < 3) {
            const rawTitle = match[2].replace(/<[^>]*>/g, '').trim(); // Strip inner HTML tags
            matches.push({
                source: 'google_scholar',
                url: match[1],
                title: rawTitle,
                similarity: null // We don't compute similarity for external — just flag existence
            });
        }

        return matches;

    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn('[Plagiarism] Google Scholar request timed out');
        }
        return [];
    }
}

/**
 * Search Crossref.org (free, authenticated-optional API).
 * Returns DOI-backed references for matching titles/abstracts.
 */
async function searchCrossref(query) {
    const searchQuery = encodeURIComponent(query.slice(0, 100));
    const url = `https://api.crossref.org/works?query=${searchQuery}&rows=3&select=title,DOI,URL`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'TIP-AI/1.0 (mailto:admin@tipai.dev)'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) return [];

        const json = await response.json();
        const items = json?.message?.items || [];

        return items.map(item => ({
            source: 'crossref',
            url: item.URL || `https://doi.org/${item.DOI}`,
            title: Array.isArray(item.title) ? item.title[0] : (item.title || 'Untitled'),
            doi: item.DOI,
            similarity: null
        }));

    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
            console.warn('[Plagiarism] Crossref request timed out');
        }
        return [];
    }
}

/**
 * Main entry point. Called by analysisWorker.js during the analysis pipeline.
 * 
 * Runs internal + external checks in parallel.
 * Returns a combined result with overall similarity score.
 * 
 * @param {string} text - Extracted document text
 * @param {string} analysisId - Current analysis UUID
 * @param {string} userId - Owner user UUID
 * @returns {Object} { similarity, internal_matches, external_matches }
 */
async function detect(text, analysisId, userId) {
    if (!text || text.trim().length < 100) {
        return {
            similarity: 0,
            internal_matches: [],
            external_matches: [],
            status: 'skipped',
            reason: 'Text too short for meaningful plagiarism check'
        };
    }

    try {
        // Run both checks in parallel — external failures don't block internal
        const [internalResult, externalResult] = await Promise.allSettled([
            checkInternal(text, analysisId, userId),
            checkExternal(text)
        ]);

        const internalMatches = internalResult.status === 'fulfilled'
            ? (internalResult.value.matches || [])
            : [];

        const externalMatches = externalResult.status === 'fulfilled'
            ? (externalResult.value.matches || [])
            : [];

        // Overall similarity = max internal match (external has no numeric similarity)
        const maxInternalSimilarity = internalMatches.length > 0
            ? Math.max(...internalMatches.map(m => m.similarity))
            : 0;

        // Log failures for observability (but don't throw)
        if (internalResult.status === 'rejected') {
            console.error('[Plagiarism] Internal check rejected:', internalResult.reason?.message);
        }
        if (externalResult.status === 'rejected') {
            console.warn('[Plagiarism] External check rejected:', externalResult.reason?.message);
        }

        return {
            similarity: maxInternalSimilarity,
            internal_matches: internalMatches,
            external_matches: externalMatches,
            status: 'completed',
            checked_at: new Date().toISOString()
        };

    } catch (err) {
        // Absolute fallback — plagiarism should never crash the analysis pipeline
        console.error('[Plagiarism] Fatal error (returning empty):', err.message);
        return {
            similarity: 0,
            internal_matches: [],
            external_matches: [],
            status: 'error',
            error: err.message
        };
    }
}

module.exports = { detect };
