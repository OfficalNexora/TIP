import React, { useState, useEffect, useCallback } from 'react';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { useTheme } from '../../contexts/ThemeContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';
import tipLogo from '../../assets/no background logo fnl.png';
import { translations } from '../../utils/translations';

// --- ISOLATED SUB-COMPONENTS FOR PERFORMANCE ---

const AnimatedRiskCounter = React.memo(({ targetScore }) => {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
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
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
                {translations?.[window.__TIP_LANG__ || 'tl']?.['analytic.risk_percent'] || '% Risk'}
            </span>
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
    const { focusedIssue, rightPanelOpen: isOpen, language } = useUI();
    const { setFocusedIssue, setRightPanelOpen, deleteAnalysis, translateSummary } = useActions();

    const t = useCallback((key) => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);

    // Sync language for sub-components (Legacy/Simple approach)
    useEffect(() => {
        window.__TIP_LANG__ = language;
    }, [language]);

    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        const targetLang = language === 'tl' ? 'en' : 'tl';
        setIsTranslating(true);
        try {
            await translateSummary(activeFile.id, targetLang);
        } catch (error) {
            console.error('Translation click error:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const onClose = () => setRightPanelOpen(false);

    const handleIssueClick = useCallback((issue) => {
        setFocusedIssue(issue);
    }, [setFocusedIssue]);

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
    const [expandedFlags, setExpandedFlags] = useState(new Set());
    const [expandedDimensions, setExpandedDimensions] = useState(new Set());
 
     const toggleFlag = (id) => {
         const newSet = new Set(expandedFlags);
         if (newSet.has(id)) newSet.delete(id);
         else newSet.add(id);
         setExpandedFlags(newSet);
     };
 
     const toggleDimension = (id) => {
         const newSet = new Set(expandedDimensions);
         if (newSet.has(id)) newSet.delete(id);
         else newSet.add(id);
         setExpandedDimensions(newSet);
     };

    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen || !activeFile) return null;

    const formatKey = (key) => key.replace(/_/g, ' ').toUpperCase();

    // Institutional Color Logic
    const getAlignmentColor = (alignment) => {
        if (!alignment) return 'text-slate-500';
        const lower = alignment.toLowerCase();
        // Emerald-600 for Compliant, Amber-500 for Needs Improvement, Rose-600 for Non-Compliant
        if (lower.includes('aligned') || lower.includes('ligtas')) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400';
        if (lower.includes('obserbasyon')) return 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
        if (lower.includes('pagnilay') || lower.includes('warning')) return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400';
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
    };

    const localizeStatus = (status) => {
        if (!status) return status;
        const s = status.toLowerCase();
        if (s === 'low') return t('analytic.low');
        if (s === 'medium' || s === 'moderate') return t('analytic.medium');
        if (s === 'high') return t('analytic.high');
        if (s === 'critical' || s === 'very high' || s === 'very_high') return t('analytic.very_high');
        return status;
    };

    const getIconForDimension = (key) => {
        const lower = key.toLowerCase();
        if (lower.includes('katarungan')) return Icons.Scale;
        if (lower.includes('kalinawan')) return Icons.Eye;
        if (lower.includes('pagkapribado')) return Icons.Lock;
        if (lower.includes('pagpapanatili')) return Icons.Globe;
        if (lower.includes('pangangasiwa')) return Icons.UserCheck;
        if (lower.includes('pagiging_inklusibo')) return Icons.Users;
        return Icons.Activity;
    };

    // Verdict Logic (Ternary Classification)
    const getVerdictInfo = (verdict, lang) => {
        const hasSmokingGun = activeFile?.forensic_analysis?.has_smoking_gun;
        
        if (hasSmokingGun) {
            return {
                label: t('analytic.forensic_certainty'),
                color: 'text-rose-700 bg-rose-100 border-rose-300 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-300 shadow-md',
                icon: Icons.Lock,
                isCertain: true
            };
        }

        switch (verdict) {
            case 'AI_GENERATED':
                return {
                    label: t('analytic.verdict.ai_generated'),
                    color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400',
                    icon: Icons.Cpu
                };
            case 'AI_HELPED':
                return {
                    label: t('analytic.verdict.ai_helped'),
                    color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
                    icon: Icons.Zap
                };
            case 'HUMAN_AUTHENTIC':
            case 'HUMAN_EDITED':
                return {
                    label: t('analytic.verdict.human_authentic'),
                    color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
                    icon: Icons.UserCheck
                };
            default:
                return {
                    label: t('analytic.verdict.under_review'),
                    color: 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800 dark:text-slate-400',
                    icon: Icons.Search
                };
        }
    };

    const dimensions = activeFile.dimensions || {};
    const dimensionKeys = Object.keys(dimensions);

    // Confidence Logic: 0 = safe, 25 = low, 50 = moderate, 75 = high, 100 = critical
    const confidenceScore = activeFile.confidence_score || normalizeConfidence(activeFile.confidence);
    let confidenceColor = "bg-emerald-500";
    if (confidenceScore >= 85) confidenceColor = "bg-rose-600";
    else if (confidenceScore >= 60) confidenceColor = "bg-rose-500";
    else if (confidenceScore >= 30) confidenceColor = "bg-amber-500";

    const confidenceLabel = confidenceScore >= 85 ? t('analytic.risk_critical')
        : confidenceScore >= 60 ? t('analytic.risk_high')
            : confidenceScore >= 30 ? t('analytic.risk_moderate')
                : t('analytic.risk_low_safe');

    const confidenceBadgeClass = confidenceScore >= 60
        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
        : confidenceScore >= 30
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400'
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';

    const handleDelete = async () => {
        if (!window.confirm(t('analytic.confirm_delete'))) return;

        setIsDeleting(true);
        try {
            await deleteAnalysis(activeFile.id);
            onClose();
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const forensic = activeFile?.forensic_analysis || {};
    const details = forensic?.details || {};

    const patternList = forensic?.pattern_list
        || forensic?.patterns?.detected_patterns
        || details?.patterns?.detected_patterns
        || details?.patterns?.ultra?.hits // Fix for v9.1 ultra hits
        || [];

    const omissionList = forensic?.omission_list
        || forensic?.omissions?.flagged_omissions
        || details?.omissions?.flagged_omissions
        || details?.omissions?.hits // Fix for v9.1 omission hits
        || [];

    // Debug: Log what we have
    // console.log('[AnalyticPanel] forensic_analysis:', activeFile.forensic_analysis);
    // console.log('[AnalyticPanel] pattern_list:', patternList);
    // console.log('[AnalyticPanel] omission_list:', omissionList);


    const targetScore = activeFile?.confidence_score || normalizeConfidence(activeFile?.confidence || 0);
    const fullSummary = activeFile?.summary || t('analytic.no_summary');

    // Categorical Summary Helpers
    const getForensicCategorySummary = () => {
        const breakdown = forensic.risk_breakdown || {};
        return [
            { label: t('analytic.category.structure'), value: breakdown.structure || 0, icon: Icons.Layout, color: 'text-blue-500', desc: t('analytic.category.structure_desc') },
            { label: t('analytic.category.style'), value: breakdown.style || 0, icon: Icons.Type, color: 'text-purple-500', desc: t('analytic.category.style_desc') },
            { label: t('analytic.category.integrity'), value: (breakdown.patterns || 0) + (breakdown.omissions || 0), icon: Icons.ShieldCheck, color: 'text-rose-500', desc: t('analytic.category.integrity_desc') }
        ];
    };

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
                    <span className="font-semibold text-slate-900 dark:text-tip-text-main tracking-tight transition-colors">{t('analytic.report_title')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                        title="Delete Analysis"
                    >
                        {isDeleting ? <Icons.Loader size={16} className="animate-spin" /> : <Icons.Trash2 size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                    >
                        <Icons.X size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#F8F9FC] dark:bg-slate-900/50 transition-colors duration-300">

                {/* 0. Verdict Banner (New Section) */}
                {activeFile.verdict && (
                    <div className="space-y-4">
                        <div className={`p-5 rounded-2xl border transition-all duration-500 animate-in fade-in zoom-in-95 ${getVerdictInfo(activeFile.verdict, language).color}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/20 dark:bg-black/20">
                                        {React.createElement(getVerdictInfo(activeFile.verdict, language).icon, { size: 20 })}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                            {getVerdictInfo(activeFile.verdict, language).isCertain ? t('analytic.forensic_certainty') : t('analytic.verdict_analysis')}
                                        </span>
                                        <h4 className="text-xl font-black tracking-tight">{getVerdictInfo(activeFile.verdict, language).label}</h4>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black">{activeFile.ai_detection_score || 0}%</span>
                                    <p className="text-[9px] font-bold uppercase opacity-70">{t('analytic.ai_score')}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between px-2 pt-2 pb-1 border-t border-current/10 mt-1">
                                <span className="text-[10px] font-black uppercase opacity-70">{t('analytic.integrity_score')}</span>
                                <span className="text-sm font-black">{activeFile.integrity_score || 0}/100</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed opacity-90 border-t border-current/10 pt-3 italic">
                                {activeFile?.forensic_analysis?.has_smoking_gun 
                                    ? t('analytic.smoking_gun_msg')
                                    : (activeFile.determination_reason || t('analytic.determination_reason_default'))
                                }
                            </p>
                        </div>

                        {/* 0.1 Human Merits (New Section v8.5) */}
                        {forensic.human_merits && forensic.human_merits.length > 0 && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icons.Award size={14} className="text-emerald-500" />
                                    <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('analytic.human_merits')}</h5>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                {forensic.human_merits.map((merit, mIdx) => {
                                    const isHigh = merit.impact === 'Napakataas' || merit.impact === 'Mataas';
                                    const isLikas = merit.impact === 'Likas na Tao';
                                    
                                    return (
                                        <div key={mIdx} className={`bg-emerald-50/30 dark:bg-emerald-900/10 border ${isHigh ? 'border-emerald-300' : 'border-emerald-100/50'} dark:border-emerald-800/30 p-3 rounded-xl flex gap-3 items-start group hover:translate-x-1 transition-all`}>
                                            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                {isLikas ? <Icons.UserCheck size={14} /> : <Icons.Award size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{merit.label}</span>
                                                    <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full uppercase">
                                                        +{merit.strength}% Human
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                    {merit.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        )}

                        {/* Forensic Intelligence Summary Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {getForensicCategorySummary().map((cat, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm flex flex-col items-center text-center group hover:border-blue-200 transition-all">
                                    <div className={`p-2 rounded-lg mb-2 bg-slate-50 dark:bg-slate-900/50 ${cat.color}`}>
                                        <cat.icon size={16} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-slate-400 mb-1">{cat.label}</span>
                                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{cat.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 1. Summary Card */}
                <InsightCard>
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 transition-colors">{t('analytic.overall_risk')}</h4>
                            <div className="flex items-baseline gap-2">
                                <AnimatedRiskCounter targetScore={targetScore} />
                            </div>
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
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Icons.MessageCircle size={12} />
                                {t('analytic.summary_title')}
                            </h4>
                            <button
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                className="text-[10px] flex items-center gap-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold uppercase transition-all hover:bg-white dark:hover:bg-slate-800 px-2 py-1 rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-50"
                            >
                                {isTranslating ? (
                                    <Icons.Loader size={12} className="animate-spin" />
                                ) : (
                                    <Icons.Languages size={12} />
                                )}
                                {isTranslating ? t('analytic.translating') : (language === 'tl' ? t('analytic.translate_to_en') : t('analytic.translate_to_tl'))}
                            </button>
                        </div>
                        <TypewriterSummary fullSummary={fullSummary} activeFileId={activeFile.id} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 transition-colors">
                        <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 transition-colors">{t('analytic.ai_probability')}</h4>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium transition-colors">
                            <Icons.Cpu size={16} className="text-slate-400 dark:text-slate-500" />
                            <span className="capitalize">{localizeStatus(activeFile.ai_usage) || t('analytic.processing')}</span>
                        </div>
                    </div>
                </InsightCard>

                {/* 2. Forensic Signal Detection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">{t('analytic.forensic_analysis')}</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Risk Level Node */}
                        <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('analytic.risk_assessment')}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase transition-colors ${activeFile.forensic_analysis?.risk_level === 'Mataas' || activeFile.forensic_analysis?.risk_level === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                    {localizeStatus(activeFile.forensic_analysis?.risk_level) || (activeFile.status === 'COMPLETED' ? t('analytic.risk_low') : t('analytic.analyzing'))}
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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytic.ai_patterns')}</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                    {activeFile.forensic_analysis ? (activeFile.forensic_analysis.pattern_hits || 0) : '-'}
                                </span>
                                <span className="text-[10px] text-blue-500 mt-1">{showPatterns ? t('analytic.hide_list') : t('analytic.show_list')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowOmissions((prev) => !prev)}
                                className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center transition hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                            >
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytic.omission_flags')}</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                    {activeFile.forensic_analysis ? (activeFile.forensic_analysis.omission_count || 0) : '-'}
                                </span>
                                <span className="text-[10px] text-rose-500 mt-1">{showOmissions ? t('analytic.hide_list') : t('analytic.show_list')}</span>
                            </button>
                        </div>

                        {/* Explanations Row - Distinct Cards */}
                        <div className="space-y-4">
                            {showPatterns && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                            <Icons.Cpu size={14} />
                                            <h5 className="text-[11px] font-bold uppercase tracking-wider">{t('analytic.detailed_patterns')}</h5>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{t('analytic.found')}: {patternList.length}</span>
                                    </div>
                                    {patternList.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {patternList.map((p, idx) => {
                                                const impactData = p.impact === 'Critical' || p.impact === 'Smoking Gun' 
                                                    ? { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'KRITIKAL' }
                                                    : p.impact === 'High' ? { color: 'text-rose-500 bg-rose-50 border-rose-100', label: 'MATAAS' }
                                                    : p.impact === 'Medium' || p.impact === 'Moderate' ? { color: 'text-amber-500 bg-amber-50 border-amber-100', label: 'KATAMTAMAN' }
                                                    : { color: 'text-blue-500 bg-blue-50 border-blue-100', label: 'MABABA' };

                                                return (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => handleIssueClick({
                                                            id: `pattern-${idx}`,
                                                            label: p.pattern || p.label || t('nav.aiInsights'),
                                                            explanation: p.explanation || t('analytic.pattern_desc_default'),
                                                            suggestion: p.suggestion || "Iwasan ang paggamit ng mga generic o overused na mga salita.",
                                                            revision_prompt: p.revision_prompt || `Baguhin ang pariralang "${p.pattern}" gamit ang sariling pananalita.`
                                                        })}
                                                        className="w-full text-left bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-xl shadow-sm group hover:border-blue-300 hover:translate-x-1 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">{t('analytic.marker_forensic')}</span>
                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">"{p.pattern || p.text || (typeof p === 'object' ? p.label : p)}"</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 pt-1">
                                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${impactData.color}`}>
                                                                    {p.impact || impactData.label}
                                                                </span>
                                                                {p.count > 1 && (
                                                                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">x{p.count || p.hits || 1}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800/50 space-y-2">
                                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                                                                {p.explanation || t('analytic.pattern_desc_default')}
                                                            </p>
                                                            {p.suggestion && (
                                                                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                                    <div className="flex items-center gap-1.5 mb-1">
                                                                        <Icons.Zap size={10} className="text-blue-500" />
                                                                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">{t('analytic.revision_guide')}</span>
                                                                    </div>
                                                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-snug">
                                                                        {p.suggestion}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400 dark:text-slate-500 italic p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Icons.CheckCircle className="text-emerald-500" size={24} />
                                                <span>{t('analytic.safe_no_patterns')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {showOmissions && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                            <Icons.AlertTriangle size={14} />
                                            <h5 className="text-[11px] font-bold uppercase tracking-wider">{t('analytic.omission_flags')}</h5>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{t('analytic.found')}: {omissionList.length}</span>
                                    </div>
                                    {omissionList.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {omissionList.map((o, idx) => {
                                                const impactData = o.impact === 'Critical' || o.impact === 'High' 
                                                    ? { color: 'text-rose-600 bg-rose-50 border-rose-100', label: 'MATAAS' }
                                                    : o.impact === 'Medium' || o.impact === 'Moderate' ? { color: 'text-amber-500 bg-amber-50 border-amber-100', label: 'KATAMTAMAN' }
                                                    : { color: 'text-blue-500 bg-blue-50 border-blue-100', label: 'MABABA' };

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleIssueClick({
                                                            id: `omission-${idx}`,
                                                            label: o.label || o.pattern || t('analytic.omission_context'),
                                                            explanation: o.explanation || `Ang dokumento ay kulang sa sapat na detalye tungkol sa: ${o.label || o.text || 'pangunahing aspeto'}.`,
                                                            suggestion: o.suggestion || "Magbigay ng karagdagang ebidensya o paliwanag sa bahaging ito.",
                                                            revision_prompt: o.revision_prompt || `Paunlarin ang diskusyon tungkol sa ${o.label || o.text}.`
                                                        })}
                                                        className="w-full text-left bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 p-3.5 rounded-xl shadow-sm group hover:border-rose-300 hover:translate-x-1 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[8px] font-black text-rose-400 tracking-widest uppercase">{t('analytic.marker_ethics')}</span>
                                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{o.label || o.pattern || o.text || t('history.noResults')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 pt-1">
                                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${impactData.color}`}>
                                                                    {o.impact || impactData.label}
                                                                </span>
                                                                <Icons.ChevronRight size={12} className="text-slate-300 group-hover:text-rose-400 transition-colors" />
                                                            </div>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
                                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                                                                {o.explanation || "Nakitang gaps sa lohikal na daloy o factual support."}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400 dark:text-slate-500 italic p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Icons.CheckCircle className="text-emerald-500" size={24} />
                                                <span>{t('analytic.safe_no_omissions')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Heuristic Explanations */}
                            <div className="space-y-3 mt-4">
                                {activeFile.forensic_analysis?.pattern_explanation && (
                                    <div className="bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/30 p-3 rounded-lg relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400/50"></div>
                                        <h5 className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase mb-1 pl-2 tracking-widest flex items-center gap-1.5">
                                            <Icons.Info size={10} />
                                            {t('analytic.pattern_interpretation')}
                                        </h5>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-2 font-medium">
                                            {activeFile.forensic_analysis.pattern_explanation}
                                        </p>
                                    </div>
                                )}

                                {activeFile.forensic_analysis?.omission_explanation && (
                                    <div className="bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-800/30 p-3 rounded-lg relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400/50"></div>
                                        <h5 className="text-[9px] font-black text-rose-600 dark:text-rose-500 uppercase mb-1 pl-2 tracking-widest flex items-center gap-1.5">
                                            <Icons.AlertTriangle size={10} />
                                            {t('analytic.omission_impact')}
                                        </h5>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-2 font-medium">
                                            {activeFile.forensic_analysis.omission_explanation}
                                        </p>
                                    </div>
                                )}

                                 {/* Forensic Anomalies - Perfection Penalty */}
                                {activeFile?.forensic_analysis?.details?.perfection?.perfection_score > 40 && (
                                    <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-xl relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-500 transition-all border-l-4 border-l-rose-500 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Icons.Zap size={12} className="animate-pulse" />
                                                {t('analytic.perfection_penalty')}
                                            </h5>
                                            <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">RISK: {activeFile.forensic_analysis.details.perfection.perfection_score}%</span>
                                        </div>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                            {t('analytic.perfection_desc')}
                                        </p>
                                    </div>
                                )}

                                {/* Forensic Anomalies - Lexical Spin */}
                                {activeFile?.forensic_analysis?.details?.lexical_spin?.spin_risk_score > 40 && (
                                    <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-xl relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-500 transition-all border-l-4 border-l-indigo-500 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Icons.RotateCcw size={12} />
                                                {t('analytic.lexical_spin')}
                                            </h5>
                                            <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">EVASION: {activeFile.forensic_analysis.details.lexical_spin.spin_risk_score}%</span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                {t('analytic.lexical_spin_desc')}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {activeFile.forensic_analysis.details.lexical_spin.detected_spin_words?.slice(0, 6).map((word, i) => (
                                                    <span key={i} className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100/50 dark:border-indigo-800/30">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>



                {/* 2.7. Security & Evasion Mechanics (Tampering Threats) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 font-sans tracking-tight">Security & Evasion Mechanics</h4>
                    </div>
                    {(() => {
                        const forensic = activeFile.forensic_analysis || {};
                        const hasPromptInjection = !!forensic.prompt_injection_flag;
                        const hasStego = !!forensic.steganography_detected;
                        const spinScore = forensic.details?.lexical_spin?.spin_risk_score || 0;
                        const perfectionScore = forensic.details?.perfection?.perfection_score || 0;
                        const hasThreats = hasPromptInjection || hasStego || spinScore > 40 || perfectionScore > 40;

                        if (!hasThreats) {
                            return (
                                <InsightCard className="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/10">
                                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                        <Icons.Shield size={16} />
                                        Walang nakitang pagtatangkang AI evasion o system tampering.
                                    </div>
                                </InsightCard>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 gap-3">
                                {hasPromptInjection && (
                                    <InsightCard className="border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 shadow-md">
                                        <div className="flex gap-3 items-start">
                                            <Icons.AlertTriangle className="text-rose-600 shrink-0 mt-0.5 animate-pulse" size={18} />
                                            <div>
                                                <h5 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide">Pagtatangkang Prompt Injection</h5>
                                                <p className="text-xs text-rose-600 dark:text-rose-300 mt-1 leading-snug font-medium">
                                                    Ang dokumentong ito ay nagtataglay ng nakatagong utos na sinusubukang impluwensyahan ang AI scoring engine (hal. "ignore previous instructions"). Ito ay isang malubhang integrity violation.
                                                </p>
                                            </div>
                                        </div>
                                    </InsightCard>
                                )}

                                {hasStego && (
                                    <InsightCard className="border-orange-300 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-900/10">
                                        <div className="flex gap-3 items-start">
                                            <Icons.Lock className="text-orange-600 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <h5 className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase tracking-wide">Zero-Width Steganography</h5>
                                                <p className="text-xs text-orange-600 dark:text-orange-300 mt-1 leading-snug">
                                                    Nakatagpas ng mga invisible na karakter na madalas gamitin upang labanan ang mga plagiarism scanners. Kinumpuni at na-strip na ng system ang mga palihim na karakter na ito.
                                                </p>
                                            </div>
                                        </div>
                                    </InsightCard>
                                )}

                                {spinScore > 40 && (
                                    <InsightCard className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <div className="flex gap-3 items-start">
                                            <Icons.Activity className="text-indigo-600 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">Lexical Spin / Quillbot Risk</h5>
                                                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full font-bold">{spinScore}% Risk</span>
                                                </div>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1 leading-snug">
                                                    May hindi pangkaraniwang density ng malalalim na salita (hyper-complexity) na kadalasang senyales ng paggamit ng AI Paraphraser (tulad ng Quillbot/Wordbot) para makaiwas sa AI detection.
                                                </p>
                                            </div>
                                        </div>
                                    </InsightCard>
                                )}

                                {perfectionScore > 40 && (
                                    <InsightCard className="border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-900/10">
                                        <div className="flex gap-3 items-start">
                                            <Icons.Scale className="text-purple-600 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h5 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wide">Structural Perfection Penalty</h5>
                                                    <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">{perfectionScore}% Uniformity</span>
                                                </div>
                                                <p className="text-xs text-purple-600 dark:text-purple-300 mt-1 leading-snug">
                                                    Sobrang pantay at pare-pareho ang haba ng mga pangungusap at talata, isang matibay na senyales ng "raw" na kopya mula sa ChatGPT o katulad na language model.
                                                </p>
                                            </div>
                                        </div>
                                    </InsightCard>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* 3. Critical Flags (Interactive) */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-tip-text-main transition-colors">{t('analytic.critical_findings')}</h4>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full transition-colors">{activeFile.flags?.length || 0}</span>
                    </div>

                    <div className="space-y-3">
                        {activeFile.flags && activeFile.flags.length > 0 ? (
                            activeFile.flags.map((flag, i) => {
                                const flagId = `flag-${i}`;
                                const isExpanded = expandedFlags.has(flagId);
                                return (
                                    <InsightCard
                                        key={i}
                                        onClick={() => toggleFlag(flagId)}
                                        className={`group transition-all hover:translate-x-1 cursor-pointer overflow-hidden ${isExpanded ? 'ring-1 ring-rose-300 border-rose-300 shadow-md bg-white dark:bg-slate-800/60' : 'border-rose-100 dark:border-rose-900/30'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 text-rose-500 dark:text-rose-400 shrink-0">
                                                <Icons.AlertTriangle size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">{flag.type || t('analytic.category_flag')}</span>
                                                    <Icons.ChevronRight size={14} className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                                <p className="text-sm text-slate-900 dark:text-slate-200 font-bold mb-1">{flag.label || (typeof flag === 'string' ? flag : t('analytic.needs_review'))}</p>
                                                
                                                {/* Always visible brief part */}
                                                {!isExpanded && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{flag.explanation || flag.detail}</p>
                                                )}

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Paliwanag</h5>
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{flag.explanation || flag.detail}</p>
                                                        </div>
                                                        
                                                        {flag.associated_snippet && (
                                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                                    <Icons.Hash size={10} /> {t('analytic.evidence')}
                                                                </h5>
                                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                                                    "{flag.associated_snippet}"
                                                                </p>
                                                            </div>
                                                        )}

                                                        {flag.suggestion && (
                                                            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                                <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                                    <Icons.Zap size={10} /> {t('analytic.suggestion')}
                                                                </h5>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                                    {flag.suggestion}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                            const dimId = `dim-${key}`;
                            const isExpanded = expandedDimensions.has(dimId);

                            return (
                                <InsightCard
                                    key={i}
                                    noPadding
                                    onClick={() => toggleDimension(dimId)}
                                    className={`overflow-hidden hover:shadow-md transition-all group cursor-pointer ${isExpanded ? 'ring-1 ring-blue-400 border-blue-400 shadow-lg bg-white dark:bg-slate-800/60' : 'border-slate-100 dark:border-slate-800'}`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                                    <DimensionIcon size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                                                    {t(`analytic.dim.${key}`) || formatKey(key)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase transition-colors ${alignClass}`}>
                                                    {status}
                                                </span>
                                                <Icons.ChevronRight size={14} className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                            </div>
                                        </div>
                                        
                                        {!isExpanded && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-1">
                                                {dim?.reason || dim?.explanation || "Walang sapat na ebidensya ang natuklasan."}
                                            </p>
                                        )}

                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagsusuri</h5>
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                        {dim?.reason || dim?.explanation || "Walang sapat na ebidensya ang natuklasan."}
                                                    </p>
                                                </div>

                                                {(dim?.evidence_snippet || dim?.snippet) && (
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <Icons.Hash size={10} /> {t('analytic.evidence')}
                                                        </h5>
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                                            "{dim?.evidence_snippet || dim?.snippet}"
                                                        </p>
                                                    </div>
                                                )}

                                                {dim?.suggestion && (
                                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                                        <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                            <Icons.Zap size={10} /> {t('analytic.suggestion')}
                                                        </h5>
                                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                            {dim?.suggestion}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </InsightCard>
                            );
                        })}
                    </div>
                </div>

                {/* 6. Optional Metrics - Plagiarism/Similarity (Demoted) */}
                <div className="mt-20 pt-10 border-t border-slate-50 dark:border-slate-800/30 opacity-50 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex flex-col gap-1 mb-6">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            {t('analytic.optional_metrics')}
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-600 font-medium italic">
                            {t('analytic.secondary_analysis_desc')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 transition-colors uppercase tracking-tight">
                                {t('analytic.plagiarism_analysis')}
                            </h4>
                        </div>

                        {activeFile.plagiarism ? (
                            <div className="grid grid-cols-1 gap-3">
                                {/* Overall Similarity Score */}
                                <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('analytic.internal_similarity')}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase transition-colors ${(activeFile.plagiarism.similarity || 0) > 40
                                            ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                                            : (activeFile.plagiarism.similarity || 0) > 15
                                                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                            }`}>
                                            {(activeFile.plagiarism.similarity || 0) > 40 ? t('analytic.risk_high') : (activeFile.plagiarism.similarity || 0) > 15 ? t('analytic.risk_moderate') : t('analytic.risk_low')}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-3xl font-bold text-slate-900 dark:text-tip-text-main">{parseFloat(activeFile.plagiarism.similarity || 0).toFixed(1)}</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('analytic.similarity_percent')}</span>
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
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytic.internal_matches')}</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                            {activeFile.plagiarism.internal_matches?.length || activeFile.plagiarism.match_count || 0}
                                        </span>
                                    </div>
                                    <div className="bg-tip-surface border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm flex flex-col items-center justify-center text-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('analytic.external_sources')}</span>
                                        <span className="text-2xl font-black text-slate-900 dark:text-tip-text-main mt-1">
                                            {activeFile.plagiarism.external_sources?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Top Internal Matches */}
                                {activeFile.plagiarism.internal_matches && activeFile.plagiarism.internal_matches.length > 0 && (
                                    <div className="bg-tip-surface border border-amber-100 dark:border-amber-900/40 p-3 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 mb-2">
                                            <h5 className="text-[11px] font-bold uppercase tracking-wide">{t('analytic.top_matches')}</h5>
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
                                            <span className="text-xs font-medium">{t('analytic.clean_no_similarity')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <InsightCard className="border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                                    <Icons.Cpu size={16} className="animate-spin" />
                                    {activeFile.status === 'COMPLETED' ? t('analytic.no_plagiarism_data') : t('analytic.checking_similarity')}
                                </div>
                            </InsightCard>
                        )}
                    </div>
                </div>

                {/* 5. Institutional Branding & Copyright Footer */}
                <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800/50 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 mb-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 cursor-default group">
                        <img src={tipLogo} alt="TIP AI" className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                        <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C9A227] dark:text-[#E2C669]">
                            {t('analytic.institutional_footer')}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {t('analytic.verified_institutional')}
                        </p>
                        <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-tighter opacity-60 max-w-[280px] mx-auto leading-tight">
                            {t('analytic.unesco_compliance')}
                        </p>
                        <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-tighter opacity-80 mt-2">
                            {t('analytic.copyright_notice')}
                        </p>
                    </div>

                    {/* Decorative Institutional Line */}
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent mt-8"></div>
                </div>

            </div>
        </div>
    );
});

export default AnalyticPanel;

