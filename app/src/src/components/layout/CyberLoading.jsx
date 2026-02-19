import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const CyberLoading = () => (
    <div className="fixed inset-0 z-[1000] bg-tip-void flex flex-col items-center justify-center p-6">
        {/* Cyber Pulse Background Layer */}
        <div className="absolute inset-0 bg-tip-cyan/5 cyber-pulse-glow pointer-events-none"></div>

        <div className="relative w-64 h-64 md:w-80 md:h-80">
            <DotLottieReact
                src="https://lottie.host/e30e4c4f-73bd-4f43-8a3f-b9c801207d74/7U5VpC6CXN.lottie"
                loop
                autoplay
            />
            {/* Notched focus frame */}
            <div className="absolute inset-x-0 inset-y-0 border-2 border-tip-cyan/20 pointer-events-none"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 95% 25%, 95% 75%, 100% 80%, 100% 100%, 0 100%, 0 80%, 5% 75%, 5% 25%, 0 20%)' }}>
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="flex flex-col items-center gap-1">
                <span className="text-tip-cyan font-black text-[10px] uppercase tracking-[0.6em] animate-pulse drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]">
                    System_Initializing
                </span>
                <span className="text-white/30 font-bold text-[8px] uppercase tracking-[0.2em]">
                    Protocol_V5.0_UNESCO_MIRROR
                </span>
            </div>

            {/* Single long neon bar */}
            <div className="w-full h-1 bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-tip-cyan/20 blur-[2px]"></div>
                <div className="h-full bg-tip-cyan relative transition-all duration-[1500ms] ease-out shadow-[0_0_20px_#00F0FF]"
                    style={{ width: '100%', animation: 'loading-bar 1.5s ease-out forwards' }}>
                    <div className="absolute top-0 right-0 h-full w-4 bg-white shadow-[0_0_15px_#fff]"></div>
                </div>
            </div>
        </div>
    </div>
);

export default CyberLoading;
