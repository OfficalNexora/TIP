import React from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import LandingNav from '../layout/LandingNav';

const Landing = ({ videoLoaded, randomText, onStart }) => {

    useGSAP(() => {
        // Set initial hidden state for animation
        gsap.set(".hero-element", { autoAlpha: 0, y: 30 });
        gsap.set(".navbar-element", { y: -100, autoAlpha: 0 });

        // Animate in when video loads OR after 2s fallback (whichever comes first)
        const animate = () => {
            const tl = gsap.timeline();
            tl.to(".navbar-element", { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" })
                .to(".hero-element", { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.2, ease: "power3.out" }, "-=0.5");
        };

        if (videoLoaded) {
            animate();
        } else {
            // Fallback: show content after 2s even if video hasn't loaded
            const fallbackTimer = setTimeout(animate, 2000);
            return () => clearTimeout(fallbackTimer);
        }
    }, [videoLoaded]);

    return (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center">
            <LandingNav />
            <div className="text-center relative max-w-7xl px-6 flex flex-col items-center">

                {/* Primary Branding */}
                <h1 className="hero-element text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                    TIP <span className="text-blue-400">AI</span>
                </h1>

                {/* Explanatory Line */}
                <p className="hero-element text-lg text-slate-200 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                    An AI-powered platform for auditing documents against UNESCO ethical standards.
                </p>

                {/* Action Button */}
                <button
                    onClick={onStart}
                    className="hero-element px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    Simulan na ngayon
                </button>
            </div>
        </div>
    );
};

export default Landing;
