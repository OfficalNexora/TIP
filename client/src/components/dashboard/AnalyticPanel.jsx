import React, { useState, useEffect, useCallback } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { useTheme } from '../../contexts/ThemeContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';

// --- ISOLATED SUB-COMPONENTS FOR PERFORMANCE ---

const AnimatedRiskCounter = React.memo(({ targetScore }) => {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easedProgress * targetScore);

            setDisplayScore(current);
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [targetScore]);

    return (
        <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900 dark:text-tip-text-main transition-colors">{displayScore}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">% Panganib</span>
        </div>
    );
});

const TypewriterSummary = React.memo(({ fullSummary, activeFileId }) => {
    const [typedSummary, setTypedSummary] = useState('');

    useEffect(() => {
        setTypedSummary('');
        let i = 0;
        const speed = 25; // Optimized for performance and legibility

        const typeChar = () => {
            if (i < fullSummary.length) {
                setTypedSummary(prev => prev + fullSummary.charAt(i));
                i++;
                setTimeout(typeChar, speed);
            }
        };

        const timer = setTimeout(typeChar, 300);
        return () => clearTimeout(timer);
    }, [fullSummary, activeFileId]);

    return (
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium min-h-[60px]">
            {typedSummary}
            <span className="inline-block w-1.5 h-3 bg-blue-500 ml-1 animate-pulse" />
        </p>
    );
});

