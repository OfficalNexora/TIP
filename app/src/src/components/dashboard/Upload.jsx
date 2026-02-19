import React, { useState } from 'react';
import Icons from '../ui/Icons';
import { useActions } from '../../contexts/DashboardContext';

const Upload = () => {
    const { startScan } = useActions();
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            startScan(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            startScan(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center px-6 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-full max-w-xl space-y-10">

                {/* Header Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Institutional Access</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
                        Initialize <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Deep Scan.</span>
                    </h1>
                </div>

                {/* Glass Upload Portal */}
                <div
                    className={`
                        glass-card relative flex flex-col items-center justify-center w-full h-[320px]
                        border-2 border-dashed transition-all duration-500
                        ${isDragging
                            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-[0_0_50px_rgba(99,102,241,0.2)]'
                            : 'border-white/5 hover:border-indigo-500/40 hover:bg-white/5'
                        }
                        cursor-pointer group
                    `}
                    onClick={() => document.getElementById('uploadInput').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input id="uploadInput" type="file" className="hidden" onChange={handleFileChange} />

                    {/* Animated Upload Core */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse opacity-50" />
                        <div className="relative w-20 h-20 glass-panel rounded-3xl flex items-center justify-center border-white/10 group-hover:scale-110 group-hover:border-indigo-500/50 transition-all duration-500">
                            <Icons.Upload size={32} className="text-indigo-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-black text-white tracking-tight">Upload Protocol</h3>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                            Drag files here or <span className="text-indigo-400">browse local terminal</span>
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="absolute bottom-6 flex gap-4">
                        {['PDF', 'DOCX', 'TXT'].map(fmt => (
                            <span key={fmt} className="text-[9px] font-black text-slate-600 tracking-widest">{fmt}</span>
                        ))}
                    </div>
                </div>

                {/* Footer Status */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Icons.Shield size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Encrypted Uplink Active</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold text-center max-w-[280px]">
                        Our AI analyzes cross-institutional heuristics for genuine originality verification.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Upload;

