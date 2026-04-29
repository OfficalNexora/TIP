import React, { useState, useEffect, useCallback } from 'react';
import Icons from '../ui/Icons';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Verdict Helpers ────────────────────────────────
const VERDICT_OPTIONS = ['NAPABUTI', 'BAHAGYANG_NAPABUTI', 'HINDI_NAPABUTI', 'LUMALA'];
const STATUS_OPTIONS = ['Mababa', 'Katamtaman', 'Mataas'];

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

// ─── Editable Input Wrapper ─────────────────────────
const EditableNumber = ({ value, onChange, className = '', min = 0, max = 100 }) => (
    <input
        type="number"
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
        className={`bg-transparent border-b-2 border-dashed border-amber-400 text-center w-20 outline-none focus:border-amber-500 ${className}`}
        min={min}
        max={max}
    />
);

const EditableText = ({ value, onChange, className = '', multiline = false }) => {
    if (multiline) {
        return (
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`bg-transparent border border-dashed border-amber-400 rounded-lg px-2 py-1 w-full outline-none focus:border-amber-500 resize-y min-h-[40px] ${className}`}
                rows={2}
            />
        );
    }
    return (
        <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`bg-transparent border-b-2 border-dashed border-amber-400 w-full outline-none focus:border-amber-500 ${className}`}
        />
    );
};

