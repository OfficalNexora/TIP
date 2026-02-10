require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security Headers
const multer = require('multer');
const { supabase, supabaseAdmin } = require('./services/supabaseClient');
const { authMiddleware } = require('./middleware/authMiddleware');
const { analyzeEthics, getKeyStatus } = require('./services/ethicsService');
const storageService = require('./services/storageService');
const analysisWorker = require('./services/analysisWorker');
const busboy = require('busboy');
const { getIPLocation, parseUA } = require('./services/geoService');
const scoringService = require('./services/scoringService');
const chatService = require('./services/chatService');
const analysisQueue = require('./services/analysisQueue');
const billingRoutes = require('./routes/billingRoutes');

// --- STARTUP DIAGNOSTICS ---
console.log('[Startup] Node Environment:', process.env.NODE_ENV);
console.log('[Startup] Critical ENV check:');
const criticalVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GROQ_API_KEY', 'CLIENT_URL'];
criticalVars.forEach(v => {
    console.log(`  - ${v}: ${process.env[v] ? 'LOADED ✅' : 'MISSING ❌'}`);
});

try {
    console.log('[Startup] Initializing Analysis Processor...');
    require('./services/analysisProcessor');
    console.log('[Startup] Analysis Processor required successfully.');
} catch (err) {
    console.error('[Startup] FATAL: Failed to load Analysis Processor:', err.message);
    console.error(err.stack);
}
// ---------------------------

/**
 * Ensures the pattern list is correctly extracted and formatted for the frontend.
 * Handles legacy data formats where patterns may be nested under different keys.
 */
function hydratePatternList(result) {
    if (!result) return result;

    // Deep clone to avoid mutating original
    const morphed = JSON.parse(JSON.stringify(result));

    if (morphed.forensic_analysis) {
        // If pattern_list is missing or empty, try to extract from various nested paths
        if (!morphed.forensic_analysis.pattern_list || morphed.forensic_analysis.pattern_list.length === 0) {
            // Try multiple paths where pattern data might be stored
            const possiblePatterns =
                morphed.forensic_analysis.details?.patterns?.detected_patterns || // Standard heuristics path
                morphed.forensic_analysis.patterns?.detected_patterns ||           // Fallback nested path
                morphed.details?.patterns?.detected_patterns ||                    // Root details path
                morphed.heuristic_analysis?.details?.patterns?.detected_patterns || // Alternative heuristic key
                [];

            if (possiblePatterns.length > 0) {
                morphed.forensic_analysis.pattern_list = possiblePatterns;
                console.log(`[hydratePatternList] Hydrated ${possiblePatterns.length} patterns from nested path`);
            }
        }
    }

    return morphed;
}




const getClientIP = (req) => {
    // If client provides a public IP (e.g. from ipify), use it for geolocation.
    // Otherwise fall back to request IP.
    const publicIp = req.headers['x-public-ip'];
    if (publicIp && publicIp !== 'undefined') return publicIp;

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return ip === '::1' ? '127.0.0.1' : ip;
};

const app = express();
const PORT = process.env.PORT || 3000;

