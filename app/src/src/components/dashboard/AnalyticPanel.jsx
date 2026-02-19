import React, { useState, useEffect, useCallback } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';

const AnalyticPanel = () => {
    const { activeFile } = useData();
    const { focusedIssue, rightPanelOpen: isOpen } = useUI();
    const { setFocusedIssue, setRightPanelOpen } = useActions();

    const onClose = () => setRightPanelOpen(false);

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

    const getAlignmentColor = (alignment) => {
        if (!alignment) return 'text-slate-500';
        const lower = alignment.toLowerCase();
        if (lower.includes('aligned') || lower.includes('ligtas')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        if (lower.includes('obserbasyon')) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        if (lower.includes('pagnilay') || lower.includes('warning')) return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
        return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
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

    const confidenceScore = activeFile.confidence_score || normalizeConfidence(activeFile.confidence);
    let confidenceColor = "bg-emerald-500";
    if (confidenceScore > 70) confidenceColor = "bg-rose-500";
    else if (confidenceScore > 40) confidenceColor = "bg-amber-500";

    const handleIssueClick = (issue) => {
        setFocusedIssue(issue);
    };

    const patternList = activeFile.forensic_analysis?.pattern_list
        || activeFile.forensic_analysis?.patterns?.detected_patterns
        || activeFile.forensic_analysis?.details?.patterns?.detected_patterns
        || [];

    return (
        <div
            className="fixed inset-y-0 right-0 glass-panel border-l border-white/5 z-50 flex flex-col animate-in slide-in-from-right duration-500"
            style={{ width: `${width}px`, transition: isResizing ? 'none' : 'width 0.2s ease-out' }}
        >
            {/* Resizer */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-[60]"
                onMouseDown={startResizing}
            />

            {/* Header */}
            <div className="h-20 px-8 flex items-center justify-between border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center border-white/10 text-indigo-400">
                        <Icons.Activity size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional</span>
                        <span className="text-sm font-black text-white tracking-tight">Audit Metrics</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors border-white/5"
                >
                    <Icons.X size={18} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar pb-32">

                {/* 1. Global Risk Summary */}
                <div className="relative group">
                    <div className={`absolute inset-0 blur-3xl opacity-10 transition-colors duration-1000 ${confidenceScore > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                    <InsightCard className="relative z-10 overflow-hidden">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Integrity Heuristics</h4>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-6xl font-black text-white tracking-tighter">{confidenceScore}</span>
                                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">% RISK</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                ${confidenceScore > 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                            `}>
                                {confidenceScore > 70 ? 'Critical Match' : 'Normal Deviation'}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${confidenceScore > 70 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'}`}
                                    style={{ width: `${confidenceScore}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-4 py-4 border-t border-white/5">
                                <div className="p-2 glass-panel rounded-lg text-indigo-400">
                                    <Icons.Cpu size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Processing Model</span>
                                    <span className="text-xs font-bold text-white uppercase">{activeFile.ai_usage || "UNESCO V2.4"}</span>
                                </div>
                            </div>
                        </div>
                    </InsightCard>
                </div>

                {/* 2. Forensic Signal Detection */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        Forensic Intelligence
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setShowPatterns(!showPatterns)}
                            className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:border-indigo-500/40 transition-all"
                        >
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Word Patterns</span>
                            <span className="text-3xl font-black text-white">{activeFile.forensic_analysis ? (activeFile.forensic_analysis.pattern_hits || 0) : '-'}</span>
                            <span className="text-[8px] font-bold text-indigo-400 mt-2 uppercase tracking-tighter group-hover:underline">{showPatterns ? 'Hide' : 'Inspect'}</span>
                        </button>
                        <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Omissions</span>
                            <span className="text-3xl font-black text-white">{activeFile.forensic_analysis ? (activeFile.forensic_analysis.omission_count || 0) : '-'}</span>
                        </div>
                    </div>

                    {showPatterns && (
                        <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-4 animate-in slide-in-from-top-4 duration-300">
                            {patternList.length > 0 ? (
                                patternList.slice(0, 10).map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-300 tracking-tight italic">"{p.pattern || p.text || p}"</span>
                                        <span className="text-[10px] font-black text-indigo-400">x{p.count || p.hits || 1}</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-[10px] font-bold text-slate-500 uppercase text-center block">Clean Signal Detected</span>
                            )}
                        </div>
                    )}

                    {activeFile.forensic_analysis?.pattern_explanation && (
                        <div className="glass-panel p-5 border-l-4 border-l-indigo-500 rounded-r-2xl bg-indigo-500/5">
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                {activeFile.forensic_analysis.pattern_explanation}
                            </p>
                        </div>
                    )}
                </div>

                {/* 3. UNESCO Alignment Matrix */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                        Alignment Matrix
                        <div className="h-[1px] flex-1 bg-white/5" />
                    </h3>

                    <div className="space-y-4">
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
                                        explanation: dim?.reason || dim?.explanation || "No evidence detected.",
                                        suggestion: dim?.suggestion,
                                        snippet: dim?.evidence_snippet || dim?.snippet
                                    })}
                                    className={`group overflow-hidden ${isFocused ? 'border-indigo-500/60 ring-1 ring-indigo-500/40 bg-indigo-500/5' : ''}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg border border-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all ${isFocused ? 'text-indigo-400' : ''}`}>
                                                    <DimensionIcon size={16} />
                                                </div>
                                                <span className="text-[11px] font-black text-white tracking-widest">{formatKey(key)}</span>
                                            </div>
                                            <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${alignClass}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                                            {dim?.reason || dim?.explanation || "Insufficient terminal data for validation."}
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