// ─── Revision Diff View ─────────────────────────────
const RevisionDiffView = ({ result, isDark, isEditMode, draft, setDraft }) => {
    const data = isEditMode && draft ? draft : result;
    const { textSimilarity, scores, issues, dimensionChanges, verdict } = data;
    const verdictInfo = VERDICT_MAP[verdict] || VERDICT_MAP.HINDI_NAPABUTI;
    const VerdictIcon = verdictInfo.icon;

    const updateScore = (field, val) => {
        if (!isEditMode) return;
        const newScores = { ...draft.scores, [field]: val };
        // Auto-calc delta
        newScores.riskDelta = newScores.originalRisk - newScores.revisedRisk;
        newScores.integrityDelta = newScores.revisedIntegrity - newScores.originalIntegrity;
        setDraft(prev => ({ ...prev, scores: newScores }));
    };

    const updateDimChange = (idx, field, val) => {
        if (!isEditMode) return;
        const newDims = [...draft.dimensionChanges];
        newDims[idx] = { ...newDims[idx], [field]: val };
        // Auto-calc improved flag based on status hierarchy
        const statusRank = { 'Mababa': 0, 'Katamtaman': 1, 'Mataas': 2 };
        const oldRank = statusRank[newDims[idx].oldStatus] ?? 1;
        const newRank = statusRank[newDims[idx].newStatus] ?? 1;
        newDims[idx].improved = newRank < oldRank;
        setDraft(prev => ({ ...prev, dimensionChanges: newDims }));
    };

    const updateIssue = (category, idx, field, val) => {
        if (!isEditMode) return;
        const newIssues = { ...draft.issues };
        const arr = [...newIssues[category]];
        arr[idx] = { ...arr[idx], [field]: val };
        newIssues[category] = arr;
        setDraft(prev => ({ ...prev, issues: newIssues }));
    };

    const addIssue = (category) => {
        if (!isEditMode) return;
        const newIssues = { ...draft.issues };
        newIssues[category] = [...(newIssues[category] || []), { label: 'Bagong isyu', detail: '', type: 'FLAG' }];
        setDraft(prev => ({ ...prev, issues: newIssues }));
    };

    const removeIssue = (category, idx) => {
        if (!isEditMode) return;
        const newIssues = { ...draft.issues };
        newIssues[category] = newIssues[category].filter((_, i) => i !== idx);
        setDraft(prev => ({ ...prev, issues: newIssues }));
    };

    return (
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Edit Mode Banner */}
            {isEditMode && (
                <div className="p-3 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Icons.AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Admin Edit Mode — All fields editable</span>
                </div>
            )}

            {/* Verdict Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-4 ${verdictInfo.color}`}>
                <VerdictIcon size={22} className="mt-0.5 shrink-0" />
                <div className="flex-1 w-full">
                    {isEditMode ? (
                        <select
                            value={verdict}
                            onChange={e => setDraft(prev => ({ ...prev, verdict: e.target.value }))}
                            className="text-sm font-black uppercase tracking-wider mb-2 bg-transparent border-b-2 border-dashed border-amber-400 outline-none cursor-pointer w-full"
                        >
                            {VERDICT_OPTIONS.map(v => (
                                <option key={v} value={v}>{VERDICT_MAP[v].label}</option>
                            ))}
                        </select>
                    ) : (
                        <h3 className="text-sm font-black uppercase tracking-wider mb-2">{verdictInfo.label}</h3>
                    )}
                    
                    {/* AI / Custom Summary */}
                    {isEditMode ? (
                        <EditableText 
                            value={data.aiSummary || verdictInfo.desc} 
                            onChange={v => setDraft(prev => ({ ...prev, aiSummary: v }))} 
                            className="text-xs leading-relaxed italic block" 
                            multiline 
                        />
                    ) : (
                        <p className="text-xs leading-relaxed italic">{data.aiSummary || verdictInfo.desc}</p>
                    )}
                </div>
            </div>

            {/* Score Comparison Row */}
            <div className="grid grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Orihinal na Marka</div>
                    {isEditMode ? (
                        <EditableNumber value={scores.originalRisk} onChange={v => updateScore('originalRisk', v)} className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} />
                    ) : (
                        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{scores.originalRisk}%</span>
                    )}
                </div>
                <div className={`p-4 rounded-2xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-1">Binagong Marka</div>
                    {isEditMode ? (
                        <EditableNumber value={scores.revisedRisk} onChange={v => updateScore('revisedRisk', v)} className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} />
                    ) : (
                        <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{scores.revisedRisk}%</span>
                    )}
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
                    {isEditMode ? (
                        <EditableNumber value={textSimilarity} onChange={v => setDraft(prev => ({ ...prev, textSimilarity: v }))} className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`} />
                    ) : (
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{textSimilarity}%</span>
                    )}
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
            {(issues.fixed.length > 0 || isEditMode) && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.CheckCircle size={14} className="text-emerald-500" />
                        <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            Mga Isyung Naayos ({issues.fixed.length})
                        </h4>
                        {isEditMode && (
                            <button onClick={() => addIssue('fixed')} className="ml-auto p-1 rounded bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 transition-colors">
                                <Icons.Plus size={12} className="text-emerald-500" />
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {issues.fixed.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                <Icons.Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    {isEditMode ? (
                                        <>
                                            <EditableText value={issue.label} onChange={v => updateIssue('fixed', idx, 'label', v)} className="text-xs font-bold text-emerald-700 dark:text-emerald-300" />
                                            <EditableText value={issue.detail || ''} onChange={v => updateIssue('fixed', idx, 'detail', v)} className="text-[10px] text-slate-500 mt-1" multiline />
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{issue.label}</span>
                                            {issue.detail && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{issue.detail}</p>}
                                        </>
                                    )}
                                </div>
                                {isEditMode ? (
                                    <button onClick={() => removeIssue('fixed', idx)} className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shrink-0">
                                        <Icons.X size={12} className="text-rose-500" />
                                    </button>
                                ) : (
                                    <span className="ml-auto text-[8px] font-black uppercase text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">{issue.type}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Issues Remaining */}
            {(issues.remaining.length > 0 || isEditMode) && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.AlertTriangle size={14} className="text-amber-500" />
                        <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            Mga Natitirang Isyu ({issues.remaining.length})
                        </h4>
                        {isEditMode && (
                            <button onClick={() => addIssue('remaining')} className="ml-auto p-1 rounded bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 transition-colors">
                                <Icons.Plus size={12} className="text-amber-500" />
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {issues.remaining.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                                <Icons.AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    {isEditMode ? (
                                        <>
                                            <EditableText value={issue.label} onChange={v => updateIssue('remaining', idx, 'label', v)} className="text-xs font-bold text-amber-700 dark:text-amber-300" />
                                            <EditableText value={issue.detail || ''} onChange={v => updateIssue('remaining', idx, 'detail', v)} className="text-[10px] text-slate-500 mt-1" multiline />
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{issue.label}</span>
                                            {issue.detail && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{issue.detail}</p>}
                                        </>
                                    )}
                                </div>
                                {isEditMode ? (
                                    <button onClick={() => removeIssue('remaining', idx)} className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shrink-0">
                                        <Icons.X size={12} className="text-rose-500" />
                                    </button>
                                ) : (
                                    <span className="ml-auto text-[8px] font-black uppercase text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full shrink-0">{issue.type}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Issues */}
            {(issues.new.length > 0 || isEditMode) && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Icons.XCircle size={14} className="text-rose-500" />
                        <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                            Mga Bagong Isyu ({issues.new.length})
                        </h4>
                        {isEditMode && (
                            <button onClick={() => addIssue('new')} className="ml-auto p-1 rounded bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 transition-colors">
                                <Icons.Plus size={12} className="text-rose-500" />
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {issues.new.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30">
                                <Icons.XCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    {isEditMode ? (
                                        <>
                                            <EditableText value={issue.label} onChange={v => updateIssue('new', idx, 'label', v)} className="text-xs font-bold text-rose-700 dark:text-rose-300" />
                                            <EditableText value={issue.detail || ''} onChange={v => updateIssue('new', idx, 'detail', v)} className="text-[10px] text-slate-500 mt-1" multiline />
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{issue.label}</span>
                                            {issue.detail && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{issue.detail}</p>}
                                        </>
                                    )}
                                </div>
                                {isEditMode ? (
                                    <button onClick={() => removeIssue('new', idx)} className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors shrink-0">
                                        <Icons.X size={12} className="text-rose-500" />
                                    </button>
                                ) : (
                                    <span className="ml-auto text-[8px] font-black uppercase text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-1.5 py-0.5 rounded-full shrink-0">{issue.type}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dimension Changes */}
            {(dimensionChanges.length > 0 || isEditMode) && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Icons.BarChart2 size={14} className="text-blue-500" />
                        <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            Pagbabago sa Dimensyon
                        </h4>
                    </div>
                    <div className="space-y-3">
                        {dimensionChanges.map((dc, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700/50">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{dc.dimension}</span>
                                    <div className="flex items-center gap-3">
                                        {isEditMode ? (
                                            <select
                                                value={dc.oldStatus}
                                                onChange={e => updateDimChange(idx, 'oldStatus', e.target.value)}
                                                className="text-[10px] font-black px-2 py-0.5 rounded-full bg-transparent border border-dashed border-amber-400 outline-none cursor-pointer"
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{dc.oldStatus}</span>
                                        )}
                                        {dc.improved ? <Icons.ArrowRight size={14} className="text-emerald-500" /> : <Icons.ArrowRight size={14} className="text-rose-500" />}
                                        {isEditMode ? (
                                            <select
                                                value={dc.newStatus}
                                                onChange={e => updateDimChange(idx, 'newStatus', e.target.value)}
                                                className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-transparent border border-dashed border-amber-400 outline-none cursor-pointer`}
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dc.improved ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>{dc.newStatus}</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Old Reason */}
                                    <div>
                                        <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Orihinal na Isyu</div>
                                        {isEditMode ? (
                                            <EditableText value={dc.oldReason || ''} onChange={v => updateDimChange(idx, 'oldReason', v)} className="text-[10px] text-slate-500" multiline />
                                        ) : (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">{dc.oldReason || 'Walang detalye sa orihinal.'}</p>
                                        )}
                                    </div>
                                    
                                    {/* New Reason */}
                                    <div>
                                        <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">Kasulukuyang Isyu</div>
                                        {isEditMode ? (
                                            <EditableText value={dc.newReason || ''} onChange={v => updateDimChange(idx, 'newReason', v)} className="text-[10px] text-slate-500" multiline />
                                        ) : (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">{dc.newReason || 'Walang detalyeng naitala sa rebisyon.'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className={`flex items-center justify-between p-3 rounded-xl border text-[10px] font-bold ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                {isEditMode ? (
                    <>
                        <span>Orihinal: <EditableNumber value={issues.totalOriginal} onChange={v => setDraft(prev => ({ ...prev, issues: { ...prev.issues, totalOriginal: v } }))} className="w-12 text-[10px]" min={0} max={999} /></span>
                        <span>•</span>
                        <span>Binago: <EditableNumber value={issues.totalRevised} onChange={v => setDraft(prev => ({ ...prev, issues: { ...prev.issues, totalRevised: v } }))} className="w-12 text-[10px]" min={0} max={999} /></span>
                    </>
                ) : (
                    <>
                        <span>Kabuuang Isyu (Orihinal): {issues.totalOriginal}</span>
                        <span>•</span>
                        <span>Kabuuang Isyu (Binago): {issues.totalRevised}</span>
                        <span>•</span>
                        <span className={issues.totalRevised < issues.totalOriginal ? 'text-emerald-500' : issues.totalRevised > issues.totalOriginal ? 'text-rose-500' : ''}>
                            {issues.totalRevised < issues.totalOriginal ? `↓ ${issues.totalOriginal - issues.totalRevised} nabawas` :
                             issues.totalRevised > issues.totalOriginal ? `↑ ${issues.totalRevised - issues.totalOriginal} nadagdag` : 'Pareho'}
                        </span>
                    </>
                )}
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
const ComparisonModal = ({ result, onClose, isEditMode = false, onSave }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Draft state for edit mode — deep copy of result when edit mode activates
    const [draft, setDraft] = useState(null);

    useEffect(() => {
        if (isEditMode && result && result.isRevision) {
            setDraft(JSON.parse(JSON.stringify(result)));
        } else if (!isEditMode) {
            setDraft(null);
        }
    }, [isEditMode, result]);

    const handleSave = useCallback(() => {
        if (draft && onSave) {
            onSave(draft);
        }
    }, [draft, onSave]);

    if (!result) return null;

    const isRevision = result.isRevision === true;
    const canEdit = isEditMode && isRevision;

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
                                {canEdit && <span className="ml-2 text-amber-500">• EDIT MODE</span>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Content - switch between modes */}
                {isRevision
                    ? <RevisionDiffView result={result} isDark={isDark} isEditMode={canEdit} draft={draft} setDraft={setDraft} />
                    : <RerunView result={result} isDark={isDark} />
                }

                {/* Footer */}
                <div className={`p-4 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    {canEdit && (
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-2"
                        >
                            <Icons.Check size={16} />
                            I-Save ang Overrides
                        </button>
                    )}
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