// Low-level Health Check (Before all middleware/auth)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Middleware
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: (origin, callback) => {
        const allowed = process.env.CLIENT_URL;
        if (!allowed || allowed === '*' || origin === allowed || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-public-ip', 'x-filename']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Proactive Auth check for all /api paths
app.use('/api', authMiddleware);

app.use('/api/billing', billingRoutes);


// Multer setup (Memory Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// DEBUG: API Key Status Endpoint (for monitoring key health)
app.get('/api/debug/key-status', async (req, res) => {
    try {
        const status = getKeyStatus();
        res.json({
            totalKeys: status.length,
            availableKeys: status.filter(k => k.available).length,
            exhaustedKeys: status.filter(k => !k.available).length,
            keys: status.map(k => ({
                index: k.index,
                keyPreview: k.keyPreview,
                status: k.available ? '✅ Available' : '❌ Exhausted',
                cooldownRemaining: k.cooldownRemaining > 0 ? `${k.cooldownRemaining}s` : null
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// 1. Initialize Analysis (Authoritative Handshake)
app.post('/api/analysis', async (req, res) => {
    try {
        const { filename, force } = req.body; // Added force flag
        console.log(`[Handshake 1] Initializing analysis for: ${filename}`);

        // 0. IDEMPOTENCY CHECK (Prevent Double Billing)
        // If an analysis with this filename exists and is NOT failed, return it.
        if (!force) {
            const { data: existingAnalysis } = await supabase
                .from('analyses')
                .select('id, status, created_at')
                .eq('user_id', req.user.id)
                .eq('filename', filename)
                .neq('status', 'FAILED')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (existingAnalysis) {
                console.log(`[Idempotency] Returning existing analysis ${existingAnalysis.id} for ${filename}`);
                // Return 200 OK (not 201 Created) to signal existing resource
                return res.status(200).json({
                    id: existingAnalysis.id,
                    status: existingAnalysis.status,
                    message: 'Restored existing analysis session.',
                    isRestored: true
                });
            }
        }

        // 0.5. ENFORCE SUBSCRIPTION LIMITS (Raised to 20 Scans / Month for Basic)
        const { data: userSub } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('id', req.user.id)
            .single();

        const isPro = userSub?.subscription_status?.toLowerCase().includes('pro');

        if (!isPro) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Check IMMUTABLE usage logs, not the analyses table (which allows deletion bypass)
            const { count, error: countError } = await supabase
                .from('scan_usage_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', req.user.id)
                .gte('created_at', startOfMonth);

            if (countError) throw countError;

            const BASIC_LIMIT = 20;

            if (count >= BASIC_LIMIT) {
                console.warn(`[Limit Reached] User ${req.user.id} has used ${count}/${BASIC_LIMIT} free scans.`);
                return res.status(403).json({
                    error: 'Monthly scan limit reached.',
                    message: `You have used all ${BASIC_LIMIT} free scans for this month. Upgrade to Pro for unlimited access.`
                });
            }

            // Record usage (Immutable)
            await supabase.from('scan_usage_logs').insert({
                user_id: req.user.id,
                metadata: { filename: filename || 'unknown' }
            });
        }

        // Transactional create: Analysis + Document Placeholder
        const { data: analysis, error: analysisError } = await supabase
            .from('analyses')
            .insert({
                user_id: req.user.id,
                status: 'PENDING',
                filename: filename || 'Untitled'
            })
            .select()
            .single();

        if (analysisError) throw analysisError;

        if (filename) {
            const { error: docError } = await supabase
                .from('uploaded_documents')
                .insert({
                    analysis_id: analysis.id,
                    filename: filename
                });
            if (docError) throw docError;
        }

        console.log(`[Handshake] Analysis ${analysis.id} initialized for user ${req.user.id}`);

        res.status(201).json({
            id: analysis.id,
            status: analysis.status,
            message: 'Analysis initialized. Record persisted.'
        });

    } catch (error) {
        console.error('[Handshake Error] Failed to initialize analysis:', error);
        res.status(500).json({
            error: 'Internal server error during analysis initialization.',
            details: error.message,
            code: error.code // PG error code
        });
    }
});


// PHASE 3: STREAMING UPLOAD HANDSHAKE

// 2.2 Direct File Upload (Chunked / Multipart)
// NEW: 3-Step Flow (Init -> Client Upload -> Complete)
app.post('/api/analyses/:id/upload/init', async (req, res) => {
    try {
        const { id } = req.params;
        const { filename } = req.body;

        if (!filename) return res.status(400).json({ error: 'Filename is required.' });

        console.log(`[Handshake 1] Init upload for ${id} / ${filename}`);

        // Generate Signed URL for client-side upload
        const { signedUrl, path, token, error } = await storageService.getSignedUploadUrl(filename);

        if (error) throw error;

        // Reserve the path in DB (Optional, but good for tracking)
        // We'll finalize it in /complete step.
        const { error: dbError } = await supabase
            .from('uploaded_documents')
            .insert({
                analysis_id: id,
                filename: filename,
                storage_path: path, // Temporary path reservation
                file_type: req.body.fileType || 'application/octet-stream'
            });

        if (dbError) throw dbError;

        res.json({
            uploadUrl: signedUrl,
            storagePath: path,
            token: token
        });

    } catch (error) {
        console.error('[Upload Init] Failed:', error);
        res.status(500).json({ error: error.message });
    }
});



app.put('/api/analyses/:id/upload', async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, fileType, fileSize } = req.body;

        // 50MB Limit Enforcement
        if (fileSize > 50 * 1024 * 1024) {
            return res.status(413).json({ error: 'File exceeds 50MB limit.' });
        }

        const { data: analysis, error } = await supabase
            .from('analyses')
            .select('user_id, status')
            .eq('id', id)
            .single();

        if (error || !analysis) return res.status(404).json({ error: 'Analysis not found.' });
        if (analysis.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });
        if (analysis.status !== 'PENDING') return res.status(400).json({ error: 'Duplicate upload attempt.' });

        res.json({
            uploadUrl: `/api/analyses/${id}/upload-binary`,
            maxSize: 50 * 1024 * 1024
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.2 Streaming Upload Binary (Handshake 2)
app.put('/api/analyses/:id/upload-binary', async (req, res) => {
    const { id } = req.params;

    // SECURITY: Verify ownership before accepting bytes
    // Note: We must use a fresh supabase query here because authMiddleware only verifies the token, not the resource.
    const { data: analysisCheck, error: checkError } = await supabase
        .from('analyses')
        .select('user_id')
        .eq('id', id)
        .single();

    if (checkError || !analysisCheck) {
        return res.status(404).json({ error: 'Analysis not found.' });
    }
    if (analysisCheck.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You do not own this analysis.' });
    }

    console.log(`[Handshake 2] Starting binary upload for: ${id}`);
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('multipart/form-data')) {
        const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: 50 * 1024 * 1024 } });

        bb.on('file', (name, file, info) => {
            const { filename, mimeType } = info;
            const chunks = [];

            file.on('data', (chunk) => chunks.push(chunk));

            file.on('end', async () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const { path: storagePath, error: uploadError } = await storageService.uploadFile(filename, buffer, mimeType);

                    if (uploadError) throw uploadError;

                    const { error: dbError } = await supabase
                        .from('uploaded_documents')
                        .update({
                            filename: filename,
                            file_type: mimeType,
                            storage_path: storagePath
                        })
                        .eq('analysis_id', id);

                    if (dbError) throw dbError;
                    res.status(204).send();
                } catch (err) {
                    console.error('[Upload] Multipart parsing failed:', err);
                    if (!res.headersSent) res.status(500).json({ error: err.message });
                }
            });
        });

        bb.on('error', (err) => {
            console.error('[Upload] Busboy error:', err);
            if (!res.headersSent) res.status(500).json({ error: err.message });
        });
        req.pipe(bb);
    } else {
        // Direct Binary Upload (Axios put file)
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const buffer = Buffer.concat(chunks);
                const filename = req.headers['x-filename'] || 'document.pdf';
                const mimeType = contentType || 'application/octet-stream';

                const { path: storagePath, error: uploadError } = await storageService.uploadFile(filename, buffer, mimeType);

                if (uploadError) throw uploadError;

                const { error: dbError } = await supabase
                    .from('uploaded_documents')
                    .update({
                        filename: filename,
                        file_type: mimeType,
                        storage_path: storagePath
                    })
                    .eq('analysis_id', id);

                if (dbError) throw dbError;
                console.log(`[Handshake 2] Document metadata registered for analysis ${id}. Status: 204`);
                res.status(204).send();
            } catch (err) {
                console.error('[Upload] Direct binary upload failed:', err);
                if (!res.headersSent) res.status(500).json({ error: 'Upload failed.' });
            }
        });

        req.on('error', (err) => {
            console.error('[Upload] Request stream error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Stream error.' });
        });
    }
});

