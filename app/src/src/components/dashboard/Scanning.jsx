import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useData, useScan } from '../../contexts/DashboardContext';

const Scanning = () => {
    const { activeFile } = useData();
    const { scanStatus } = useScan();

    const filename = activeFile?.filename;
    const status = scanStatus;
    const isComplete = status?.toLowerCase().includes('complete');

    return (
        <div className="h-full flex flex-col items-center justify-center px-6 animate-in fade-in duration-700">

            {/* Visual Core */}
            <div className={`relative w-64 h-64 mb-12 transition-all duration-1000 ${isComplete ? 'scale-110' : 'scale-100'}`}>
                {/* Core Glow */}
                <div className={`absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full transition-all duration-1000 ${isComplete ? 'opacity-100' : 'opacity-40 animate-pulse'}`} />

                {/* Inner Ring */}
                <div className="absolute inset-4 border border-indigo-500/20 rounded-full animate-spin-slow" />

                {/* Lottie Container */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <DotLottieReact
                        src="https://lottie.host/8908b664-402b-4f65-ab5f-122e42a0eaff/lJD6OSQpKY.lottie"
                        loop={!isComplete}
                        autoplay
                        className="w-full h-full"
                    />
                </div>

                {/* Satellite Nodes (Deco) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_#818cf8]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]" />
            </div>

            {/* Status Info */}
            <div className="max-w-md w-full space-y-6 text-center">
                <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">Analytic Protocol Active</span>
                    <h3 className="text-2xl font-black text-white tracking-tight truncate px-4">
                        {filename || "Processing Terminal Input"}
                    </h3>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-white/5 bg-white/5">
                    <p className="text-[12px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                        {status || "Initializing deep heuristic scan. Cross-referencing institutional databases and verifying semantic integrity."}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="px-10 space-y-3">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
                        <div className="absolute inset-y-0 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full animate-progress-loading w-1/2 shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        <span>Heuristic Phase</span>
                        <span>{isComplete ? '100%' : 'Syncing'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scanning;

