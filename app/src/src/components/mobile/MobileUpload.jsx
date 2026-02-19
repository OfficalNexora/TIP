import React from 'react';
import Icons from '../ui/Icons';
import { useActions } from '../../contexts/DashboardContext';

const MobileUpload = () => {
    const { startScan } = useActions();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            startScan(e.target.files[0]);
        }
    };

    return (
        <div className="h-full flex flex-col justify-end pb-32 px-6 animate-in slide-in-from-bottom duration-500">
            <div className="mb-auto pt-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Ready for Input</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">New Audit</h1>
                <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[280px]">Select a source to begin deep heuristic analysis and integrity verification.</p>
            </div>

            <div className="space-y-4">
                {/* Camera Option */}
                <button
                    onClick={() => document.getElementById('cameraInput').click()}
                    className="w-full h-24 glass-card flex items-center gap-5 px-6 border-indigo-500/30 active:scale-95 transition-transform group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                        <Icons.Camera size={24} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                        <span className="text-lg font-black text-white block mb-0.5">Scan Document</span>
                        <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Use Camera</span>
                    </div>
                    <input
                        id="cameraInput"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </button>

                {/* File Option */}
                <button
                    onClick={() => document.getElementById('fileInput').click()}
                    className="w-full h-24 glass-card flex items-center gap-5 px-6 active:scale-95 transition-transform group"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 border border-white/10 group-hover:scale-110 transition-transform">
                        <Icons.FileText size={24} strokeWidth={2} />
                    </div>
                    <div className="text-left">
                        <span className="text-lg font-black text-white block mb-0.5">Upload File</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">PDF, DOCX, TXT</span>
                    </div>
                    <input
                        id="fileInput"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </button>
            </div>
        </div>
    );
};

export default MobileUpload;
