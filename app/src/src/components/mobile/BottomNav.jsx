import React from 'react';
import Icons from '../ui/Icons';
import { useUI, useActions } from '../../contexts/DashboardContext';

const BottomNav = () => {
    const { dashboardState } = useUI();
    const { setDashboardState } = useActions();

    const handleNavigation = (state) => {
        setDashboardState(state);
    };

    const NavItem = ({ icon: Icon, label, targetState, isPrimary = false }) => {
        const isActive = dashboardState === targetState;

        if (isPrimary) {
            return (
                <div className="relative -top-8 group">
                    <button
                        onClick={() => handleNavigation(targetState)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90
                            ${isActive
                                ? 'bg-indigo-500 text-white shadow-indigo-500/50 border-4 border-slate-950 scale-110'
                                : 'bg-slate-800 text-slate-300 border-4 border-slate-950 hover:bg-slate-700 shadow-xl'
                            }`}
                    >
                        <Icon size={28} strokeWidth={3} />
                    </button>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {label}
                    </div>
                </div>
            );
        }

        return (
            <button
                onClick={() => handleNavigation(targetState)}
                className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300 active:scale-95
                    ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/10' : ''}`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {label}
                </span>
            </button>
        );
    };

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 h-20 glass-panel rounded-3xl z-50 flex items-center justify-between px-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-3xl">

            <NavItem
                icon={Icons.LayoutDashboard}
                label="Home"
                targetState="OVERVIEW"
            />

            <NavItem
                icon={Icons.Maximize}
                label="Scan"
                targetState="UPLOAD"
                isPrimary
            />

            <NavItem
                targetState="HISTORY"
            />

            <div className="w-px h-8 bg-white/5" />

            <NavItem
                icon={Icons.Settings}
                label="Config"
                targetState="SETTINGS"
            />

        </div>
    );
};

export default BottomNav;
