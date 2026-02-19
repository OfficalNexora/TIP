const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../services/supabaseClient');
const storageService = require('../services/storageService');
const analysisQueue = require('../services/analysisQueue');
const scoringService = require('../services/scoringService');
const busboy = require('busboy');

/**
 * Backward-compatibility shim for legacy stored result formats.
 * Ensures `forensic_analysis.pattern_list` is always present when nested pattern payloads exist.
 */
function hydratePatternList(result) {
    if (!result) return result;

    const morphed = JSON.parse(JSON.stringify(result));
    if (!morphed.forensic_analysis) return morphed;

    const existingList = morphed.forensic_analysis.pattern_list;
    if (Array.isArray(existingList) && existingList.length > 0) {
        return morphed;
    }

    const possiblePatterns =
        morphed.forensic_analysis.details?.patterns?.detected_patterns ||
        morphed.forensic_analysis.patterns?.detected_patterns ||
        morphed.details?.patterns?.detected_patterns ||
        morphed.heuristic_analysis?.details?.patterns?.detected_patterns ||
        [];

    if (possiblePatterns.length > 0) {
        morphed.forensic_analysis.pattern_list = possiblePatterns;
    }

    return morphed;
}

// ============================================================================
// 1. Initialize Analysis (Idempotency + Usage Limits)
// ============================================================================
router.post('/', async (req, res) => {
    try {
        const { filename, force } = req.body;
        console.log(`[Handshake 1] Initializing analysis for: ${filename}`);
        console.log(`[Handshake 1] User ID: ${req.user?.id}`);
        console.log(`[Handshake 1] Has req.supabase: ${!!req.supabase}`);

        // Idempotency check
        if (!force) {
            console.log(`[Handshake 1] Step 1: Idempotency check...`);
            const { data: existingAnalysis, error: idempotencyError } = await supabaseAdmin
                .from('analyses')
                .select('id, status, created_at')
                .eq('user_id', req.user.id)
                .eq('filename', filename)
                .neq('status', 'FAILED')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (idempotencyError && idempotencyError.code !== 'PGRST116') {
                console.error(`[Handshake 1] Idempotency check error:`, idempotencyError);
            }

            if (existingAnalysis) {
                console.log(`[Idempotency] Returning existing analysis ${existingAnalysis.id} for ${filename}`);
                return res.status(200).json({
                    id: existingAnalysis.id,
                    status: existingAnalysis.status,
                    message: 'Restored existing analysis session.',
                    isRestored: true
                });
            }
        }

        // Subscription limit enforcement (default 20/month for free; configurable)
        console.log(`[Handshake 1] Step 2: Subscription check...`);
        const { data: userSub, error: subError } = await supabaseAdmin
            .from('users')
            .select('subscription_status')
            .eq('id', req.user.id)
            .single();

        if (subError) {
            console.error(`[Handshake 1] Subscription check error:`, subError);
        }

        const isPro = userSub?.subscription_status?.toLowerCase().includes('pro');
        console.log(`[Handshake 1] isPro: ${isPro}`);

        if (!isPro) {
            const basicLimit = parseInt(process.env.BASIC_SCAN_LIMIT || '20', 10);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            console.log(`[Handshake 1] Step 3: Usage count check...`);
            const { count, error: countError } = await supabaseAdmin
                .from('scan_usage_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', req.user.id)
                .gte('created_at', startOfMonth);

            if (countError) {
                console.error(`[Handshake 1] Usage count error:`, countError);
                throw countError;
            }
            console.log(`[Handshake 1] Usage count: ${count}/${basicLimit}`);

            if (count >= basicLimit) {
                console.warn(`[Limit Reached] User ${req.user.id} has used ${count}/${basicLimit} free scans.`);
                return res.status(403).json({
                    error: 'Monthly scan limit reached.',
                    message: `You have used all ${basicLimit} free scans for this month. Upgrade to Pro for unlimited access.`
                });
            }

            console.log(`[Handshake 1] Step 4: Insert usage log...`);
            const { error: usageInsertError } = await supabaseAdmin.from('scan_usage_logs').insert({
                user_id: req.user.id,
                metadata: { filename: filename || 'unknown' }
            });
            if (usageInsertError) {
                console.error(`[Handshake 1] Usage log insert error:`, usageInsertError);
                // Non-fatal: continue even if logging fails
            }
        }

        // Create analysis record
        console.log(`[Handshake 1] Step 5: Create analysis record...`);
        const { data: analysis, error: analysisError } = await supabaseAdmin
            .from('analyses')
            .insert({
                user_id: req.user.id,
                status: 'PENDING',
                filename: filename || 'Untitled'
            })
            .select()
            .single();

        if (analysisError) {
            console.error(`[Handshake 1] Analysis insert error:`, analysisError);
            throw analysisError;
        }
        console.log(`[Handshake 1] Analysis created: ${analysis.id}`);

        if (filename) {
            console.log(`[Handshake 1] Step 6: Insert uploaded_documents...`);
            const { error: docError } = await supabaseAdmin
                .from('uploaded_documents')
                .insert({
                    analysis_id: analysis.id,
                    filename: filename
                });
            if (docError) {
                console.error(`[Handshake 1] Doc insert error:`, docError);
                throw docError;
            }
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
            code: error.code
        });
    }
});

