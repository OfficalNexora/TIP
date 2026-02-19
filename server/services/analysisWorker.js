const { supabase } = require('./supabaseClient');
const storageService = require('./storageService');
const ethicsService = require('./ethicsService');
const heuristicsService = require('./heuristicsService');
const textService = require('./textService');
const scoringService = require('./scoringService');
const plagiarismService = require('./plagiarismService');

/**
 * Derive a deterministic ai_usage label from the heuristic probability score.
 * This replaces the non-deterministic LLM-generated ai_usage field.
 */
function deriveAiUsage(score) {
    if (score >= 60) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
}

class AnalysisWorker {
    /**
     * Orchestrate the asynchronous analysis of a document.
     * 
     * Pipeline:
     * 1. Download file from storage
     * 2. Extract text (PDF/DOCX/OCR/TXT)
     * 3. Run parallel: Ethics (LLM) + Heuristics (Regex) + Plagiarism (worker_threads)
     * 4. Merge results: LLM owns ethics, heuristics owns AI detection, plagiarism owns similarity
     * 5. Persist to DB
     * 
     * @param {string} analysisId 
     * @param {string} filePath 
     * @param {string} mimetype 
     */
    async process(analysisId, filePath, mimetype) {
        const startTime = Date.now();
        try {
            console.log(`[Worker] ========================================`);
            console.log(`[Worker] Starting analysis ${analysisId}`);
            console.log(`[Worker] File: ${filePath}, MimeType: ${mimetype}`);

            // 0. Fetch userId for plagiarism cross-check
            const { data: analysisRecord, error: fetchError } = await supabase
                .from('analyses')
                .select('user_id')
                .eq('id', analysisId)
                .single();

            if (fetchError || !analysisRecord) {
                throw new Error(`Analysis ${analysisId} not found in DB`);
            }
            const userId = analysisRecord.user_id;

            // 1. Download file
            console.log(`[Worker] Phase 1: Downloading file from storage...`);
            const buffer = await storageService.downloadFile(filePath);
            console.log(`[Worker] Downloaded ${buffer.length} bytes`);

            // 2. Extract text
            console.log(`[Worker] Phase 2: Extracting text...`);
            const text = await textService.extractText(buffer, mimetype);

            if (!text || text.trim().length === 0) {
                throw new Error('Could not extract meaningful text from document.');
            }

            console.log(`[Worker] Text extracted: ${text.length} chars`);

            // 3. Parallel AI Audits
            //    - ethicsService: LLM-based UNESCO ethics audit (returns { data, model_name })
            //    - heuristicsService: Deterministic regex-based AI pattern detection
            //    - plagiarismService: n-gram similarity via worker_threads
            console.log(`[Worker] Phase 3: Running parallel audits (ethics + heuristics + plagiarism)...`);
            const aiStartTime = Date.now();

            const [ethicsResult, forensicData, plagiarismData] = await Promise.all([
                ethicsService.analyzeEthics(text),
                heuristicsService.analyze(text),
                plagiarismService.detect(text, analysisId, userId)
            ]);

            const aiDuration = Date.now() - aiStartTime;
            console.log(`[Worker] Parallel audits completed in ${aiDuration}ms`);

            // Destructure ethics result (now returns { data, model_name })
            const auditData = ethicsResult.data || ethicsResult;
            const modelName = ethicsResult.model_name || 'unknown';

            // 4. Build heuristic_analysis block (system-based, deterministic)
            //    This is the SOLE source of AI detection. No LLM involvement.
            const heuristicAnalysis = {
                ai_probability_score: forensicData.ai_probability_score || 0,
                ai_risk_node: forensicData.ai_risk_node || 'Mababa',
                risk_breakdown: forensicData.risk_breakdown || {},
                pattern_list: forensicData.details?.patterns?.detected_patterns || [],
                omission_list: forensicData.details?.omissions?.flagged_omissions || [],
                style_metrics: forensicData.details?.style || {},
                structure: forensicData.details?.structure || {},
                total_pattern_hits: forensicData.details?.patterns?.detected_patterns?.length || 0,
                total_omission_count: forensicData.details?.omissions?.count || 0
            };

            // Derive ai_usage deterministically from heuristic score
            const aiUsage = deriveAiUsage(heuristicAnalysis.ai_probability_score);

            // Debug logging
            console.log(`[Worker] Ethics - Title: ${auditData?.title}, Model: ${modelName}`);
            console.log(`[Worker] Ethics - Confidence: ${auditData?.confidence}`);
            console.log(`[Worker] Ethics - Dimensions: ${Object.keys(auditData?.dimensions || {}).length}`);
            console.log(`[Worker] Heuristics - AI Score: ${heuristicAnalysis.ai_probability_score}%`);
            console.log(`[Worker] Heuristics - Risk: ${heuristicAnalysis.ai_risk_node}`);
            console.log(`[Worker] Heuristics - Patterns: ${heuristicAnalysis.total_pattern_hits}`);
            console.log(`[Worker] AI Usage (derived): ${aiUsage}`);
            console.log(`[Worker] Plagiarism similarity: ${plagiarismData?.similarity || 0}%`);

            // 5. Confidence mapping via scoring service
            const rawConfidence = auditData.confidence || 'mababa';
            const numericConfidence = scoringService.normalize(rawConfidence);
            console.log(`[Worker] Confidence mapping: "${rawConfidence}" -> ${numericConfidence}`);

            // 6. Assemble final result
            //    - auditData: LLM ethics (title, summary, dimensions, flags, confidence)
            //    - heuristic_analysis: Deterministic AI pattern detection (full details)
            //    - ai_usage: Deterministically derived from heuristic score
            //    - plagiarism: Similarity data (internal + external)
            const combinedResult = {
                ...auditData,                           // LLM ethics fields
                ai_usage: aiUsage,                      // Deterministic, NOT from LLM
                heuristic_analysis: heuristicAnalysis,  // Full pattern details (backend canonical)
                // Frontend-facing alias — maps heuristic data to the keys AnalyticPanel.jsx reads
                forensic_analysis: {
                    risk_level: heuristicAnalysis.ai_risk_node || 'Mababa',
                    risk_explanation: `AI probability score: ${heuristicAnalysis.ai_probability_score}%. ${heuristicAnalysis.ai_risk_node === 'Mataas' ? 'Mataas na panganib ng AI-generated content.' : 'Mababang panganib ng AI-generated content.'}`,
                    pattern_hits: heuristicAnalysis.total_pattern_hits || 0,
                    omission_count: heuristicAnalysis.total_omission_count || 0,
                    pattern_list: heuristicAnalysis.pattern_list || [],
                    omission_list: heuristicAnalysis.omission_list || [],
                    pattern_explanation: heuristicAnalysis.total_pattern_hits > 0
                        ? `Nakakita ng ${heuristicAnalysis.total_pattern_hits} AI word pattern(s) sa dokumento.`
                        : null,
                    omission_explanation: heuristicAnalysis.total_omission_count > 0
                        ? `Nakakita ng ${heuristicAnalysis.total_omission_count} omission flag(s) sa dokumento.`
                        : null,
                    style_metrics: heuristicAnalysis.style_metrics || {},
                    ai_probability_score: heuristicAnalysis.ai_probability_score || 0
                },
                plagiarism: plagiarismData,             // Similarity data
                confidence_score: Math.max(numericConfidence, heuristicAnalysis.ai_probability_score || 0),
                full_text: text
            };

            // 7. Persist to DB
            console.log(`[Worker] Phase 4: Persisting to database...`);

            const { error: resultError } = await supabase
                .from('analysis_results')
                .insert({
                    analysis_id: analysisId,
                    result_json: combinedResult,
                    system_prompt_version: 'v3.0-system-heuristics',
                    model_name: modelName
                });

            if (resultError) {
                console.error(`[Worker] Failed to insert analysis_results:`, resultError);
                throw resultError;
            }
            console.log(`[Worker] analysis_results inserted successfully`);

            const { error: statusError } = await supabase
                .from('analyses')
                .update({
                    status: 'COMPLETED',
                    full_text: text,
                    confidence: numericConfidence,
                    updated_at: new Date().toISOString()
                })
                .eq('id', analysisId);

            if (statusError) {
                console.error(`[Worker] Failed to update analyses status:`, statusError);
                throw statusError;
            }

            const totalDuration = Date.now() - startTime;
            console.log(`[Worker] ========================================`);
            console.log(`[Worker] Analysis ${analysisId} COMPLETED`);
            console.log(`[Worker] Confidence: ${numericConfidence}, AI: ${aiUsage}, Duration: ${totalDuration}ms`);
            console.log(`[Worker] ========================================`);

        } catch (error) {
            console.error(`[Worker] ========================================`);
            console.error(`[Worker] Analysis ${analysisId} FAILED`);
            console.error(`[Worker] Error:`, error.message);
            console.error(`[Worker] Stack:`, error.stack);
            console.error(`[Worker] ========================================`);

            await supabase
                .from('analyses')
                .update({
                    status: 'FAILED',
                    error_reason: error.message,
                    updated_at: new Date().toISOString()
                })
                .eq('id', analysisId);
        }
    }
}

module.exports = new AnalysisWorker();
