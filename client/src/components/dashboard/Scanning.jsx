import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Scanning = ({ filename, status }) => {
    const isComplete = status?.toLowerCase().includes('complete');

    return (
        <div className="h-full flex flex-col items-center justify-center pt-10 animate-in fade-in duration-700 pb-20">
            <div className={`w-[300px] h-[300px] relative mb-8 transition-all duration-1000 ${isComplete ? 'scale-110' : 'scale-100'}`}>
                <DotLottieReact
                    src="https://lottie.host/8908b664-402b-4f65-ab5f-122e42a0eaff/lJD6OSQpKY.lottie"
                    loop={!isComplete}
                    autoplay
                    className={`w-full h-full transition-opacity duration-1000 ${isComplete ? 'opacity-100' : 'opacity-80'}`}
                />
                {isComplete && (
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl animate-pulse rounded-full -z-10"></div>
                )}
            </div>

            <div className="flex flex-col items-center gap-4 text-center max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-tip-text-main tracking-tight transition-colors">
                    {filename || "Processing Document"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 transition-colors h-12">
                    {status || "Our system is analyzing the document structure and verifying compliance with UNESCO ethical guidelines."}
                </p>

                <div className="w-64 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden relative transition-colors shadow-inner">
                    <div className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-progress-loading w-1/2 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
            </div>
        </div>
    );
};

export default Scanning;
