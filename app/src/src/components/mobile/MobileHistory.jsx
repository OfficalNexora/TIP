import React from 'react';
import Icons from '../ui/Icons';
import { useData, useActions, useUI } from '../../contexts/DashboardContext';
import { normalizeConfidence } from '../../utils/confidenceUtils';

const MobileHistory = () => {
    const { files } = useData();
    const { loadFile } = useActions();

    if (!files || files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 min-h-[50vh]">
                <Icons.FileText size={48} className="mb-4 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-bold">No Audit Records</p>
            </div>
        );
    }

    return (
        <div className="pb-32 px-4 space-y-3 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 pl-1">
                Audit Registry ({files.length})
            </h2>

            {files.map(file => (
                <div
                    key={file.id}
                    onClick={() => loadFile(file)}
                    className="glass-card p-4 active:scale-95 transition-transform border-white/5 active:bg-white/10"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${file.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                <Icons.FileText size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white line-clamp-1">{file.title}</h3>
                                <span className="text-[10px] text-slate-500 font-medium">{file.date}</span>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${normalizeConfidence(file.confidence) > 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                            {normalizeConfidence(file.confidence)}% Integrity
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-[9px] text-slate-600 font-mono">{file.id?.slice(0, 8)}</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400">
                            View Report <Icons.ArrowRight size={10} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MobileHistory;