// ============================================================================
// 2. Upload Flow (3-Step Handshake)
// ============================================================================

// 2.1 Init upload — get signed URL
router.post('/:id/upload/init', async (req, res) => {
    try {
        const { id } = req.params;
        const { filename } = req.body;

        if (!filename) return res.status(400).json({ error: 'Filename is required.' });

        console.log(`[Handshake 1] Init upload for ${id} / ${filename}`);

        // Ownership check
        const { data: analysisCheck, error: authError } = await supabaseAdmin
            .from('analyses')
            .select('user_id')
            .eq('id', id)
            .single();

        if (authError || !analysisCheck) return res.status(404).json({ error: 'Analysis not found.' });
        if (analysisCheck.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

        const { signedUrl, path, token, error } = await storageService.getSignedUploadUrl(filename);
        if (error) throw error;

        const { error: dbError } = await supabaseAdmin
            .from('uploaded_documents')
            .insert({
                analysis_id: id,
                filename: filename,
                storage_path: path,
                file_type: req.body.fileType || 'application/octet-stream'
            });

        if (dbError) throw dbError;

        res.json({ uploadUrl: signedUrl, storagePath: path, token });

    } catch (error) {
        console.error('[Upload Init] Failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2.2 Validate upload parameters
router.put('/:id/upload', async (req, res) => {
    try {
        const { id } = req.params;
        const { filename, fileType, fileSize } = req.body;

        if (fileSize > 50 * 1024 * 1024) {
            return res.status(413).json({ error: 'File exceeds 50MB limit.' });
        }

        const { data: analysis, error } = await supabaseAdmin
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

// 2.3 Receive binary (multipart or raw)
// Helper: ensure document row exists for this analysis (upsert pattern)
async function ensureDocumentRow(supabaseClient, analysisId, filename, mimeType, storagePath) {
    // Delete any stale rows first, then insert fresh — avoids unique constraint and missing-row issues
    await supabaseAdmin.from('uploaded_documents').delete().eq('analysis_id', analysisId);
    const { error } = await supabaseAdmin.from('uploaded_documents').insert({
        analysis_id: analysisId,
        filename,
        file_type: mimeType,
        storage_path: storagePath
    });
    if (error) {
        console.error(`[Upload] Document row upsert failed:`, error);
        throw error;
    }
    console.log(`[Upload] Document row created for analysis ${analysisId} -> ${storagePath}`);
}

router.put('/:id/upload-binary', async (req, res) => {
    const { id } = req.params;

    console.log(`[Handshake 2] Starting binary upload for: ${id}`);
    const contentType = req.headers['content-type'] || '';

    // Pause stream immediately to prevent data loss during async check
    req.pause();

    try {
        // Ownership check (use admin to bypass RLS)
        const { data: analysisCheck, error: checkError } = await supabaseAdmin
            .from('analyses')
            .select('user_id')
            .eq('id', id)
            .single();

        if (checkError || !analysisCheck) {
            if (!res.headersSent) res.status(404).json({ error: 'Analysis not found.' });
            req.destroy();
            return;
        }
        if (analysisCheck.user_id !== req.user.id) {
            if (!res.headersSent) res.status(403).json({ error: 'Forbidden: You do not own this analysis.' });
            req.destroy();
            return;
        }

        if (contentType.includes('multipart/form-data')) {
            const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: 50 * 1024 * 1024 } });

            bb.on('file', (name, file, info) => {
                const { filename, mimeType } = info;
                const chunks = [];

                file.on('data', (chunk) => chunks.push(chunk));

                file.on('end', async () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        console.log(`[Upload] Multipart: ${buffer.length} bytes for ${filename}`);
                        const { path: storagePath, error: uploadError } = await storageService.uploadFile(filename, buffer, mimeType);
                        if (uploadError) throw uploadError;

                        await ensureDocumentRow(supabaseAdmin, id, filename, mimeType, storagePath);
                        res.status(204).send();
                    } catch (err) {
                        console.error('[Upload] Multipart processing failed:', err);
                        if (!res.headersSent) res.status(500).json({ error: err.message });
                    }
                });
            });

            bb.on('error', (err) => {
                console.error('[Upload] Busboy error:', err);
                if (!res.headersSent) res.status(500).json({ error: err.message });
            });

            req.resume();
            req.pipe(bb);
        } else {
            // Direct binary upload
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', async () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const filename = req.headers['x-filename'] || 'document.pdf';
                    const mimeType = contentType || 'application/octet-stream';

                    console.log(`[Upload] Direct binary: ${buffer.length} bytes for ${filename} (${mimeType})`);
                    const { path: storagePath, error: uploadError } = await storageService.uploadFile(filename, buffer, mimeType);
                    if (uploadError) throw uploadError;

                    await ensureDocumentRow(supabaseAdmin, id, filename, mimeType, storagePath);
                    console.log(`[Handshake 2] Upload complete for analysis ${id}. Status: 204`);
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

            req.resume();
        }
    } catch (err) {
        console.error('[Upload Handler] Critical failure:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Upload handler crash.' });
        req.destroy();
    }
});

// 2.4 Finalize upload & trigger worker
router.post('/:id/upload/complete', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Handshake 3] Completing upload for: ${id}`);

        // Ownership check
        const { data: analysisCheck, error: authError } = await supabaseAdmin
            .from('analyses')
            .select('user_id')
            .eq('id', id)
            .single();

        if (authError || !analysisCheck) return res.status(404).json({ error: 'Analysis not found.' });
        if (analysisCheck.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

        const { data: docs, error: docError } = await supabaseAdmin
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

        // Transition -> PROCESSING
        const { error: statusError } = await supabaseAdmin
            .from('analyses')
            .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
            .eq('id', id);

        if (statusError) throw statusError;
        console.log(`[Handshake 3] Analysis ${id} transitioned to PROCESSING.`);

        // Enqueue job
        await analysisQueue.add('analyze-doc', {
            analysisId: id,
            filePath: doc.storage_path,
            mimetype: doc.file_type,
            requestedAt: new Date().toISOString()
        });

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

// ============================================================================
// 3. Analysis Retrieval
// ============================================================================

// Status polling
router.get('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Status API] Request received for: ${id} | User: ${req.user?.id || 'Anonymous'}`);
        }
        const { data, error } = await supabaseAdmin
            .from('analyses')
            .select('user_id, status, updated_at, error_reason')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.warn(`[Status API] Analysis not found: ${id}`);
            return res.status(404).json({ error: 'Analysis not found.' });
        }

        // Ownership check
        if (data.user_id !== req.user.id) {
            console.warn(`[Status API] Forbidden access to: ${id} by User: ${req.user.id}`);
            return res.status(403).json({ error: 'Forbidden.' });
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Status API] Sending status: ${data.status} for: ${id}`);
        }

        res.json({
            status: data.status,
            updated_at: data.updated_at,
            error_reason: data.error_reason
        });
    } catch (error) {
        console.error(`[Status API] CRASH for: ${req.params.id}`, error);
        res.status(500).json({ error: error.message });
    }
});

// Result retrieval
router.get('/:id/result', async (req, res) => {
    try {
        const { id } = req.params;

        // JOIN check: Ensure the analysis belongs to the user
        const { data: results, error } = await supabaseAdmin
            .from('analysis_results')
            .select('*, analyses!inner(user_id)')
            .eq('analysis_id', id)
            .eq('analyses.user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        const data = results?.[0];
        if (error || !data) return res.status(404).json({ error: 'Result not ready or not found.' });

        const hydratedResult = hydratePatternList(data.result_json || data.result);

        res.json({
            ...data,
            result: hydratedResult,
            result_json: hydratedResult
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Full analysis with docs + results (placed AFTER status/result for specificity)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('analyses')
            .select(`*, uploaded_documents(*), analysis_results(*)`)
            .eq('id', id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Analysis not found.' });
        if (data.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });

        if (Array.isArray(data.analysis_results) && data.analysis_results.length > 0) {
            data.analysis_results = data.analysis_results.map(result => ({
                ...result,
                result_json: hydratePatternList(result.result_json || result.result)
            }));
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Document binary retrieval
router.get('/:id/file', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: analysis, error: analysisError } = await supabaseAdmin
            .from('analyses')
            .select('user_id, uploaded_documents(storage_path, file_type, filename)')
            .eq('id', id)
            .single();

        if (analysisError || !analysis) {
            return res.status(404).json({ error: 'Analysis not found.' });
        }
        if (analysis.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const doc = analysis.uploaded_documents?.[0];
        if (!doc || !doc.storage_path) return res.status(404).json({ error: 'Original document not found.' });

        const buffer = await storageService.downloadFile(doc.storage_path);

        res.setHeader('Content-Type', doc.file_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('[File Retrieval Error]', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 4. Delete Analysis
// ============================================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: docs, error: fetchError } = await supabaseAdmin
            .from('uploaded_documents')
            .select('storage_path')
            .eq('analysis_id', id);

        if (fetchError) throw fetchError;

        if (docs && docs.length > 0) {
            const paths = docs.map(d => d.storage_path).filter(Boolean);
            if (paths.length > 0) {
                const { error: storageError } = await supabaseAdmin.storage
                    .from('audit-uploads')
                    .remove(paths);
                if (storageError) console.warn("Storage cleanup failed:", storageError);
            }
        }

        const { error: deleteError } = await supabaseAdmin
            .from('analyses')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Analysis deleted successfully' });

    } catch (error) {
        console.error("Delete failed:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// 5. List Analyses (Paginated)
// ============================================================================
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const { data: analyses, error: analysisError, count } = await supabaseAdmin
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

        const [docsResponse, resultsResponse] = await Promise.all([
            supabaseAdmin.from('uploaded_documents').select('analysis_id, filename').in('analysis_id', analysisIds),
            supabaseAdmin.from('analysis_results').select('analysis_id, result_json').in('analysis_id', analysisIds)
        ]);

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

        const joinedData = analyses.map(analysis => ({
            ...analysis,
            uploaded_documents: docsMap[analysis.id] || [],
            analysis_results: resultsMap[analysis.id] || []
        }));

        const globalAvg = scoringService.computeAverage(joinedData);
        console.log(`[API] fetchHistory (limit=${limit}, offset=${offset}) -> Found: ${count}, Page: ${joinedData.length}, Average Risk: ${globalAvg}%`);

        res.json({
            data: joinedData,
            meta: {
                global_integrity_avg: globalAvg,
                total_audits: count || joinedData.length
            },
            pagination: { total: count, limit, offset }
        });

    } catch (error) {
        console.error('Fetch history failed:', error);
        res.status(500).json({ error: 'Internal server error during history retrieval.' });
    }
});

module.exports = router;
