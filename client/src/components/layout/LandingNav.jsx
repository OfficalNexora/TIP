import React from 'react';
import tipLogo from '../../assets/no background logo fnl.png';

const LandingNav = () => (
    <nav className="navbar-element fixed top-0 left-0 w-full z-50 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex items-center justify-center">
                <img src={tipLogo} alt="TIP AI Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500">TIP</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A227] to-amber-200">AI</span>
            </span>
        </div>
    </nav>
);

export default LandingNav;