// 2.3 Finalize Upload & Trigger Worker (Handshake 3)
app.post('/api/analyses/:id/upload/complete', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Handshake 3] Completing upload for: ${id}`);

        // 1. Validate document exists
        const { data: docs, error: docError } = await supabase
            .from('uploaded_documents')
            .select('*')
            .eq('analysis_id', id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (docError) {
            console.error('[Handshake 3] DB Error:', docError);
            return res.status(500).json({ error: 'Database error fetching document.' });
        }

        const doc = docs?.[0];
        if (!doc) return res.status(400).json({ error: 'No document found for this analysis.' });

        console.log(`[DEBUG] Document ready for processing:`, {
            analysis_id: id,
            filename: doc.filename,
            file_type: doc.file_type,
            storage_path: doc.storage_path
        });

        // 2. Transition status -> PROCESSING
        const { error: statusError } = await supabase
            .from('analyses')
            .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (statusError) throw statusError;
        console.log(`[Handshake 3] Analysis ${id} transitioned to PROCESSING.`);

        // 3. Trigger Worker (Via Queue)
        console.log(`[DEBUG] Enqueueing Job for ${id}...`);

        try {
            await analysisQueue.add('analyze-doc', {
                analysisId: id,
                filePath: doc.storage_path,
                mimetype: doc.file_type,
                requestedAt: new Date().toISOString()
            });
            console.log(`[Queue] Job added for analysis ${id}`);
        } catch (queueError) {
            // If queue fails, it means even MemoryQueue (fallback) failed. 
            // This should almost never happen unless OOM.
            console.error(`[Queue] FATAL: Failed to enqueue job: ${queueError.message}`);
            throw queueError;
        }

        console.log(`[Queue] Job added for analysis ${id}`);

        res.status(202).json({
            id,
            status: 'PROCESSING',
            message: 'Audit job enqueued.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Status Polling (Authoritative Result Retrieval)
app.get('/api/analyses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('analyses')
            .select(`
                *,
                uploaded_documents(*),
                analysis_results(*)
            `)
            .eq('id', id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Analysis not found.' });
        if (data.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

        // Hydrate pattern list in analysis_results to ensure frontend receives it
        if (data.analysis_results && data.analysis_results.length > 0) {
            data.analysis_results = data.analysis_results.map(result => ({
                ...result,
                result_json: hydratePatternList(result.result_json)
            }));
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
});

app.get('/api/analyses/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('analyses')
            .select('status, updated_at, error_reason')
            .eq('id', id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Analysis not found.' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analyses/:id/result', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: results, error } = await supabase
            .from('analysis_results')
            .select('*')
            .eq('analysis_id', id)
            .order('created_at', { ascending: false })
            .limit(1);

        const data = results?.[0];
        if (error || !data) return res.status(404).json({ error: 'Result not ready or not found.' });

        // Return with 'result' key for frontend compatibility (mapping result_json)
        const hydratedResult = hydratePatternList(data.result_json || data.result);

        res.json({
            ...data,
            result: hydratedResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3.5 Chat Assistant (Groq LLM-powered)
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { message, analysisId, history } = req.body || {};
        const reply = await chatService.generate(message, req.user.id, analysisId, history || []);
        res.json(reply);
    } catch (error) {
        console.error('[Chat] failed:', error);
        res.status(500).json({ error: 'Chat service unavailable.' });
    }
});

// 4. Document Binary Retrieval (High-Fidelity Viewer)
app.get('/api/analyses/:id/file', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ownership & Presence Check
        // 1. Ownership & Presence Check
        const { data: analysis, error: analysisError } = await supabase
            .from('analyses')
            .select('user_id, uploaded_documents(storage_path, file_type, filename)')
            .eq('id', id)
            .single();

        if (analysisError) {
            console.error('[File API] Analysis Lookup Error:', analysisError);
            return res.status(404).json({ error: 'Analysis not found.' });
        }

        if (!analysis) {
            console.error('[File API] Analysis is null');
            return res.status(404).json({ error: 'Analysis not found.' });
        }

        if (analysis.user_id !== req.user.id) {
            console.error(`[File API] Forbidden: ${analysis.user_id} !== ${req.user.id}`);
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const doc = analysis.uploaded_documents?.[0];
        console.log(`[File API] Retrieved Doc:`, JSON.stringify(doc));

        if (!doc || !doc.storage_path) return res.status(404).json({ error: 'Original document not found.' });

        console.log(`[File API] Downloading from storage: ${doc.storage_path}`);

        // 2. Download from Storage
        const buffer = await storageService.downloadFile(doc.storage_path);

        console.log(`[File API] Download success. Size: ${buffer.length} bytes. Type: ${doc.file_type}`);

        // 3. Serve with correct headers
        res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('[File Retrieval Error Stack]', error.stack);
        console.error('[File Retrieval Error MSG]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 3.5. Delete Analysis (Cleanup)
app.delete('/api/analyses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch file path for storage cleanup
        const { data: docs, error: fetchError } = await supabase
            .from('uploaded_documents')
            .select('storage_path')
            .eq('analysis_id', id);

        if (fetchError) throw fetchError;

        // 2. Delete from Storage (if any)
        if (docs && docs.length > 0) {
            const paths = docs.map(d => d.storage_path).filter(Boolean);
            if (paths.length > 0) {
                // Call storage service directly instead of supabase client if needed, 
                // but here we use storageService wrapper or supabase client directly.
                // Assuming storageService has delete or using client:
                const { error: storageError } = await supabase.storage
                    .from('audit-uploads')
                    .remove(paths);

                if (storageError) console.warn("Storage cleanup failed:", storageError);
            }
        }

        // 3. Delete Record (Cascades to results & uploaded_documents)
        const { error: deleteError } = await supabase
            .from('analyses')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id); // Security: Ensure ownership

        if (deleteError) throw deleteError;

        res.json({ message: 'Analysis deleted successfully' });

    } catch (error) {
        console.error("Delete failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. List Analyses (User History Retrieval - Paginated)
// 4. List Analyses (User History Retrieval - Paginated)
app.get('/api/analyses', async (req, res) => {
    try {
        console.log(`[History] Fetching page for user ${req.user.id}...`);
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        // Step 1: Fetch core analyses records (Pagination applied here)
        const { data: analyses, error: analysisError, count } = await supabase
            .from('analyses')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (analysisError) throw analysisError;

        if (!analyses || analyses.length === 0) {
            return res.json({
                data: [],
                meta: { global_integrity_avg: 0, total_audits: 0 },
                pagination: { total: 0, limit, offset }
            });
        }

        const analysisIds = analyses.map(a => a.id);

        // Step 2: Manually fetch related data (Manual Join)
        // This is required because Foreign Keys might be missing in the user's legacy DB schema.
        const [docsResponse, resultsResponse] = await Promise.all([
            supabase.from('uploaded_documents').select('analysis_id, filename').in('analysis_id', analysisIds),
            supabase.from('analysis_results').select('analysis_id, result_json').in('analysis_id', analysisIds)
        ]);

        if (docsResponse.error) console.warn("[History] Failed to fetch docs:", docsResponse.error);
        if (resultsResponse.error) console.warn("[History] Failed to fetch results:", resultsResponse.error);

        const docsMap = {};
        (docsResponse.data || []).forEach(doc => {
            if (!docsMap[doc.analysis_id]) docsMap[doc.analysis_id] = [];
            docsMap[doc.analysis_id].push(doc);
        });

        const resultsMap = {};
        (resultsResponse.data || []).forEach(res => {
            const hydrated = {
                ...res,
                result_json: hydratePatternList(res.result_json || res.result)
            };
            if (!resultsMap[res.analysis_id]) resultsMap[res.analysis_id] = [];
            resultsMap[res.analysis_id].push(hydrated);
        });

        // Step 3: Stitch data together
        const joinedData = analyses.map(analysis => ({
            ...analysis,
            uploaded_documents: docsMap[analysis.id] || [],
            analysis_results: resultsMap[analysis.id] || []
        }));

        // Compute dynamic integrity average
        const globalAvg = scoringService.computeAverage(joinedData);

        // DEBUG: Inspect joined data
        if (joinedData.length > 0) {
            console.log('[History-ManualJoin] Total:', joinedData.length);
            console.log('[History-ManualJoin] Item 0 Docs:', JSON.stringify(joinedData[0].uploaded_documents));
            console.log('[History-ManualJoin] Item 0 Results:', JSON.stringify(joinedData[0].analysis_results));
        }

        res.json({
            data: joinedData,
            meta: {
                global_integrity_avg: globalAvg,
                total_audits: count || joinedData.length
            },
            pagination: {
                total: count,
                limit,
                offset
            }
        });

    } catch (error) {
        console.error('Fetch history failed:', error);
        res.status(500).json({ error: 'Internal server error during history retrieval.' });
    }
});

// 5. User Profile Endpoint (Connected to Supabase)
app.get('/api/user/profile', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Institutional profile not found.' });
        }

        // Map database fields to frontend structure
        res.json({
            id: data.id,
            email: data.email,
            firstName: data.full_name?.split(' ')[0] || "",
            lastName: data.full_name?.split(' ').slice(1).join(' ') || "",
            full_name: data.full_name,
            role: data.role || "Auditor",
            organization: data.organization_id || "UNESCO",
            institutional_id: data.institutional_id || data.id.slice(0, 8),
            settings: data.settings || {},
            subscription_status: data.subscription_status,
            avatarUrl: data.avatar_url || null
        });
    } catch (error) {
        console.error('Profile fetch failed:', error);
        res.status(500).json({ error: 'Internal server error during profile retrieval.' });
    }
});

// 5.1 Update Profile Identity
app.post('/api/user/profile', async (req, res) => {
    try {
        const { firstName, lastName, role, organization, roleDescription } = req.body;
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();

        const updateData = {};
        if (fullName) updateData.full_name = fullName;
        if (role) updateData.role = role;
        if (organization) updateData.organization_id = organization;
        // roleDescription could go into settings or a new column if needed
        if (roleDescription !== undefined) {
            const { data: current } = await supabase.from('users').select('settings').eq('id', req.user.id).single();
            const existingSettings = current?.settings || {};
            // Non-destructive merge
            updateData.settings = { ...existingSettings, roleDescription };
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        // Log security event
        const ip = getClientIP(req);
        const location = await getIPLocation(ip);
        await supabase.from('security_audit_logs').insert({
            user_id: req.user.id,
            event_type: 'PROFILE_UPDATED',
            status: 'SUCCESS',
            location: location,
            user_agent: req.headers['user-agent'],
            metadata: { fields: Object.keys(updateData) }
        });

        res.json({
            message: 'Profile updated successfully.',
            profile: {
                firstName: data.full_name?.split(' ')[0] || "",
                lastName: data.full_name?.split(' ').slice(1).join(' ') || "",
                role: data.role,
                organization: data.organization_id,
                settings: data.settings
            }
        });
    } catch (error) {
        console.error('Profile update failed:', error);
        res.status(500).json({ error: 'Failed to update institutional profile.' });
    }
});

// 5.2 Avatar Upload (Profile Photo)
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for avatars
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
}).single('avatar');

app.post('/api/user/avatar', (req, res) => {
    avatarUpload(req, res, async (err) => {
        if (err) {
            console.error('[Avatar] Upload error:', err);
            return res.status(400).json({ error: err.message || 'Upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        try {
            const userId = req.user.id;
            const file = req.file;
            const ext = file.originalname.split('.').pop() || 'jpg';
            const storagePath = `${userId}/profile.${ext}`;

            console.log(`[Avatar] Uploading for user ${userId}: ${file.originalname}`);

            // Upload to Supabase Storage (avatars bucket)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true // Overwrite if exists
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(storagePath);

            const avatarUrl = urlData.publicUrl;

            // Update user record
            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar_url: avatarUrl })
                .eq('id', userId);

            if (dbError) throw dbError;

            console.log(`[Avatar] Upload complete: ${avatarUrl}`);
            res.json({ avatarUrl });

        } catch (error) {
            console.error('[Avatar] Upload failed:', error);
            res.status(500).json({ error: 'Failed to upload avatar' });
        }
    });
});

// 6. Settings and Subscription Endpoints (Expansion)
app.post('/api/user/settings', async (req, res) => {
    try {
        const { settings } = req.body;

        // Fetch existing settings to prevent clobbering
        const { data: current } = await supabase
            .from('users')
            .select('settings')
            .eq('id', req.user.id)
            .single();

        const mergedSettings = { ...(current?.settings || {}), ...(settings || {}) };

        const { data, error } = await supabase
            .from('users')
            .update({ settings: mergedSettings })
            .eq('id', req.user.id)
        if (error) throw error;
        res.json({ message: 'Settings updated successfully.', data });
    } catch (error) {
        console.error('Settings update failed:', error);
        res.status(500).json({ error: 'Failed to persist settings.' });
    }
});

// 7. Security Endpoints (Institutional Grade)

// 7.1 Get Security Status (2FA, Backup Codes existence)
app.get('/api/security/setup', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_security')
            .select('two_factor_enabled, backup_codes, last_password_change')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Allow not found (first time)

        const hasBackupCodes = data?.backup_codes && Array.isArray(data.backup_codes) && data.backup_codes.length > 0;

        res.json({
            two_factor_enabled: data?.two_factor_enabled || false,
            has_backup_codes: hasBackupCodes,
            last_password_change: data?.last_password_change || null
        });
    } catch (error) {
        console.error('Security status fetch failed:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 7.2 Save Backup Codes (Accepts SHA-256 hashes from client)
app.post('/api/security/backup-codes/save', async (req, res) => {
    try {
        const { hashes } = req.body;

        if (!hashes || !Array.isArray(hashes) || hashes.length !== 8) {
            return res.status(400).json({ error: 'Invalid hashes payload. 8 hashes required.' });
        }

        const codesPayload = hashes.map(hash => ({ hash, used: false }));

        // Upsert into user_security
        const { error } = await supabase
            .from('user_security')
            .upsert({
                user_id: req.user.id,
                backup_codes: codesPayload,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        // Log the action
        await supabase.from('security_audit_logs').insert({
            user_id: req.user.id,
            event_type: 'BACKUP_CODES_GENERATED',
            status: 'SUCCESS',
            location: location,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Backup codes saved securely.' });
    } catch (error) {
        console.error('Backup code save failed:', error);
        res.status(500).json({ error: 'Failed to save backup codes.' });
    }
});

// 7.3 Get Audit Logs
app.get('/api/security/audit-logs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('security_audit_logs')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Audit log fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
});

// 7.4 Log Event (Client-side trigger)
app.post('/api/security/audit-log', async (req, res) => {
    try {
        const { event_type, status, metadata } = req.body;
        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        const { error } = await supabase
            .from('security_audit_logs')
            .insert({
                user_id: req.user.id,
                event_type: event_type || 'UNKNOWN_EVENT',
                status: status || 'INFO',
                location: location,
                user_agent: req.headers['user-agent'],
                metadata: metadata || {}
            });

        if (error) throw error;
        res.status(201).json({ message: 'Event logged.' });
    } catch (error) {
        console.error('Audit logging failed:', error);
        // Don't fail the client flow for logging errors
        res.status(200).json({ warning: 'Logging failed but request handled.' });
    }
});

// 7.5 Get Active Sessions
app.get('/api/security/sessions', async (req, res) => {
    try {
        const currentIp = getClientIP(req);
        const currentUserAgent = req.headers['user-agent'];
        const currentDevice = parseUA(currentUserAgent);
        const currentLocation = await getIPLocation(currentIp);

        // Fallback: Direct 'auth' schema access is blocked by default PostgREST security.
        const sessions = [
            {
                id: 'current',
                device: currentDevice,
                location: currentLocation,
                status: 'current',
                lastActive: 'Active Now',
                isCurrent: true,
                ip: currentIp
            }
        ];

        res.json(sessions);
    } catch (error) {
        console.error('Session fetch failed:', error);
        res.status(500).json({ error: 'Failed to fetch sessions.' });
    }
});

// 7.8 Update Password
app.post('/api/security/password', async (req, res) => {
    try {
        const userId = req.user.id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        console.log(`[Security] Updating password for user: ${userId}`);

        // Use isolated admin client to update password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (updateError) {
            console.error('[Security] Password update failed:', updateError);
            return res.status(updateError.status || 500).json({
                error: 'Failed to update password.',
                details: updateError.message
            });
        }

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        // Log the event
        await supabase.from('security_audit_logs').insert({
            user_id: userId,
            event_type: 'PASSWORD_CHANGE',
            status: 'SUCCESS',
            location: location,
            ip_address: ip,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('[Security] Password update crashed:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// 7.6 Revoke All Sessions (Sign Out All Devices)
app.post('/api/security/sessions/revoke-all', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[Security] Revoking ALL sessions for user: ${userId}`);

        if (!userId) {
            return res.status(400).json({ error: 'User ID missing from request.' });
        }

        // NUCLEAR REVOCATION: The current SDK signOut(uid) is unsupported/broken for IDs.
        // Banning a user for 1s forces Supabase to invalidate all their active refresh tokens.
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: '1s'
        });

        if (banError) {
            console.error('[Security] Nuclear Ban failed:', JSON.stringify(banError, null, 2));
            return res.status(banError.status || 403).json({
                error: 'Revocation failed at ban step.',
                details: banError.message
            });
        }

        // Immediately unban (remove duration) so they can log back in if they want
        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: 'none'
        });

        if (unbanError) {
            console.error('[Security] Nuclear Unban failed:', unbanError);
            // We don't fail the whole request since the ban *did* happen and will expire in 1s anyway
        }

        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        // Log the event to our audit table
        const { error: logError } = await supabase.from('security_audit_logs').insert({
            user_id: userId,
            event_type: 'ALL_SESSIONS_REVOKED',
            status: 'SUCCESS',
            location: location,
            ip_address: ip,
            user_agent: req.headers['user-agent']
        });

        if (logError) {
            console.error('[Security] Audit log insertion failed:', logError);
            // We don't fail the whole request if just logging failed, but we return success with a warning
            return res.json({ message: 'All devices signed out, but activity log failed.', warning: logError.message });
        }

        res.json({ message: 'All devices signed out successfully.' });
    } catch (error) {
        console.error('[Security] Sign out all process crashed:', error);
        res.status(500).json({
            error: 'Internal server error during sign out.',
            details: error.message
        });
    }
});

