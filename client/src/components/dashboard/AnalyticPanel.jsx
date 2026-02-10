import React, { useState, useEffect, useCallback } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useDashboard } from '../../contexts/DashboardContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';

const AnalyticPanel = ({ activeFile, isOpen, onClose }) => {
    const { focusedIssue, setFocusedIssue } = useDashboard();

    // State for panel width (default 450px - standard sidebar width)
    const [width, setWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const [showPatterns, setShowPatterns] = useState(false);

    const startResizing = useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - mouseMoveEvent.clientX;
            // Clamp width sensible for a document inspector
            if (newWidth > 350 && newWidth < 700) {
                setWidth(newWidth);
            }
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

    // Confidence Logic
    const confidenceScore = activeFile.confidence_score || normalizeConfidence(activeFile.confidence);
    let confidenceColor = "bg-emerald-500"; // Default nice green (Low Risk)
    if (confidenceScore > 70) confidenceColor = "bg-rose-500"; // High Risk
    else if (confidenceScore > 40) confidenceColor = "bg-amber-500"; // Moderate Risk

    const handleIssueClick = (issue) => {
        setFocusedIssue(issue);
    };

    const patternList = activeFile.forensic_analysis?.pattern_list
        || activeFile.forensic_analysis?.patterns?.detected_patterns
        || activeFile.forensic_analysis?.details?.patterns?.detected_patterns
        || [];

    // Debug: Log what we have
    console.log('[AnalyticPanel] forensic_analysis:', activeFile.forensic_analysis);
    console.log('[AnalyticPanel] pattern_list:', patternList);


    return (
        <div
            className="fixed inset-y-0 right-0 bg-tip-surface border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col font-sans text-slate-800 dark:text-tip-text-main transition-colors duration-300"
            style={{ width: `${width}px`, transition: isResizing ? 'none' : 'width 0.1s ease-out' }}
        >
            {/* Resizer */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-[60]"
                onMouseDown={startResizing}
            ></div>

            {/* Header - Clean, Document Style */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-tip-surface flex-shrink-0 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 transition-colors">
                        <Icons.FileText size={18} />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-tip-text-main tracking-tight transition-colors">Compliance Report</span>
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
                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 transition-colors">Panganib ng AI Pattern (Posibilidad)</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-slate-900 dark:text-tip-text-main transition-colors">{confidenceScore}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">% Panganib</span>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors ${confidenceScore > 70 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                            {confidenceScore > 70 ? 'Mataas na Panganib' : 'Mababang Panganib / Ligtas'}
                        </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${confidenceColor}`}
                            style={{ width: `${confidenceScore}%` }}
                        ></div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 transition-colors">Posibilidad ng AI Detection</h4>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium transition-colors">
                            <Icons.Cpu size={16} className="text-slate-400 dark:text-slate-500" />
                            {activeFile.ai_usage || "Processing..."}
                        </div>
                    </div>
                </InsightCard>

                {/* 2. Forensic Signal Detection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">Forensic Analysis</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Risk Level Node */}
                        <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Assessment</span>
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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Word Patterns</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                    {activeFile.forensic_analysis ? (activeFile.forensic_analysis.pattern_hits || 0) : '-'}
                                </span>
                                <span className="text-[10px] text-blue-500 mt-1">{showPatterns ? 'Hide list' : 'Show list'}</span>
                            </button>
                            <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Omission Flags</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                    {activeFile.forensic_analysis ? (activeFile.forensic_analysis.omission_count || 0) : '-'}
                                </span>
                            </div>
                        </div>

                        {/* Explanations Row - Distinct Cards */}
                        <div className="space-y-3">
                            {showPatterns && patternList.length > 0 && (
                                <div className="bg-tip-surface border border-blue-100 dark:border-blue-900/40 p-3 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-2">
                                        <Icons.List size={14} />
                                        <h5 className="text-[11px] font-bold uppercase tracking-wide">Detected AI Word Patterns</h5>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                        {patternList.map((p, idx) => (
                                            <div key={idx} className="flex items-start justify-between text-xs text-slate-700 dark:text-slate-200">
                                                <span className="mr-2 leading-snug">"{p.pattern || p.text || p}"</span>
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


                            {activeFile.forensic_analysis?.pattern_explanation && (
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/50"></div>
                                    <h5 className="text-[9px] font-bold text-amber-600/80 uppercase mb-1 pl-2">Detected Patterns</h5>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                                        {activeFile.forensic_analysis.pattern_explanation}
                                    </p>
                                </div>
                            )}

                            {activeFile.forensic_analysis?.omission_explanation && (
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400/50"></div>
                                    <h5 className="text-[9px] font-bold text-rose-600/80 uppercase mb-1 pl-2">Omission Impact</h5>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
                                        {activeFile.forensic_analysis.omission_explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Critical Flags (Interactive) */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">Critical Analysis Flags</h4>
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
                                            label: flag.label || flag.type || "Critical Flag",
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
                                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block mb-1">{flag.type || "Contextual Omission"}</span>
                                                <p className="text-sm text-slate-900 dark:text-slate-200 font-bold mb-1">{flag.label || (typeof flag === 'string' ? flag : 'Risk Detected')}</p>
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
                    <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main mb-3 transition-colors">Institutional UNESCO Audit</h4>
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
};

export default AnalyticPanel;

