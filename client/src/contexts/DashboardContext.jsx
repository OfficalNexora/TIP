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
                    { headers: { Authorization: `Bearer ${session.access_token}` } }
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
                    forensic_analysis: results?.forensic_analysis
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
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        try {
            const results = await Promise.allSettled([
                axios.get(`${baseUrl}/api/user/profile`, { headers }),
                axios.get(`${baseUrl}/api/security/setup`, { headers }),
                axios.get(`${baseUrl}/api/security/audit-logs`, { headers }),
                axios.get(`${baseUrl}/api/security/sessions`, { headers })
            ]);

            setPrefetchedData({
                profile: results[0].status === 'fulfilled' ? results[0].value.data : null,
                securitySetup: results[1].status === 'fulfilled' ? results[1].value.data : null,
                auditLogs: results[2].status === 'fulfilled' ? results[2].value.data : null,
                sessions: results[3].status === 'fulfilled' ? results[3].value.data : null
            });
        } catch (err) {
            console.error('Prefetch failed:', err);
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
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );

            const analysis = response.data;
            const results = analysis.analysis_results?.[0]?.result_json || analysis.results;
            const docInfo = analysis.uploaded_documents?.[0] || {};

            let fileUrl = null;
            try {
                const fileRes = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${file.id}/file`,
                    { headers: { Authorization: `Bearer ${session.access_token}` }, responseType: 'blob' }
                );
                fileUrl = URL.createObjectURL(fileRes.data);
            } catch (e) { console.error("Blob fetch failed", e); }

            setActiveFile({
                ...file,
                title: results?.title || file.title,
                fullText: results?.full_text || file.fullText,
                dimensions: results?.dimensions || file.dimensions,
                flags: results?.flags || file.flags,
                forensic_analysis: results?.forensic_analysis || file.forensic_analysis,
                fileUrl,
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
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            const id = init.data.id;
            const optimistic = { id, filename: uploadedFile.name, status: 'scanning', title: uploadedFile.name, confidence: "Pending" };

            setFiles(prev => [optimistic, ...prev]);
            setActiveFile(optimistic);

            const uploadInit = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/upload/init`,
                { filename: uploadedFile.name, fileType: uploadedFile.type, fileSize: uploadedFile.size },
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );

            await axios.put(uploadInit.data.uploadUrl, uploadedFile, { headers: { 'Content-Type': uploadedFile.type } });
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/upload/complete`, {}, { headers: { Authorization: `Bearer ${session.access_token}` } });

            setScanStatus('UNESCO Verification...');
            const interval = setInterval(async () => {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/status`, { headers: { Authorization: `Bearer ${session.access_token}` } });
                if (res.data.status === 'COMPLETED') {
                    clearInterval(interval);
                    const result = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}/result`, { headers: { Authorization: `Bearer ${session.access_token}` } });
                    const model = result.data.result_json || result.data.result || {};
                    const completed = { ...optimistic, status: 'COMPLETED', title: model.title, confidence: model.confidence, summary: model.summary };
                    setFiles(prev => prev.map(f => f.id === id ? completed : f));
                    setActiveFile(completed);
                    setTimeout(() => { setDashboardState('RESULTS'); setRightPanelOpen(true); }, 1500);
                } else if (res.data.status === 'FAILED') {
                    clearInterval(interval);
                    setDashboardState('UPLOAD');
                    notify.error("Audit Failed");
                }
            }, 3000);
        } catch (err) {
            setDashboardState('UPLOAD');
            notify.error("Upload Failed");
        }
    }, [session?.access_token, notify]);

    const deleteAnalysis = useCallback(async (id) => {
        if (!session?.access_token) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/analyses/${id}`,
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            setFiles(prev => prev.filter(f => f.id !== id));
            if (activeFile?.id === id) setActiveFile(null);
            notify.success("Analysis deleted successfully");
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

    return (
        <UIContext.Provider value={{ dashboardState, rightPanelOpen, isSubscriptionOpen, isChatOpen, focusedIssue, isHandshaking, lagMetrics }}>
            <DataContext.Provider value={{ files, activeFile, searchTerm, integrityAvg, totalAudits, loadingHistory, prefetchedData }}>
                <ScanContext.Provider value={{ scanStatus, hasMore, loadingMore }}>
                    <ActionContext.Provider value={{
                        setDashboardState, setRightPanelOpen, setSubscriptionOpen, setIsChatOpen, setFocusedIssue, setSearchTerm, setActiveFile,
                        loadFile, fetchHistory, loadMore, startScan: inputScan, deleteAnalysis
                    }}>
                        {children}
                    </ActionContext.Provider>
                </ScanContext.Provider>
            </DataContext.Provider>
        </UIContext.Provider>
    );
};