// 7.7 Revoke Other Sessions
app.post('/api/security/sessions/revoke', async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`[Security] Revoking OTHER sessions for user: ${userId}`);

        // Use isolated admin client + Nuclear workaround
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: '1s'
        });

        if (banError) {
            console.warn('[Security] Admin revoke (others) failed:', banError.message);
            throw banError;
        }

        await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' });

        res.json({ message: 'Other sessions revoked successfully.' });
    } catch (error) {
        console.error('[Security] Revoke process failed:', error);
        res.status(500).json({
            error: 'Failed to revoke other sessions.',
            details: error.message
        });
    }
});

// 7.8 Revoke Specific Session
app.post('/api/security/sessions/revoke/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Since we don't have real session IDs in the dummy list, this is a mock handler
        // If we had real IDs, we would use supabase.auth.admin.deleteSession(sessionId) (if available)
        // or generally we can't easily target one without storage.

        console.log(`Requested revoke for session ${sessionId} - Not fully implemented without session storage.`);

        res.json({ message: 'Session revocation request processed.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process revocation.' });
    }
});

// 7.8 Clear Audit Logs
app.delete('/api/security/audit-logs', async (req, res) => {
    try {
        const { error } = await supabase
            .from('security_audit_logs')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        // Log the event
        const ip = getClientIP(req);
        const location = await getIPLocation(ip);

        await supabase.from('security_audit_logs').insert({
            user_id: req.user.id,
            event_type: 'AUDIT_LOGS_CLEARED',
            status: 'SUCCESS',
            location: location,
            user_agent: req.headers['user-agent']
        });

        res.json({ message: 'Audit logs cleared successfully.' });
    } catch (error) {
        console.error('Failed to clear audit logs:', error);
        res.status(500).json({ error: 'Failed to clear logs.' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// GLOBAL ERROR HANDLERS (Institutional Debugging)
process.on('uncaughtException', (error) => {
    console.error('CRITICAL: Uncaught Exception detected!');
    console.error(error.stack || error);
    // In production, we might want to exit(1), but for debugging TIP we log and stay alive if possible
    // (Wait, standard practice is to exit because state might be corrupted)
    // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at path:', promise);
    console.error('Reason:', reason);
});

// HEARTBEAT & EXIT DIAGNOSTICS
console.log('[Diagnostic] Heartbeat started.');
setInterval(() => {
    console.log(`[Heartbeat] Server alive at ${new Date().toLocaleTimeString()} | Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
}, 10000); // Removed .unref() to PIN the process. Increased to 10s.

// Monkey-patch process.exit to catch silent exits
const originalExit = process.exit;
process.exit = function (code) {
    const err = new Error('Caught process.exit');
    console.error(`[Security/Debug] process.exit(${code}) was called from:`);
    console.error(err.stack);
    originalExit(code);
};

process.on('exit', (code) => {
    console.log(`[Diagnostic] Process is exiting with code: ${code}`);
});
