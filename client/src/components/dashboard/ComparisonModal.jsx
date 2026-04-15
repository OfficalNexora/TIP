import React from 'react';
import Icons from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Verdict Helpers ────────────────────────────────
const VERDICT_MAP = {
    NAPABUTI: {
        label: 'Napabuti ang Dokumento',
        desc: 'Ang mga rebisyon ay nagresulta sa makabuluhang pagbaba ng panganib at naitama ang mga isyu.',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300',
        icon: Icons.CheckCircle
    },
    BAHAGYANG_NAPABUTI: {
        label: 'Bahagyang Napabuti',
        desc: 'Ang ilang isyu ay naayos ngunit may mga natitirang problema na kailangan pang tugunan.',
        color: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300',
        icon: Icons.AlertTriangle
    },
    HINDI_NAPABUTI: {
        label: 'Hindi Napabuti',
        desc: 'Ang mga rebisyon ay hindi nagresulta sa makabuluhang pagbabago sa mga isyu ng dokumento.',
        color: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300',
        icon: Icons.MinusCircle
    },
    LUMALA: {
        label: 'Lumala ang Resulta',
        desc: 'Ang mga pagbabago ay nagdulot ng mas mataas na panganib o mas maraming isyu kaysa sa orihinal.',
        color: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-300',
        icon: Icons.XCircle
    }
};

