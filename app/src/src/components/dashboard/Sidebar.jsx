import React from 'react';
import tipLogo from '../../assets/no background logo fnl.png';
import Icons from '../ui/Icons';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';

const Sidebar = React.memo(() => {
    const { dashboardState, isChatOpen } = useUI();
    const { activeFile } = useData();
    const { setDashboardState, setIsChatOpen, setRightPanelOpen, setActiveFile, setSubscriptionOpen } = useActions();

    const onUpgrade = () => setSubscriptionOpen(true);
    const aiSectionRef = React.useRef(null);

    useGSAP(() => {
        gsap.fromTo(".nav-item-anim",
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "expo.out", delay: 0.3 }
        );
    }, []);

    const handleNavigation = (state, clearFile = false) => {
        setDashboardState(state);
        setIsChatOpen(false);
        if (setRightPanelOpen) setRightPanelOpen(false);
        if (clearFile) setActiveFile(null);
    };

    const NavButton = ({ icon: Icon, label, isActive, onClick, count, isMobile = false }) => (
        <button
            onClick={onClick}
            className={`flex items-center transition-all duration-300 group
                ${isMobile
                    ? 'flex-col gap-1 px-2 py-1'
                    : 'w-full gap-3 px-4 py-2.5 rounded-xl mb-1'
                }
                ${isActive
                    ? (isMobile ? 'text-indigo-400' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]')
                    : (isMobile ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent')
                }`}
        >
            <div className={`transition-transform duration-300 group-active:scale-90 ${isActive && !isMobile ? 'text-indigo-400' : ''}`}>
                <Icon size={isMobile ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            {!isMobile && <span className="flex-1 text-left font-bold text-[13px] tracking-tight">{label}</span>}
            {isMobile && <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">{label}</span>}
            {!isMobile && count !== undefined && (
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-black">{count}</span>
            )}
        </button>
    );

    return (
        <>
            {/* 1. DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-64 bg-slate-900/40 backdrop-blur-2xl border-r border-white/5 flex-col shrink-0 z-40 h-full transition-all">

                {/* Logo Area */}
                <div className="h-24 flex items-center px-8">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-9 h-9 glass-panel rounded-xl flex items-center justify-center p-1.5 transition-transform group-hover:scale-110">
                            <img src={tipLogo} alt="TIP AI" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white tracking-widest leading-none">TIP <span className="text-indigo-400">AI</span></span>
                            <span className="text-[7px] font-bold text-slate-500 tracking-[0.4em] mt-1 uppercase">Control Center</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Scroll Area */}
                <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-6">

                    <div>
                        <div className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] nav-item-anim">
                            Workspace
                        </div>
                        <NavButton
                            icon={Icons.LayoutDashboard}
                            label="DASHBOARD"
                            isActive={dashboardState === 'OVERVIEW'}
                            onClick={() => handleNavigation('OVERVIEW', true)}
                        />
                        <NavButton
                            icon={Icons.Plus}
                            label="NEW ANALYSIS"
                            isActive={dashboardState === 'UPLOAD'}
                            onClick={() => handleNavigation('UPLOAD')}
                        />
                        <NavButton
                            icon={Icons.Grid}
                            label="ARCHIVE"
                            isActive={dashboardState === 'HISTORY'}
                            onClick={() => handleNavigation('HISTORY', true)}
                        />
                    </div>

                    {dashboardState === 'RESULTS' && activeFile && (
                        <div className="animate-in slide-in-from-left duration-500">
                            <div className="px-4 mb-4 text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">
                                AI Intelligence
                            </div>
                            <NavButton
                                icon={Icons.FileText}
                                label="AUDIT REPORT"
                                isActive={dashboardState === 'RESULTS'}
                                onClick={() => handleNavigation('RESULTS')}
                            />
                            <NavButton
                                icon={Icons.MessageCircle}
                                label="AI ADVISOR"
                                isActive={isChatOpen}
                                onClick={() => setIsChatOpen(!isChatOpen)}
                            />
                        </div>
                    )}

                    <div>
                        <div className="px-4 mb-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] nav-item-anim">
                            Management
                        </div>
                        <NavButton
                            icon={Icons.Shield}
                            label="COMPLIANCE"
                            isActive={dashboardState === 'COMPLIANCE'}
                            onClick={() => handleNavigation('COMPLIANCE')}
                        />
                        <NavButton
                            icon={Icons.Settings}
                            label="SETTINGS"
                            isActive={dashboardState === 'SETTINGS'}
                            onClick={() => handleNavigation('SETTINGS')}
                        />
                    </div>
                </nav>

                {/* Footer / Upgrade Card */}
                <div className="p-4 border-t border-white/5">
                    <div className="glass-card p-4 relative overflow-hidden group cursor-pointer" onClick={onUpgrade}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Icons.Zap size={14} fill="currentColor" />
                            </div>
                            <span className="text-[11px] font-black text-white tracking-widest uppercase">Premium</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-3">Unlock autonomous auditing & deep heuristics.</p>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-1/3 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        </div>
                    </div>
                </div>
            </aside>

        </>
    );
});

export default Sidebar;