const AnalyticPanel = React.memo(() => {
    const { activeFile } = useData();
    const { theme } = useTheme();
    const { focusedIssue, rightPanelOpen: isOpen } = useUI();
    const { setFocusedIssue, setRightPanelOpen } = useActions();

    const onClose = () => setRightPanelOpen(false);

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // PANEL RESIZING LOGIC
    const [width, setWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((e) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 320 && newWidth < 800) setWidth(newWidth);
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    // State for patterns and omissions
    const [showPatterns, setShowPatterns] = useState(false);
    const [showOmissions, setShowOmissions] = useState(false);

    if (!isOpen || !activeFile) return null;

    const formatKey = (key) => key.replace(/_/g, ' ').toUpperCase();

    // Institutional Color Logic
    const getAlignmentColor = (alignment) => {
        if (!alignment) return 'text-slate-500';
        const lower = alignment.toLowerCase();
        if (lower.includes('aligned') || lower.includes('ligtas')) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400';
        if (lower.includes('obserbasyon')) return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
        if (lower.includes('pagnilay') || lower.includes('warning')) return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400';
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
    };

    const getIconForDimension = (key) => {
        const lower = key.toLowerCase();
        if (lower.includes('karapatan') || lower.includes('human')) return Icons.Heart;
        if (lower.includes('manakit') || lower.includes('safety')) return Icons.Shield;
        if (lower.includes('pribasiya') || lower.includes('privacy')) return Icons.Lock;
        if (lower.includes('transparency')) return Icons.Eye;
        if (lower.includes('katarungan') || lower.includes('fairness')) return Icons.Scale;
        if (lower.includes('responsibilidad')) return Icons.UserCheck;
        if (lower.includes('kaligtasan') || lower.includes('security')) return Icons.Shield;
        if (lower.includes('sustainability') || lower.includes('kapaligiran')) return Icons.Globe;
        if (lower.includes('inclusiveness')) return Icons.Users;
        if (lower.includes('kamalayan') || lower.includes('awareness')) return Icons.HelpCircle;
        if (lower.includes('governance')) return Icons.Briefcase;
        return Icons.Activity;
    };

    const dimensions = activeFile.dimensions || {};
    const dimensionKeys = Object.keys(dimensions);

    // Confidence Logic: 0 = safe, 25 = low, 50 = moderate, 75 = high, 100 = critical
    const confidenceScore = activeFile.confidence_score || normalizeConfidence(activeFile.confidence);
    let confidenceColor = "bg-emerald-500";
    if (confidenceScore >= 85) confidenceColor = "bg-rose-600";
    else if (confidenceScore >= 60) confidenceColor = "bg-rose-500";
    else if (confidenceScore >= 30) confidenceColor = "bg-amber-500";

    const confidenceLabel = confidenceScore >= 85 ? 'Kritikal na Panganib'
        : confidenceScore >= 60 ? 'Mataas na Panganib'
            : confidenceScore >= 30 ? 'Katamtamang Panganib'
                : 'Mababang Panganib / Ligtas';

    const confidenceBadgeClass = confidenceScore >= 60
        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
        : confidenceScore >= 30
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';

    const handleIssueClick = (issue) => {
        setFocusedIssue(issue);
    };

    const patternList = activeFile.forensic_analysis?.pattern_list
        || activeFile.forensic_analysis?.patterns?.detected_patterns
        || activeFile.forensic_analysis?.details?.patterns?.detected_patterns
        || [];

    const omissionList = activeFile.forensic_analysis?.omission_list
        || activeFile.forensic_analysis?.details?.omissions?.detected_omissions
        || [];

    // Debug: Log what we have
    // console.log('[AnalyticPanel] forensic_analysis:', activeFile.forensic_analysis);
    // console.log('[AnalyticPanel] pattern_list:', patternList);
    // console.log('[AnalyticPanel] omission_list:', omissionList);


    const targetScore = activeFile?.confidence_score || normalizeConfidence(activeFile?.confidence || 0);
    const fullSummary = activeFile?.summary || "Walang available na summary para sa dokumentong ito.";

    return (
        <div
            className="fixed inset-y-0 right-0 border-l shadow-2xl z-50 flex flex-col font-sans text-slate-800 dark:text-tip-text-main transition-colors duration-300"
            style={{
                width: `${width}px`,
                transition: isResizing ? 'none' : 'width 0.1s ease-out',
                backgroundColor: isDark ? '#0f172a' : 'white',
                borderColor: isDark ? '#1e293b' : '#e2e8f0'
            }}
        >
            {/* Resizer */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-[60]"
                onMouseDown={startResizing}
            ></div>

            {/* Header - Clean, Document Style */}
            <div
                className="h-16 px-6 flex items-center justify-between border-b flex-shrink-0 transition-colors"
                style={{
                    backgroundColor: isDark ? '#020617' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#f1f5f9'
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="p-1.5 rounded transition-colors"
                        style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', color: isDark ? '#60a5fa' : '#2563eb' }}
                    >
                        <Icons.FileText size={18} />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-tip-text-main tracking-tight transition-colors">Report ng Pagsunod</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                >
                    <Icons.X size={18} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#F8F9FC] dark:bg-slate-900/50 transition-colors duration-300">

                {/* 1. Summary Card */}
                <InsightCard>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 transition-colors">Pangkalahatang Compliance Risk</h4>
                            <AnimatedRiskCounter targetScore={targetScore} />
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors ${confidenceBadgeClass}`}>
                            {confidenceLabel}
                        </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${confidenceColor}`}
                            style={{ width: `${targetScore}%` }}
                        ></div>
                    </div>

                    {/* Summary Section with Typewriter Effect */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-1000">
                        <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Icons.MessageCircle size={12} />
                            Buod ng Institusyon
                        </h4>
                        <TypewriterSummary fullSummary={fullSummary} activeFileId={activeFile.id} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 transition-colors">Posibilidad ng AI Detection</h4>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium transition-colors">
                            <Icons.Cpu size={16} className="text-slate-400 dark:text-slate-500" />
                            {activeFile.ai_usage || "Pinoproseso..."}
                        </div>
                    </div>
                </InsightCard>

                {/* 2. Forensic Signal Detection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">Pagsusuring Forensic</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Risk Level Node */}
                        <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pagtatasa ng Panganib</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase transition-colors ${activeFile.forensic_analysis?.risk_level === 'Mataas' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                    {activeFile.forensic_analysis?.risk_level || (activeFile.status === 'COMPLETED' ? 'Mababa' : 'Pagsusuri...')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                {activeFile.forensic_analysis?.risk_explanation || (activeFile.status === 'COMPLETED' ? "Ang dokumentong ito ay lumipas sa inisyal na forensic verification." : "Inaanalisa ang pangkalahatang ethical risk profile ng dokumento...")}
                            </p>
                        </div>

                        {/* Metrics Row - Completely Separated */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                type="button"
                                onClick={() => setShowPatterns((prev) => !prev)}
                                className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mga Pattern ng Salitang AI</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                    {activeFile.forensic_analysis ? (activeFile.forensic_analysis.pattern_hits || 0) : '-'}
                                </span>
                                <span className="text-[10px] text-blue-500 mt-1">{showPatterns ? 'I-tago ang listahan' : 'I-pakita ang listahan'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowOmissions((prev) => !prev)}
                                className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mga Flag ng Pagkukulang</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                    {activeFile.forensic_analysis ? (activeFile.forensic_analysis.omission_count || 0) : '-'}
                                </span>
                                <span className="text-[10px] text-rose-500 mt-1">{showOmissions ? 'I-tago ang listahan' : 'I-pakita ang listahan'}</span>
                            </button>
                        </div>

                        {/* Explanations Row - Distinct Cards */}
                        <div className="space-y-3">
                            {showPatterns && patternList.length > 0 && (
                                <div className="bg-tip-surface border border-blue-100 dark:border-blue-900/40 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-2">
                                        <Icons.List size={14} />
                                        <h5 className="text-[11px] font-bold uppercase tracking-wide">Mga Nakitang Pattern ng Salitang AI</h5>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {patternList.map((p, idx) => (
                                            <div key={idx} className="flex items-start justify-between text-xs text-slate-700 dark:text-slate-200">
                                                <span className="mr-2 leading-snug">"{p.pattern || p.text || (typeof p === 'object' ? JSON.stringify(p) : p)}"</span>
                                                <span className="text-[10px] text-slate-500">x{p.count || p.hits || 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {showPatterns && patternList.length === 0 && (
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <Icons.CheckCircle size={14} />
                                        <span className="text-xs">Walang nakitang AI patterns sa dokumentong ito.</span>
                                    </div>
                                </div>
                            )}


                            {showOmissions && omissionList.length > 0 && (
                                <div className="bg-tip-surface border border-rose-100 dark:border-rose-900/40 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-300 mb-2">
                                        <Icons.AlertTriangle size={14} />
                                        <h5 className="text-[11px] font-bold uppercase tracking-wide">Mga Nakitang Flag ng Pagkukulang</h5>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {omissionList.map((o, idx) => (
                                            <div key={idx} className="flex items-start justify-between text-xs text-slate-700 dark:text-slate-200">
                                                <span className="mr-2 leading-snug">"{o.label || o.pattern || o.text || (typeof o === 'object' ? JSON.stringify(o) : o)}"</span>
                                                <span className="text-[10px] text-slate-500">x{o.count || o.hits || 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {showOmissions && omissionList.length === 0 && (
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <Icons.CheckCircle size={14} />
                                        <span className="text-xs">Walang nakitang omission flags sa dokumentong ito.</span>
                                    </div>
                                </div>
                            )}

                            {activeFile.forensic_analysis?.pattern_explanation && (
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/50"></div>
                                    <h5 className="text-[9px] font-bold text-amber-600/80 uppercase mb-1 pl-2">Mga Nakitang Pattern</h5>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                                        {activeFile.forensic_analysis.pattern_explanation}
                                    </p>
                                </div>
                            )}

                            {activeFile.forensic_analysis?.omission_explanation && (
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400/50"></div>
                                    <h5 className="text-[9px] font-bold text-rose-600/80 uppercase mb-1 pl-2">Epekto ng Pagkukulang</h5>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                                        {activeFile.forensic_analysis.omission_explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2.5 Plagiarism / Similarity Detection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">Pagsusuri ng Pagkakatulad / Plagiarism</h4>
                    </div>

                    {activeFile.plagiarism ? (
                        <div className="grid grid-cols-1 gap-3">
                            {/* Overall Similarity Score */}
                            <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal na Pagkakatulad</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase transition-colors ${(activeFile.plagiarism.similarity || 0) > 40
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                                        : (activeFile.plagiarism.similarity || 0) > 15
                                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                        }`}>
                                        {(activeFile.plagiarism.similarity || 0) > 40 ? 'Mataas' : (activeFile.plagiarism.similarity || 0) > 15 ? 'Katamtaman' : 'Mababa'}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-tip-text-main">{parseFloat(activeFile.plagiarism.similarity || 0).toFixed(1)}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">% pagkakatulad</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${(activeFile.plagiarism.similarity || 0) > 40 ? 'bg-rose-500' :
                                            (activeFile.plagiarism.similarity || 0) > 15 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${Math.min(activeFile.plagiarism.similarity || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mga Internal na Tugma</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                        {activeFile.plagiarism.internal_matches?.length || activeFile.plagiarism.match_count || 0}
                                    </span>
                                </div>
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mga External na Pinagmulan</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                        {activeFile.plagiarism.external_sources?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Top Internal Matches */}
                            {activeFile.plagiarism.internal_matches && activeFile.plagiarism.internal_matches.length > 0 && (
                                <div className="bg-tip-surface border border-amber-100 dark:border-amber-900/40 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 mb-2">
                                        <h5 className="text-[11px] font-bold uppercase tracking-wide">Mga Pangunahing Tugma (Internal na Database)</h5>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {activeFile.plagiarism.internal_matches.slice(0, 5).map((match, idx) => (
                                            <div key={idx} className="flex items-start justify-between text-xs text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 pb-1.5 last:border-0">
                                                <span className="mr-2 leading-snug truncate flex-1">{match.filename || match.analysis_id || `Document ${idx + 1}`}</span>
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">{parseFloat(match.similarity || 0).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Clean Result */}
                            {(!activeFile.plagiarism.internal_matches || activeFile.plagiarism.internal_matches.length === 0) && (activeFile.plagiarism.similarity || 0) < 15 && (
                                <div className="bg-tip-surface border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <Icons.CheckCircle size={14} />
                                        <span className="text-xs font-medium">Walang makabuluhang pagkakatulad sa ibang dokumento.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <InsightCard className="border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                                <Icons.Cpu size={16} className="animate-spin" />
                                {activeFile.status === 'COMPLETED' ? 'Walang available na plagiarism data.' : 'Isinasagawa ang similarity check...'}
                            </div>
                        </InsightCard>
                    )}
                </div>

                {/* 3. Critical Flags (Interactive) */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">Mga Flag ng Kritikal na Pagsusuri</h4>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full transition-colors">{activeFile.flags?.length || 0}</span>
                    </div>

                    <div className="space-y-3">
                        {activeFile.flags && activeFile.flags.length > 0 ? (
                            activeFile.flags.map((flag, i) => {
                                const isFocused = focusedIssue?.id === `flag-${i}`;
                                return (
                                    <InsightCard
                                        key={i}
                                        onClick={() => handleIssueClick({
                                            id: `flag-${i}`,
                                            label: flag.label || flag.type || "Kritikal na Flag",
                                            explanation: flag.explanation || flag.detail || flag,
                                            suggestion: flag.suggestion,
                                            revision_prompt: flag.revision_prompt,
                                            snippet: flag.associated_snippet || flag.snippet
                                        })}
                                        className={`group transition-all hover:translate-x-1 ${isFocused ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : 'border-rose-100 dark:border-rose-900/30'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 text-rose-500 dark:text-rose-400 shrink-0">
                                                <Icons.AlertTriangle size={18} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block mb-1">{flag.type || "Kontekstwal na Pagkukulang"}</span>
                                                <p className="text-sm text-slate-900 dark:text-slate-200 font-bold mb-1">{flag.label || (typeof flag === 'string' ? flag : 'May Nakitang Panganib')}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{flag.explanation || flag.detail}</p>
                                            </div>
                                        </div>
                                    </InsightCard>
                                );
                            })
                        ) : (
                            <InsightCard className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                    <Icons.CheckCircle size={16} />
                                    No critical anomalies detected.
                                </div>
                            </InsightCard>
                        )}
                    </div>
                </div>

                {/* 4. UNESCO Principles (Interactive) */}
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main mb-3 transition-colors">Institusyonal na UNESCO Audit</h4>
                    <div className="space-y-3">
                        {dimensionKeys.map((key, i) => {
                            const dim = dimensions[key];
                            const status = dim?.status || dim?.alignment || 'N/A';
                            const alignClass = getAlignmentColor(status);
                            const DimensionIcon = getIconForDimension(key);
                            const isFocused = focusedIssue?.id === `dim-${key}`;

                            return (
                                <InsightCard
                                    key={i}
                                    noPadding
                                    onClick={() => handleIssueClick({
                                        id: `dim-${key}`,
                                        label: formatKey(key),
                                        explanation: dim?.reason || dim?.explanation || "Walang sapat na ebidensya ang natuklasan.",
                                        suggestion: dim?.suggestion,
                                        revision_prompt: dim?.revision_prompt,
                                        snippet: dim?.evidence_snippet || dim?.snippet
                                    })}
                                    className={`overflow-hidden hover:shadow-md transition-all group ${isFocused ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : 'border-slate-100 dark:border-slate-800'}`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                                    <DimensionIcon size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatKey(key)}</span>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase transition-colors ${alignClass}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                            {dim?.reason || dim?.explanation || "Walang sapat na ebidensya ang natuklasan."}
                                        </p>
                                    </div>
                                </InsightCard>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
});

export default AnalyticPanel;