// ─── Revision Diff View ─────────────────────────────
const RevisionDiffView = ({ result, isDark }) => {
    const { textSimilarity, scores, issues, dimensionChanges, verdict } = result;
    const verdictInfo = VERDICT_MAP[verdict] || VERDICT_MAP.HINDI_NAPABUTI;
    const VerdictIcon = verdictInfo.icon;

    return (
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Verdict Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-4 ${verdictInfo.color}`}>
                <VerdictIcon size={22} className="mt-0.5 shrink-0" />
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider mb-1">{verdictInfo.label}</h3>
                    <p className="text-xs leading-relaxed">{verdictInfo.desc}</p>
                </div>
            </div>

            {/* Score Comparison Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Orihinal na Marka</div>
                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{scores.originalRisk}%</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Binagong Marka</div>
                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{scores.revisedRisk}%</span>
                </div>
                <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Pagbabago</div>
                    <span className={`text-2xl font-black ${scores.riskDelta > 0 ? 'text-emerald-500' : scores.riskDelta < 0 ? 'text-rose-500' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                        {scores.riskDelta > 0 ? `−${scores.riskDelta}%` : scores.riskDelta < 0 ? `+${Math.abs(scores.riskDelta)}%` : '0%'}
                    </span>
                    <div className="text-[9px] mt-1 text-slate-400">{scores.riskDelta > 0 ? 'Bumaba ang Panganib' : scores.riskDelta < 0 ? 'Tumaas ang Panganib' : 'Walang Pagbabago'}</div>
                </div>
            </div>

            {/* Text Similarity */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
                        <Icons.FileText size={12} /> Pagkakatulad ng Teksto
                    </span>
                    <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{textSimilarity}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${textSimilarity}%` }}
                    />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    {textSimilarity >= 80 ? 'Halos pareho ang dalawang bersyon ng teksto.' :
                     textSimilarity >= 50 ? 'May makabuluhang pagbabago sa teksto.' :
                     'Malaki ang pagkakaiba ng dalawang bersyon.'}
                </p>
            </div>

            {/* Issues Fixed */}
            {issues.fixed.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.CheckCircle size={14} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Mga Isyung Naayos ({issues.fixed.length})
                        </h4>
                    </div>
                    <div className="space-y-1.5">
                        {issues.fixed.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                <Icons.Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{issue.label}</span>
                                    {issue.detail && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{issue.detail}</p>}
                                </div>
                                <span className="ml-auto text-[8px] font-black uppercase text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">{issue.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Issues Remaining */}
            {issues.remaining.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.AlertTriangle size={14} className="text-amber-500" />
                        <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            Mga Natitirang Isyu ({issues.remaining.length})
                        </h4>
                    </div>
                    <div className="space-y-1.5">
                        {issues.remaining.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                                <Icons.AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{issue.label}</span>
                                    {issue.detail && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{issue.detail}</p>}
                                </div>
                                <span className="ml-auto text-[8px] font-black uppercase text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full shrink-0">{issue.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Issues */}
            {issues.new.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.XCircle size={14} className="text-rose-500" />
                        <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                            Mga Bagong Isyu ({issues.new.length})
                        </h4>
                    </div>
                    <div className="space-y-1.5">
                        {issues.new.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30">
                                <Icons.XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{issue.label}</span>
                                    {issue.detail && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{issue.detail}</p>}
                                </div>
                                <span className="ml-auto text-[8px] font-black uppercase text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded-full shrink-0">{issue.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dimension Changes */}
            {dimensionChanges.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.BarChart2 size={14} className="text-blue-500" />
                        <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            Pagbabago sa Dimensyon
                        </h4>
                    </div>
                    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className={isDark ? 'bg-slate-800/80' : 'bg-slate-50'}>
                                    <th className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Dimensyon</th>
                                    <th className="text-center px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Orihinal</th>
                                    <th className="text-center px-2 py-2 text-slate-400"><Icons.ArrowRight size={10} /></th>
                                    <th className="text-center px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Binago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dimensionChanges.map((dc, idx) => (
                                    <tr key={idx} className={`border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                        <td className={`px-3 py-2.5 font-bold capitalize ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{dc.dimension}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{dc.oldStatus}</span>
                                        </td>
                                        <td className="text-center">
                                            {dc.improved ? <Icons.ArrowDown size={12} className="text-emerald-500 mx-auto" /> : <Icons.ArrowUp size={12} className="text-rose-500 mx-auto" />}
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dc.improved ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>{dc.newStatus}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <span>Kabuuang Isyu (Orihinal): {issues.totalOriginal}</span>
                <span>•</span>
                <span>Kabuuang Isyu (Binago): {issues.totalRevised}</span>
                <span>•</span>
                <span className={issues.totalRevised < issues.totalOriginal ? 'text-emerald-500' : issues.totalRevised > issues.totalOriginal ? 'text-rose-500' : ''}>
                    {issues.totalRevised < issues.totalOriginal ? `↓ ${issues.totalOriginal - issues.totalRevised} nabawas` :
                     issues.totalRevised > issues.totalOriginal ? `↑ ${issues.totalRevised - issues.totalOriginal} nadagdag` : 'Pareho'}
                </span>
            </div>
        </div>
    );
};

// ─── Re-run View (Existing) ─────────────────────────
const RerunView = ({ result, isDark }) => {
    const { tTest, tokenStats, isEffective, scores } = result;
    return (
        <div className="p-6 space-y-6">
            {/* Effectiveness Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
                isEffective
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-300'
            }`}>
                <Icons.Info size={24} className="mt-0.5 shrink-0" />
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider mb-1">
                        {isEffective ? 'Epektibong Pagbabago' : 'Walang Makabuluhang Pagbabago'}
                    </h3>
                    <p className="text-xs">
                        {isEffective
                            ? "May makabuluhang pagbawas sa panganib mula sa Trial 1 hanggang Trial 2."
                            : "Ang mga rebisyon ay hindi nagresulta sa makabuluhang pagbabago."}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                        {result.isSolo ? 'Marka ng Panganib' : 'Average na Marka'}
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {scores.trial2Mean.toFixed(1)}%
                        </span>
                        <span className="text-sm font-bold text-slate-400 mb-0.5 line-through decoration-rose-500/50">
                            {scores.trial1Mean.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                        {result.isSolo ? 'Pagbawas ng Panganib' : 'P-Value'}
                    </div>
                    <div className="flex items-end gap-2">
                        {result.isSolo ? (
                            <>
                                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {tTest.meanDifference > 0 ? `−${tTest.meanDifference.toFixed(1)}%` : `+${Math.abs(tTest.meanDifference).toFixed(1)}%`}
                                </span>
                                <span className="text-sm font-bold text-slate-400 mb-0.5">
                                    {isEffective ? 'Napabuti' : 'Lumala'}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {tTest.isSignificant ? 'Makabuluhan' : 'Hindi Sig.'}
                                </span>
                                <span className="text-sm font-bold text-slate-400 mb-0.5">
                                    t={tTest.tStatistic} (df={tTest.df})
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Token Usage */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pagkakatugma ng Haba ng Teksto</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                        tokenStats.isCompatible
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                    }`}>
                        {tokenStats.isCompatible ? 'Tugma' : 'Hindi Tugma'}
                    </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Trial 1 Avg: {Math.round(tokenStats.trial1Avg)} tokens <br/>
                    Trial 2 Avg: {Math.round(tokenStats.trial2Avg)} tokens <br/>
                    Pagkakaiba: {tokenStats.delta.toFixed(1)}%
                </p>
            </div>
        </div>
    );
};

// ─── Main Modal ─────────────────────────────────────
const ComparisonModal = ({ result, onClose }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (!result) return null;

    const isRevision = result.isRevision === true;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isRevision
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                            : (result.isEffective ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500')}`}>
                            {isRevision ? <Icons.GitCompare size={24} /> : <Icons.Activity size={24} />}
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {isRevision ? 'Ulat ng Paghahambing' : 'Ulat ng Re-run Verification'}
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {isRevision ? 'Orihinal vs Binagong Bersyon' : 'Trial 1 vs Trial 2'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Content - switch between modes */}
                {isRevision
                    ? <RevisionDiffView result={result} isDark={isDark} />
                    : <RerunView result={result} isDark={isDark} />
                }

                {/* Footer */}
                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                        Isara
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
