import React from 'react';
import Icons from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';

const ComparisonModal = ({ result, onClose }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (!result) return null;

    const { tTest, tokenStats, isEffective, scores } = result;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isEffective ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                            <Icons.Activity size={24} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                Re-run Verification Report
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Trial 1 vs Trial 2
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Content */}
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
                                {isEffective ? 'Effectiveness Achieved' : 'No Significant Improvement'}
                            </h3>
                            <p className="text-xs">
                                {isEffective 
                                    ? "There is a statistically significant reduction in risk between Trial 1 and Trial 2, confirming your revisions were effective." 
                                    : "The revisions did not produce a statistically significant reduction in risk, or the difference was negligible."}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                                {result.isSolo ? 'AI Risk Score' : 'Mean AI Score'}
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
                                {result.isSolo ? 'Risk Reduction' : 'P-Value / Significance'}
                            </div>
                            <div className="flex items-end gap-2">
                                {result.isSolo ? (
                                    <>
                                        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {tTest.meanDifference > 0 ? `-${tTest.meanDifference.toFixed(1)}%` : `+${Math.abs(tTest.meanDifference).toFixed(1)}%`}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400 mb-0.5">
                                            {isEffective ? 'Improved' : 'Worse'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {tTest.isSignificant ? 'Significant' : 'Not Sig.'}
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
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Token Usage Compatibility</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                tokenStats.isCompatible 
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                                    : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                            }`}>
                                {tokenStats.isCompatible ? 'Compatible' : 'Length Mismatch'}
                            </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Trial 1 Avg Length: {Math.round(tokenStats.trial1Avg)} tokens <br/>
                            Trial 2 Avg Length: {Math.round(tokenStats.trial2Avg)} tokens <br/>
                            Difference: {tokenStats.delta.toFixed(1)}%
                        </p>
                    </div>
                </div>

                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
