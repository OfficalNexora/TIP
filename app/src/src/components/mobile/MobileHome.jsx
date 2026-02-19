import React from 'react';
import Icons from '../ui/Icons';
import { useData, useActions } from '../../contexts/DashboardContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';

const MobileHome = () => {
    const { files, integrityAvg } = useData();
    const { setDashboardState, loadFile } = useActions();

    const recentFiles = files.slice(0, 5);

    return (
        <div className="h-full flex flex-col px-6 py-8 pb-32 overflow-y-auto custom-scrollbar bg-tip-bg fade-in-item safe-area-top">

            {/* Header */}
            <div className="flex items-center justify-between mb-12 mt-4">
                <div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-1">Command</span>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Mobile Terminal</h1>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-lg">
                    <span className="text-[10px] font-bold text-slate-400">AG</span>
                </div>
            </div>

            {/* Main Action: New Scan (Clean) */}
            <div
                onClick={() => setDashboardState('UPLOAD')}
                className="w-full aspect-square max-h-[300px] mb-12 mx-auto rounded-3xl bg-indigo-600 flex flex-col items-center justify-center relative overflow-hidden group active:scale-95 transition-transform shadow-[0_20px_50px_-12px_rgba(79,70,229,0.5)]"
            >
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
                    <Icons.Maximize size={40} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-white text-center leading-tight">Start<br />Analysis</h2>
                <p className="text-xs text-indigo-200 mt-2 font-medium">Tap to Scan</p>
            </div>

            {/* Recent Activity (List Only) */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Recent Activity</h3>
                    <button
                        onClick={() => setDashboardState('HISTORY')}
                        className="text-[10px] font-bold text-indigo-400"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-4">
                    {recentFiles.map(file => (
                        <div
                            key={file.id}
                            onClick={() => loadFile(file)}
                            className="p-0 flex items-center gap-4 active:opacity-60 transition-opacity"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${file.status === 'COMPLETED' ? 'bg-slate-900 text-emerald-400 border border-white/5' : 'bg-slate-900 text-slate-500 border border-white/5'}`}>
                                <Icons.FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0 border-b border-white/5 pb-4">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h4 className="text-sm font-bold text-white truncate max-w-[150px]">{file.title}</h4>
                                    <span className={`text-[10px] font-black ${normalizeConfidence(file.confidence) > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {normalizeConfidence(file.confidence)}%
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500">{file.date}</p>
                            </div>
                        </div>
                    ))}
                    {recentFiles.length === 0 && (
                        <div className="text-center py-12 text-slate-600 text-xs">
                            No recent audits found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileHome;
