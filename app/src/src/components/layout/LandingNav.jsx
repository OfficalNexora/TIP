import React from 'react';
import tipLogo from '../../assets/no background logo fnl.png';

const LandingNav = () => (
    <nav className="navbar-element fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 group pointer-events-auto cursor-pointer">
            <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center p-1.5 transition-transform group-hover:scale-110">
                <img src={tipLogo} alt="TIP AI Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-black text-white tracking-widest leading-none">TIP <span className="text-indigo-400">AI</span></span>
                <span className="text-[8px] font-bold text-slate-500 tracking-[0.4em] mt-1">PROTOCOLS</span>
            </div>
        </div>

        <div className="hidden md:flex items-center gap-8 pointer-events-auto">
            <button className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors tracking-widest">ECOSYSTEM</button>
            <button className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors tracking-widest">STANDARDS</button>
            <button className="px-5 py-2 glass-panel rounded-lg text-[10px] font-bold text-indigo-400 hover:bg-white/5 transition-colors tracking-widest">ACCESS</button>
        </div>
    </nav>
);

export default LandingNav;

