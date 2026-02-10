const { supabase } = require('./supabaseClient');
const storageService = require('./storageService');
const ethicsService = require('./ethicsService');
const heuristicsService = require('./heuristicsService');
const textService = require('./textService');
const scoringService = require('./scoringService');
const plagiarismService = require('./plagiarismService');
const plagiarismWebService = require('./plagiarismWebService');

class AnalysisWorker {
    /**
     * Orchestrate the asynchronous analysis of a document.
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

            // 1. Extract Text
            console.log(`[Worker] Phase 1: Downloading file from storage...`);
            const buffer = await storageService.downloadFile(filePath);
            console.log(`[Worker] Downloaded ${buffer.length} bytes`);

            console.log(`[Worker] Phase 2: Extracting text...`);
            const text = await textService.extractText(buffer, mimetype);

            if (!text || text.trim().length === 0) {
                throw new Error('Could not extract meaningful text from document.');
            }

            console.log(`[Worker] Text extracted: ${text.length} chars`);
            console.log(`[Worker] Text preview: "${text.substring(0, 200).replace(/\n/g, ' ')}..."`);

            // 2. AI Audit (Parallel Execution: LLM + Heuristics)
            console.log(`[Worker] Phase 3: Running AI audit (ethics + heuristics in parallel)...`);
            const aiStartTime = Date.now();

            const [auditData, forensicData, plagiarismData, plagiarismWebData] = await Promise.all([
                ethicsService.analyzeEthics(text),
                heuristicsService.analyze(text),
                plagiarismService.detect(text, analysisId)
            ]);

            const aiDuration = Date.now() - aiStartTime;
            console.log(`[Worker] AI audit completed in ${aiDuration}ms`);

            // Debug: Log audit results structure
            console.log(`[Worker] Audit data keys:`, Object.keys(auditData || {}));
            console.log(`[Worker] Audit title:`, auditData?.title);
            console.log(`[Worker] Audit confidence:`, auditData?.confidence);
            console.log(`[Worker] Audit ai_usage:`, auditData?.ai_usage);
            console.log(`[Worker] Dimensions count:`, Object.keys(auditData?.dimensions || {}).length);
            console.log(`[Worker] Flags count:`, (auditData?.flags || []).length);
            console.log(`[Worker] Forensic risk:`, forensicData?.ai_risk_node);
            console.log(`[Worker] Plagiarism (local) similarity: ${plagiarismData?.similarity || 0}, matchId: ${plagiarismData?.matchId || 'none'}`);
            console.log(`[Worker] Plagiarism (web demo) similarity: ${plagiarismWebData?.similarity || 0}, sources: ${plagiarismWebData?.matched_count || 0}`);

            // Merge Heuristics into Audit Data (Don't overwrite LLM forensics)
            const combinedForensics = {
                risk_level: auditData.forensic_analysis?.risk_level || (forensicData.ai_probability_score > 40 ? forensicData.ai_risk_node : 'Mababa'),
                risk_explanation: auditData.forensic_analysis?.risk_explanation || `Forensic analysis detects a ${forensicData.ai_risk_node?.toLowerCase() || 'mababa'} probability of AI-generated content patterns or procedural omissions in the document structure.`,
                ...(auditData.forensic_analysis || {}), // Keep LLM explanations if they exist
                heuristic_score: forensicData.ai_probability_score,
                heuristic_risk: forensicData.ai_risk_node,
                // Prioritize heuristics for raw counts (Pattern Hits/Omissions)
                // STRICT MODE: pattern_hits must equal the actual list length to avoid "ghost" patterns
                pattern_hits: forensicData.pattern_list?.length || forensicData.details?.patterns?.detected_patterns?.length || 0,
                omission_count: forensicData.details?.omissions?.count || auditData.forensic_analysis?.omission_count || 0,
                pattern_list: forensicData.pattern_list || forensicData.details?.patterns?.detected_patterns || [],
                risk_breakdown: forensicData.risk_breakdown
            };

            console.log(`[Worker] Combined Forensics:`, JSON.stringify(combinedForensics, null, 2));

            // 3. Confidence Mapping (Enforce numeric integrity via scoringService)
            const rawConfidence = auditData.confidence || 'mababa';
            const numericConfidence = scoringService.normalize(rawConfidence);
            console.log(`[Worker] Confidence mapping: "${rawConfidence}" -> ${numericConfidence}`);

            const combinedResult = {
                ...auditData,
                forensic_analysis: combinedForensics,
                plagiarism_web: plagiarismWebData,
                plagiarism: plagiarismData,
                confidence_score: numericConfidence, // Explicitly save the numeric score
                full_text: text
            };

            // 4. Atomically Persist Results & Update Status
            console.log(`[Worker] Phase 4: Persisting to database...`);

            const { error: resultError } = await supabase
                .from('analysis_results')
                .insert({
                    analysis_id: analysisId,
                    result_json: combinedResult,
                    system_prompt_version: 'v2.0-unesco-filipino',
                    model_name: 'gemini-2.0-flash'
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
            console.log(`[Worker] Confidence: ${numericConfidence}, Duration: ${totalDuration}ms`);
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
