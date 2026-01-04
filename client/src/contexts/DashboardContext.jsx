import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { normalizeConfidence } from '../utils/confidenceUtils';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
    const { session } = useAuth();
    const notify = useNotification();

    // UI State
    const [dashboardState, setDashboardState] = useState('OVERVIEW');
    const [activeFile, setActiveFile] = useState(null);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [isSubscriptionOpen, setSubscriptionOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [focusedIssue, setFocusedIssue] = useState(null); // { id, label, snippet, suggestion, explanation }

    // Data State
    const [files, setFiles] = useState([]);
    const [integrityAvg, setIntegrityAvg] = useState(0);
    const [totalAudits, setTotalAudits] = useState(0);
    const [scanStatus, setScanStatus] = useState('Idle');
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isHandshaking, setIsHandshaking] = useState(true);
    const lastFetchRef = useRef({ token: null, time: 0 });

    // Pre-fetched data cache (for instant navigation)
    const [prefetchedData, setPrefetchedData] = useState({
        profile: null,
        securitySetup: null,
        auditLogs: null,
        sessions: null
    });

    // Lag detection state
    const [lagMetrics, setLagMetrics] = useState({
        lastFetchDuration: 0,
        slowOperations: [],
        isLagging: false,
        lagCause: null
    });

    // Performance tracking helper
    const trackOperation = useCallback(async (name, operation) => {
        const startTime = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - startTime;

            console.log(`[Perf] ${name}: ${duration.toFixed(0)}ms`);

            // Track slow operations (>1000ms)
            if (duration > 1000) {
                setLagMetrics(prev => ({
                    ...prev,
                    slowOperations: [...prev.slowOperations.slice(-4), { name, duration, time: new Date().toISOString() }],
                    isLagging: duration > 3000,
                    lagCause: duration > 3000 ? `${name} took ${(duration / 1000).toFixed(1)}s` : prev.lagCause
                }));
            }

            return result;
        } catch (err) {
            const duration = performance.now() - startTime;
            console.error(`[Perf] ${name} FAILED after ${duration.toFixed(0)}ms:`, err.message);
            throw err;
        }
    }, []);

    // 1. Fetch History (Paginated)
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchHistory = useCallback(async (isLoadMore = false) => {
        const currentToken = session?.access_token;
        if (!currentToken) return;

        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoadingHistory(true);
        }

        try {
            const outputPage = isLoadMore ? page + 1 : 1;
            console.log(`[History] Fetching page ${outputPage}...`);

            const response = await trackOperation('Fetch Analyses', () =>
                axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/analyses?page=${outputPage}&limit=20`,
                    { headers: { Authorization: `Bearer ${session.access_token}` } }
                ) // Using default limit 20
            );

            const { data: analysisData, meta, pagination } = response.data;

            // Map backend schema
            const historicalFiles = (analysisData || []).map(analysis => {
                const results = analysis.analysis_results?.[0]?.result_json || analysis.results;
                return {
                    id: analysis.id,
                    filename: analysis.uploaded_documents?.[0]?.filename || "Unknown Document",
                    status: analysis.status,
                    title: results?.title || analysis.uploaded_documents?.[0]?.filename || "Untitled",
                    date: new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    confidence: results?.confidence || "Pending",
                    ai_usage: results?.ai_usage || "In Progress",
                    summary: results?.summary,
                    dimensions: results?.dimensions,
                    flags: results?.flags,
                    fullText: results?.full_text,
                    forensic_analysis: results?.forensic_analysis
                };
            });

            if (isLoadMore) {
                setFiles(prev => [...prev, ...historicalFiles]);
                setPage(outputPage);
            } else {
                setFiles(historicalFiles);
                setPage(1);
            }

            // Sync Meta
            if (pagination) setHasMore(pagination.hasMore);
            if (meta) {
                setIntegrityAvg(meta.global_integrity_avg || 0);
                setTotalAudits(meta.total_audits || 0);
            }

        } catch (err) {
            console.error('Failed to fetch scan history:', err?.message || err);
        } finally {
            setLoadingHistory(false);
            setLoadingMore(false);
        }
    }, [session?.access_token, page, trackOperation]);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchHistory(true);
        }
    };

    // Pre-fetch all dashboard data for instant navigation
    const prefetchAllData = useCallback(async () => {
        if (!session?.access_token) return;

        const headers = { Authorization: `Bearer ${session.access_token}` };
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        console.log('[Handshake] Pre-fetching all dashboard data...');
        const startTime = performance.now();

        try {
            // Fetch all data in parallel for speed
            const [profileRes, securityRes, logsRes, sessionsRes] = await Promise.allSettled([
                trackOperation('Fetch Profile', () => axios.get(`${baseUrl}/api/user/profile`, { headers })),
                trackOperation('Fetch Security', () => axios.get(`${baseUrl}/api/security/setup`, { headers })),
                trackOperation('Fetch Audit Logs', () => axios.get(`${baseUrl}/api/security/audit-logs`, { headers })),
                trackOperation('Fetch Sessions', () => axios.get(`${baseUrl}/api/security/sessions`, { headers }))
            ]);

            setPrefetchedData({
                profile: profileRes.status === 'fulfilled' ? profileRes.value.data : null,
                securitySetup: securityRes.status === 'fulfilled' ? securityRes.value.data : null,
                auditLogs: logsRes.status === 'fulfilled' ? logsRes.value.data : null,
                sessions: sessionsRes.status === 'fulfilled' ? sessionsRes.value.data : null
            });

            const totalDuration = performance.now() - startTime;
            console.log(`[Handshake] Pre-fetch complete in ${totalDuration.toFixed(0)}ms`);

            setLagMetrics(prev => ({ ...prev, lastFetchDuration: totalDuration }));

        } catch (err) {
            console.error('[Handshake] Pre-fetch error:', err);
        }
    }, [session?.access_token, trackOperation]);

    // Initial Fetch & Handshake when session is ready
    const tokenStr = session?.access_token;
    useEffect(() => {
        if (tokenStr) {
            console.log('[Handshake] Session detected, starting data hydration...');
            const handshakeStart = performance.now();

            // Start fetching ALL data in parallel
            Promise.all([
                fetchHistory(),
                prefetchAllData()
            ]).then(() => {
                const duration = performance.now() - handshakeStart;
                console.log(`[Handshake] All data loaded in ${duration.toFixed(0)}ms`);

                // Dynamic handshake: finish when data is ready OR after 2s max
                if (duration < 2000) {
                    setTimeout(() => setIsHandshaking(false), 2000 - duration);
                } else {
                    setIsHandshaking(false);
                }
            });

            // Fallback timeout in case something hangs
            const maxTimeout = setTimeout(() => {
                setIsHandshaking(false);
            }, 5000);

            return () => clearTimeout(maxTimeout);
        }
    }, [tokenStr, fetchHistory, prefetchAllData]);

    // Visibility-based refresh: Re-fetch when tab regains focus
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && session?.access_token) {
                console.log('[Visibility] Tab focused, refreshing data...');
                fetchHistory();
                prefetchAllData();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [session?.access_token, fetchHistory, prefetchAllData]);

    // Clear lag warning after 5 seconds
    useEffect(() => {
        if (lagMetrics.lagCause) {
            const timeout = setTimeout(() => {
                setLagMetrics(prev => ({ ...prev, isLagging: false, lagCause: null }));
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [lagMetrics.lagCause]);

    // 2. Load File Detail
    const loadFile = async (file) => {
        if (!session?.access_token) {
            console.warn("Cannot load file without valid session");
            return;
        }

        try {
            // Optimistic set (basic data from list)
            setActiveFile({ ...file, isFileLoading: true });
            setDashboardState('RESULTS');
            setRightPanelOpen(true);

            // Fetch full analysis detail
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${file.id}`,
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );

            const analysis = response.data;
            const results = analysis.analysis_results?.[0]?.result_json || analysis.results;
            const docInfo = analysis.uploaded_documents?.[0] || {};

            // Fetch file blob for High-Fidelity Viewer
            let fileUrl = null;
            let fileBlob = null;
            try {
                const fileResponse = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${file.id}/file`,
                    {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        responseType: 'blob'
                    }
                );
                fileBlob = fileResponse.data;
                fileUrl = URL.createObjectURL(fileBlob);
            } catch (fileErr) {
                console.error('Failed to fetch original file blob:', fileErr);
            }

            const hydratedFile = {
                ...file,
                title: results?.title || file.title,
                fullText: results?.full_text || file.fullText,
                dimensions: results?.dimensions || file.dimensions,
                flags: results?.flags || file.flags,
                forensic_analysis: results?.forensic_analysis || file.forensic_analysis,
                // High-Fidelity Data
                fileUrl,
                fileBlob,
                mimeType: docInfo.file_type || 'application/octet-stream',
                isFileLoading: false
            };
            setActiveFile(hydratedFile);

        } catch (err) {
            console.error('Failed to hydrate analysis detail:', err);
            setActiveFile(prev => ({ ...prev, isFileLoading: false }));
        }
    };

    // 3. Scan Logic (Polled)
    const inputScan = async (uploadedFile) => {
        if (!uploadedFile) return;
        if (!session?.access_token) {
            alert("Session expired. Please log in again.");
            return;
        }

        setDashboardState('SCANNING');
        setRightPanelOpen(false);
        setScanStatus('Initializing institutional audit...');

        try {
            // STEP 1: Create Analysis
            const initAnalysis = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/analysis`,
                { filename: uploadedFile.name },
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            const analysisId = initAnalysis.data.id;
            const optimisticFile = {
                id: analysisId,
                filename: uploadedFile.name,
                status: 'scanning',
                title: uploadedFile.name,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                confidence: "Pending",
                ai_usage: "In Progress"
            };

            // Add scanning card immediately to Overview
            setFiles(prev => [optimisticFile, ...prev]);
            setActiveFile(optimisticFile);

            // STEP 2: Upload
            setScanStatus('Securely transmitting document...');
            const initUpload = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${analysisId}/upload/init`,
                { filename: uploadedFile.name, fileType: uploadedFile.type, fileSize: uploadedFile.size },
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );

            // Use signed URL directly (it's a full Supabase URL, not a relative path)
            await axios.put(
                initUpload.data.uploadUrl,
                uploadedFile,
                {
                    headers: {
                        'Content-Type': uploadedFile.type
                    }
                }
            );

            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${analysisId}/upload/complete`,
                {},
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );

            // STEP 3: Poll
            setScanStatus('Processing against UNESCO protocols...');
            const pollInterval = setInterval(async () => {
                try {
                    const { data: statusData } = await axios.get(
                        `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${analysisId}/status`,
                        { headers: { Authorization: `Bearer ${session.access_token}` } }
                    );

                    if (statusData.status === 'COMPLETED') {
                        clearInterval(pollInterval);
                        setScanStatus('Audit Complete. Finalizing report...');

                        const { data: resultData } = await axios.get(
                            `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${analysisId}/result`,
                            { headers: { Authorization: `Bearer ${session.access_token}` } }
                        );

                        const resultModel = resultData.result_json || resultData.result || {};

                        const completedFile = {
                            id: analysisId,
                            filename: uploadedFile.name,
                            status: 'COMPLETED',
                            title: resultModel.title || uploadedFile.name,
                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            confidence: resultModel.confidence,
                            ai_usage: resultModel.ai_usage,
                            summary: resultModel.summary,
                            dimensions: resultModel.dimensions,
                            flags: resultModel.flags,
                            fullText: resultModel.full_text,
                            forensic_analysis: resultModel.forensic_analysis
                        };

                        // Update the EXISING scanning card in the list
                        setFiles(prev => {
                            const updatedFiles = prev.map(f => f.id === analysisId ? completedFile : f);
                            // Real-time stat update
                            setTotalAudits(updatedFiles.length);
                            const totalSum = updatedFiles.reduce((acc, f) => acc + normalizeConfidence(f.confidence), 0);
                            setIntegrityAvg(Math.round(totalSum / updatedFiles.length));
                            return updatedFiles;
                        });
                        setActiveFile(completedFile);

                        // Give a small delay for the "Audit Complete" message to be read 
                        // and for any overview card animations to play
                        setTimeout(() => {
                            setDashboardState('RESULTS');
                            setRightPanelOpen(true);
                        }, 1500);
                    } else if (statusData.status === 'FAILED') {
                        clearInterval(pollInterval);
                        setFiles(prev => prev.filter(f => f.id !== analysisId)); // Remove failed scan from list
                        setDashboardState('UPLOAD');
                        notify.error('Audit Failed', statusData.error_reason || 'Analysis processing encountered an unexpected error.');
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);

        } catch (err) {
            console.error('[Scan Initialization Error]', err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || "Unknown error";
            const errorCode = err.response?.data?.code ? ` (Code: ${err.response.data.code})` : "";

            setDashboardState('UPLOAD');
            notify.error('Upload Failed', `${errorMsg}${errorCode}`);
        }
    };

    // 4. Delete Analysis
    const deleteAnalysis = async (id) => {
        if (!session?.access_token) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}`,
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );

            // Calculate new stats locally to avoid re-fetching and redundant renders
            setFiles(prev => {
                const updatedFiles = prev.filter(f => f.id !== id);

                // Re-calculate Total Audits
                setTotalAudits(updatedFiles.length);

                // Re-calculate Integrity Average
                if (updatedFiles.length > 0) {
                    const totalSum = updatedFiles.reduce((acc, f) => acc + normalizeConfidence(f.confidence), 0);
                    setIntegrityAvg(Math.round(totalSum / updatedFiles.length));
                } else {
                    setIntegrityAvg(0);
                }

                return updatedFiles;
            });

            // Close panel if deleted file was active
            if (activeFile?.id === id) {
                setRightPanelOpen(false);
                setActiveFile(null);
            }
        } catch (err) {
            console.error("Delete failed:", err);
            notify.error("Action Failed", "Failed to delete analysis. Please try again.");
        }
    };


    return (
        <DashboardContext.Provider value={{
            dashboardState, setDashboardState,
            activeFile, setActiveFile, loadFile,
            files, setFiles,
            searchTerm, setSearchTerm,
            rightPanelOpen, setRightPanelOpen,
            isSubscriptionOpen, setSubscriptionOpen,
            integrityAvg, totalAudits,
            scanStatus, startScan: inputScan,
            loadingHistory, deleteAnalysis,
            isHandshaking,
            // Pagination
            hasMore, loadingMore, loadMore,
            // Pre-fetched data for instant navigation
            prefetchedData,
            // Lag detection metrics
            lagMetrics,
            // Interactive Audit
            focusedIssue, setFocusedIssue
        }}>
            {children}
        </DashboardContext.Provider>
    );
};
