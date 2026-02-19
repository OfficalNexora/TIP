/**
 * plagiarismWorker.js — CPU-bound similarity computation via worker_threads.
 * 
 * This runs in a separate thread to avoid blocking the Express event loop.
 * Receives text pairs and computes n-gram shingling + Jaccard similarity.
 * 
 * Input (workerData): { sourceText: string, comparisons: [{ id, text }], shingleSize: number }
 * Output (postMessage): { results: [{ id, similarity, matchingShingles: number }] }
 */

const { parentPort, workerData } = require('worker_threads');

/**
 * Generate n-gram shingles from normalized text.
 * Shingle size of 5 words balances sensitivity vs false positives.
 * Using a Set for O(1) lookup during intersection.
 */
function generateShingles(text, n = 5) {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')       // Strip punctuation
        .replace(/\s+/g, ' ')          // Collapse whitespace
        .trim()
        .split(' ')
        .filter(w => w.length > 0);

    if (words.length < n) return new Set([words.join(' ')]);

    const shingles = new Set();
    for (let i = 0; i <= words.length - n; i++) {
        shingles.add(words.slice(i, i + n).join(' '));
    }
    return shingles;
}

/**
 * Jaccard similarity: |A ∩ B| / |A ∪ B|
 * Returns 0-100 percentage.
 * 
 * Time complexity: O(min(|A|, |B|)) for intersection check.
 * This is the hot path — iterate the smaller set.
 */
function jaccardSimilarity(setA, setB) {
    if (setA.size === 0 && setB.size === 0) return 0;

    const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
    let intersection = 0;

    for (const shingle of smaller) {
        if (larger.has(shingle)) intersection++;
    }

    const union = setA.size + setB.size - intersection;
    if (union === 0) return 0;

    return Math.round((intersection / union) * 10000) / 100; // 2 decimal precision
}

/**
 * Find the longest matching text segment for snippet extraction.
 * Returns the first matching shingle as context.
 */
function findMatchSnippet(sourceShingles, targetShingles) {
    for (const shingle of sourceShingles) {
        if (targetShingles.has(shingle)) {
            return `"...${shingle}..."`;
        }
    }
    return null;
}

// --- Main Worker Execution (Persistent) ---
parentPort.on('message', (task) => {
    const { id, sourceText, comparisons, shingleSize = 5 } = task;

    try {
        if (!sourceText || !Array.isArray(comparisons)) {
            parentPort.postMessage({ id, error: 'Invalid worker input', results: [] });
            return;
        }

        const sourceShingles = generateShingles(sourceText, shingleSize);

        const results = comparisons.map(({ id: docId, text }) => {
            if (!text || text.trim().length < 50) {
                return { id: docId, similarity: 0, matchingShingles: 0, snippet: null };
            }

            const targetShingles = generateShingles(text, shingleSize);
            const similarity = jaccardSimilarity(sourceShingles, targetShingles);
            const snippet = similarity > 5 ? findMatchSnippet(sourceShingles, targetShingles) : null;

            // Count exact intersection for detailed reporting
            let matchingShingles = 0;
            if (similarity > 0) {
                for (const s of sourceShingles) {
                    if (targetShingles.has(s)) matchingShingles++;
                }
            }

            return { id: docId, similarity, matchingShingles, snippet };
        });

        // Send back result associated with the Task ID
        parentPort.postMessage({ id, results });

    } catch (error) {
        parentPort.postMessage({ id, error: error.message, results: [] });
    }
});
