import React from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import LandingNav from '../layout/LandingNav';
import Icons from '../ui/Icons';

const Landing = ({ videoLoaded, randomText, onStart }) => {

    useGSAP(() => {
        // Set initial hidden state for animation
        gsap.set(".hero-element", { autoAlpha: 0, y: 30, filter: 'blur(10px)' });
        gsap.set(".navbar-element", { y: -100, autoAlpha: 0 });

        // Animate in when video loads OR after 2s fallback
        const animate = () => {
            const tl = gsap.timeline();
            tl.to(".navbar-element", { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out" })
                .to(".hero-element", { 
                    autoAlpha: 1, 
                    y: 0, 
                    filter: 'blur(0px)',
                    duration: 1.5, 
                    stagger: 0.15, 
                    ease: "expo.out" 
                }, "-=0.8");
        };

        if (videoLoaded) {
            animate();
        } else {
            const fallbackTimer = setTimeout(animate, 2000);
            return () => clearTimeout(fallbackTimer);
        }
    }, [videoLoaded]);

    return (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C9A227]/15 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#002147]/40 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <LandingNav />
            
            <div className="text-center relative max-w-5xl px-6 flex flex-col items-center">
                {/* Institutional Badge */}
                <div className="hero-element mb-8 py-1.5 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/80">UNESCO Ethics Compliant AI</span>
                </div>

                {/* Primary Branding */}
                <h1 className="hero-element text-6xl md:text-8xl font-black tracking-tighter text-white mb-4 leading-tight">
                    TIP <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A227] to-amber-200">AI</span>
                </h1>

                {/* Full Name with Gradient Line */}
                <div className="hero-element flex flex-col items-center mb-10">
                    <p className="text-lg md:text-xl text-slate-100 font-bold tracking-tight max-w-2xl px-4">
                        Tamang Integridad at Pananagutan sa Artificial Intelligence
                    </p>
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent mt-4 opacity-50"></div>
                </div>

                {/* Explanatory Paragraph */}
                <p className="hero-element text-sm md:text-base text-slate-400 max-w-lg mb-12 font-medium leading-relaxed">
                    Ang kauna-unahang forensic AI auditor sa Pilipinas na idinisenyo upang tiyakin ang katapatan at etika sa akademikong pananaliksik.
                </p>

                {/* Action Buttons */}
                <div className="hero-element flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={onStart}
                        className="px-10 py-4 bg-[#C9A227] hover:bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:shadow-[0_0_30px_rgba(201,162,39,0.5)] transform active:scale-95 flex items-center gap-3"
                    >
                        Simulan na ngayon
                        <Icons.ArrowRight size={16} />
                    </button>
                    
                    <button
                        className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 backdrop-blur-md"
                    >
                        Tignan ang Demo
                    </button>
                </div>

                {/* Trust Indicators */}
                <div className="hero-element mt-16 pt-8 border-t border-white/5 w-full max-w-md flex justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                        <Icons.Shield size={14} className="text-[#C9A227]" />
                        Forensic Grade
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                        <Icons.Cpu size={14} className="text-[#C9A227]" />
                        AI Verified
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
