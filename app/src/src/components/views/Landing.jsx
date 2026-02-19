import React from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import LandingNav from '../layout/LandingNav';

const Landing = ({ videoLoaded, randomText, onStart }) => {

    useGSAP(() => {
        gsap.set(".hero-element", { autoAlpha: 0, y: 40 });
        gsap.set(".navbar-element", { y: -100, autoAlpha: 0 });
        gsap.set(".glow-blob", { scale: 0, opacity: 0 });

        const tl = gsap.timeline({ delay: 0.5 });

        tl.to(".navbar-element", { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out" })
            .to(".glow-blob", { scale: 1, opacity: 0.6, duration: 2, stagger: 0.3, ease: "power4.out" }, "-=0.5")
            .to(".hero-element", { autoAlpha: 1, y: 0, duration: 1.5, stagger: 0.15, ease: "expo.out" }, "-=1.5");
    }, []);

    return (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-tip-bg">
            <LandingNav />

            {/* Ambient Background Glows */}
            <div className="glow-blob absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
            <div className="glow-blob absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full"></div>

            <div className="text-center relative z-10 max-w-4xl px-8 flex flex-col items-center">

                <div className="hero-element mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em]">{randomText || "UNESCO AI Ethics Protocol"}</span>
                </div>

                <h1 className="hero-element text-6xl md:text-8xl font-extrabold tracking-tighter text-white mb-6">
                    Audit with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Intelligence.</span>
                </h1>

                <p className="hero-element text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                    The next generation of document integrity. <br className="hidden md:block" />
                    Verified against global standards for the AI era.
                </p>

                <div className="hero-element flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={onStart}
                        className="btn-premium group"
                    >
                        Simulan na ngayon
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>

                    <button className="btn-secondary">
                        Know More
                    </button>
                </div>
            </div>

            {/* Subtle Credit */}
            <div className="hero-element absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">Designed for Excellence</p>
            </div>
        </div>
    );
};

export default Landing;

