import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { normalizeConfidence } from '../utils/confidenceUtils';

// Split into specialized contexts for granular re-renders
const UIContext = createContext();
const DataContext = createContext();
const ActionContext = createContext();
const ScanContext = createContext();

export const useUI = () => useContext(UIContext);
export const useData = () => useContext(DataContext);
export const useActions = () => useContext(ActionContext);
export const useScan = () => useContext(ScanContext);

// Legacy hook for backward compatibility (throttled/grouped)
export const useDashboard = () => {
    return {
        ...useContext(UIContext),
        ...useContext(DataContext),
        ...useContext(ActionContext),
        ...useContext(ScanContext)
    };
};

export const DashboardProvider = ({ children }) => {
    const { session } = useAuth();
    const notify = useNotification();

    // --- UI State ---
    const [dashboardState, setDashboardState] = useState('OVERVIEW');
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [isSubscriptionOpen, setSubscriptionOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [focusedIssue, setFocusedIssue] = useState(null);
    const [isHandshaking, setIsHandshaking] = useState(true);

    // --- Data State ---
    const [files, setFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [integrityAvg, setIntegrityAvg] = useState(0);
    const [totalAudits, setTotalAudits] = useState(0);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [prefetchedData, setPrefetchedData] = useState({
        profile: null,
        securitySetup: null,
        auditLogs: null,
        sessions: null
    });

    // --- Scan State ---
    const [scanStatus, setScanStatus] = useState('Idle');
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // --- System Metrics ---
    const [lagMetrics, setLagMetrics] = useState({
        lastFetchDuration: 0,
        slowOperations: [],
        isLagging: false,
        lagCause: null
    });

    // Ref-based performance tracking (prevents render loops)
    const perfRef = useRef({ slowOps: [] });

    const trackOperation = useCallback(async (name, operation) => {
        const startTime = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - startTime;
            if (duration > 1000) {
                console.warn(`[Perf] Slow Operation: ${name} took ${duration.toFixed(0)}ms`);
            }
            return result;
        } catch (err) {
            console.error(`[Perf] ${name} FAILED:`, err.message);
            throw err;
        }
    }, []);

    // --- Actions ---
    const fetchHistory = useCallback(async (isLoadMore = false) => {
        const currentToken = session?.access_token;
        if (!currentToken) return;

        if (isLoadMore) setLoadingMore(true);
        else setLoadingHistory(true);

        try {
            const outputPage = isLoadMore ? page + 1 : 1;
            const response = await trackOperation('Fetch Analyses', () =>
                axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/analyses?page=${outputPage}&limit=20`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            'ngrok-skip-browser-warning': '69420'
                        }
                    }
                )
            );

            const { data: analysisData, meta, pagination } = response.data;
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
                    forensic_analysis: results?.forensic_analysis,
                    plagiarism: results?.plagiarism,
                    confidence_score: results?.confidence_score
                };
            });

            setFiles(prev => isLoadMore ? [...prev, ...historicalFiles] : historicalFiles);
            if (isLoadMore) setPage(outputPage);
            else setPage(1);

            if (pagination) setHasMore(pagination.hasMore);
            if (meta) {
                setIntegrityAvg(meta.global_integrity_avg || 0);
                setTotalAudits(meta.total_audits || 0);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err.message);
        } finally {
            setLoadingHistory(false);
            setLoadingMore(false);
        }
    }, [session?.access_token, page, trackOperation]);

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) fetchHistory(true);
    }, [loadingMore, hasMore, fetchHistory]);

    const prefetchAllData = useCallback(async () => {
        if (!session?.access_token) return;
        const headers = {
            Authorization: `Bearer ${session.access_token}`,
            'ngrok-skip-browser-warning': '69420'
        };
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        try {
            const endpoints = [
                { key: 'profile', url: `${baseUrl}/api/user/profile` },
                { key: 'securitySetup', url: `${baseUrl}/api/security/setup` },
                { key: 'auditLogs', url: `${baseUrl}/api/security/audit-logs` },
                { key: 'sessions', url: `${baseUrl}/api/security/sessions` }
            ];

            const results = await Promise.allSettled(
                endpoints.map(e => axios.get(e.url, { headers }))
            );

            const fetchedData = {};
            results.forEach((res, i) => {
                const key = endpoints[i].key;
                if (res.status === 'fulfilled') {
                    fetchedData[key] = res.value.data;
                } else {
                    console.warn(`[Handshake] Prefetch failed for ${key}:`, res.reason.message);
                    fetchedData[key] = null;
                }
            });

            setPrefetchedData(fetchedData);
        } catch (err) {
            console.error('[Handshake] Critical prefetch failure:', err);
        }
    }, [session?.access_token]);

    const loadFile = useCallback(async (file) => {
        if (!session?.access_token) return;
        try {
            setActiveFile({ ...file, isFileLoading: true });
            setDashboardState('RESULTS');
            setRightPanelOpen(true);
            setIsChatOpen(false);

            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${file.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'ngrok-skip-browser-warning': '69420'
                    }
                }
            );

            const analysis = response.data;
            const results = analysis.analysis_results?.[0]?.result_json || analysis.results;
            const docInfo = analysis.uploaded_documents?.[0] || {};

            let fileUrl = null;
            let fileBlobData = null;
            try {
                const fileRes = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${file.id}/file`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            'ngrok-skip-browser-warning': '69420'
                        },
                        responseType: 'blob'
                    }
                );
                fileUrl = URL.createObjectURL(fileRes.data);
                fileBlobData = fileRes.data;
            } catch (e) { console.error("Blob fetch failed", e); }

            setActiveFile({
                ...file,
                title: results?.title || file.title,
                fullText: results?.full_text || file.fullText,
                dimensions: results?.dimensions || file.dimensions,
                flags: results?.flags || file.flags,
                forensic_analysis: results?.forensic_analysis || file.forensic_analysis,
                fileUrl,
                fileBlob: fileBlobData,
                mimeType: docInfo.file_type || 'application/octet-stream',
                isFileLoading: false
            });
        } catch (err) {
            console.error('Hydration failed:', err);
            setActiveFile(prev => ({ ...prev, isFileLoading: false }));
        }
    }, [session?.access_token]);

    const inputScan = useCallback(async (uploadedFile) => {
        if (!uploadedFile || !session?.access_token) return;

        setDashboardState('SCANNING');
        setRightPanelOpen(false);
        setScanStatus('Initializing audit...');

        try {
            const init = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/analysis`,
                { filename: uploadedFile.name },
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'ngrok-skip-browser-warning': '69420'
                    }
                }
            );
            const id = init.data.id;
            const optimistic = {
                id,
                filename: uploadedFile.name,
                status: 'scanning',
                title: uploadedFile.name,
                confidence: "Pending",
                fileBlob: uploadedFile,
                fileUrl: URL.createObjectURL(uploadedFile),
                mimeType: uploadedFile.type || 'application/octet-stream'
            };

            setFiles(prev => [optimistic, ...prev]);
            setActiveFile(optimistic);

            // Use backend proxy for upload (same flow as mobile)
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/upload-binary`,
                uploadedFile,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': uploadedFile.type || 'application/octet-stream',
                        'x-filename': uploadedFile.name,
                        'ngrok-skip-browser-warning': '69420'
                    }
                }
            );

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/upload/complete`, {}, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'ngrok-skip-browser-warning': '69420'
                }
            });

            setScanStatus('UNESCO Verification...');
            const pollUrl = `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/status`;
            console.log(`[Polling] Started for ID: ${id} | URL: ${pollUrl}`);
            const interval = setInterval(async () => {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/status`, {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            'ngrok-skip-browser-warning': '69420'
                        }
                    });

                    console.log(`[Polling] ID: ${id} | Response:`, res.data);

                    if (res.data.status === 'COMPLETED') {
                        clearInterval(interval);
                        setScanStatus('Finalizing results...');
                        const result = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/result`, {
                            headers: {
                                Authorization: `Bearer ${session.access_token}`,
                                'ngrok-skip-browser-warning': '69420'
                            }
                        });
                        const model = result.data.result_json || result.data.result || {};
                        const completed = {
                            ...optimistic,
                            status: 'COMPLETED',
                            title: model.title,
                            confidence: model.confidence,
                            confidence_score: model.confidence_score,
                            summary: model.summary,
                            ai_usage: model.ai_usage,
                            dimensions: model.dimensions,
                            flags: model.flags,
                            forensic_analysis: model.forensic_analysis,
                            plagiarism: model.plagiarism,
                            fullText: model.full_text,
                            fileBlob: uploadedFile,
                            fileUrl: URL.createObjectURL(uploadedFile)
                        };
                        setFiles(prev => prev.map(f => f.id === id ? completed : f));
                        setActiveFile(completed);
                        setTimeout(() => {
                            setDashboardState('RESULTS');
                            setRightPanelOpen(true);
                        }, 1500);
                    } else if (res.data.status === 'FAILED') {
                        clearInterval(interval);
                        setDashboardState('UPLOAD');
                        notify.error(`Audit Failed: ${res.data.error_reason || 'Unknown error'}`);
                    }
                } catch (pollErr) {
                    console.error('[Polling Error]', pollErr.response?.data || pollErr.message);
                    // We don't clear interval on network error, just keep trying
                }
            }, 3000);
        } catch (err) {
            console.error('Upload failed:', err.response?.data || err.message);
            setDashboardState('UPLOAD');
            notify.error("Upload Failed");
        }
    }, [session?.access_token, notify]);

    const deleteAnalysis = useCallback(async (id) => {
        if (!session?.access_token) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'ngrok-skip-browser-warning': '69420'
                    }
                }
            );
            setFiles(prev => prev.filter(f => f.id !== id));
            if (activeFile?.id === id) setActiveFile(null);
            notify.success("Analysis deleted successfully");
            fetchHistory(); // Recalculate stats and sync with server
        } catch (err) {
            console.error('Delete failed:', err);
            notify.error("Failed to delete analysis");
        }
    }, [session?.access_token, activeFile?.id, notify]);

    // Initial Handshake
    useEffect(() => {
        if (session?.access_token) {
            const start = performance.now();
            Promise.all([fetchHistory(), prefetchAllData()]).then(() => {
                const elapsed = performance.now() - start;
                setTimeout(() => setIsHandshaking(false), Math.max(0, 2000 - elapsed));
            });
        }
    }, [session?.access_token, fetchHistory, prefetchAllData]);

    // Cleanup lag message
    useEffect(() => {
        if (lagMetrics.lagCause) {
            const t = setTimeout(() => setLagMetrics(p => ({ ...p, lagCause: null })), 5000);
            return () => clearTimeout(t);
        }
    }, [lagMetrics.lagCause]);

    // --- Context Value Memoization ---
    const uiValue = React.useMemo(() => ({
        dashboardState, rightPanelOpen, isSubscriptionOpen, isChatOpen, focusedIssue, isHandshaking, lagMetrics
    }), [dashboardState, rightPanelOpen, isSubscriptionOpen, isChatOpen, focusedIssue, isHandshaking, lagMetrics]);

    const dataValue = React.useMemo(() => ({
        files, activeFile, searchTerm, integrityAvg, totalAudits, loadingHistory, prefetchedData
    }), [files, activeFile, searchTerm, integrityAvg, totalAudits, loadingHistory, prefetchedData]);

    const scanValue = React.useMemo(() => ({
        scanStatus, hasMore, loadingMore
    }), [scanStatus, hasMore, loadingMore]);

    const actionValue = React.useMemo(() => ({
        setDashboardState, setRightPanelOpen, setSubscriptionOpen, setIsChatOpen, setFocusedIssue, setSearchTerm, setActiveFile,
        loadFile, fetchHistory, loadMore, startScan: inputScan, deleteAnalysis
    }), [setDashboardState, setRightPanelOpen, setSubscriptionOpen, setIsChatOpen, setFocusedIssue, setSearchTerm, setActiveFile,
        loadFile, fetchHistory, loadMore, inputScan, deleteAnalysis]);

    return (
        <UIContext.Provider value={uiValue}>
            <DataContext.Provider value={dataValue}>
                <ScanContext.Provider value={scanValue}>
                    <ActionContext.Provider value={actionValue}>
                        {children}
                    </ActionContext.Provider>
                </ScanContext.Provider>
            </DataContext.Provider>
        </UIContext.Provider>
    );
};
