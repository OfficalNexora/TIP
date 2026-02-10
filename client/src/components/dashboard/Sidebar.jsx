import React from 'react';
import tipLogo from '../../assets/no background logo fnl.png';
import Icons from '../ui/Icons';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Sidebar = ({ dashboardState, setDashboardState, activeFile, files, loadFile, setActiveFile, onUpgrade, isChatOpen, setIsChatOpen, rightPanelOpen, setRightPanelOpen }) => {
    const aiSectionRef = React.useRef(null);
    const lastAnimatedFileId = React.useRef(null);

    useGSAP(() => {
        // Initial entry animation for standard items
        gsap.fromTo(".sidebar-item",
            { autoAlpha: 0, x: -15, filter: 'blur(4px)' },
            {
                autoAlpha: 1,
                x: 0,
                filter: 'blur(0px)',
                duration: 1,
                stagger: 0.1,
                ease: "expo.out",
                delay: 0.2
            }
        );
    }, []);

    // Animate AI section specifically when it mounts or file changes
    useGSAP(() => {
        const isCurrentlyInResults = dashboardState === 'RESULTS' && activeFile;

        if (isCurrentlyInResults && aiSectionRef.current && lastAnimatedFileId.current !== activeFile.id) {
            gsap.fromTo(aiSectionRef.current.querySelectorAll('.ai-item'),
                { autoAlpha: 0, y: -10, scale: 0.95 },
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: "back.out(1.7)"
                }
            );
            lastAnimatedFileId.current = activeFile.id;
        } else if (!isCurrentlyInResults) {
            lastAnimatedFileId.current = null;
        }
    }, [activeFile, dashboardState]);

    const NavItem = ({ icon: Icon, label, isActive, onClick, count, className = "" }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${className} ${isActive
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
        >
            <Icon size={18} className={isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'} />
            <span className="flex-1 text-left">{label}</span>
            {count !== undefined && (
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{count}</span>
            )}
        </button>
    );

    // Centralized navigation handler to clear active panels and context
    const handleNavigation = (state, clearFile = false) => {
        setDashboardState(state);
        setIsChatOpen(false);
        if (setRightPanelOpen) setRightPanelOpen(false);
        if (clearFile) setActiveFile(null);
    };

    return (
        <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-30 font-sans h-full transition-colors duration-300">

            {/* Logo Area */}
            <div className="h-20 flex items-center px-6">
                <div className="flex items-center gap-2.5">
                    <img src={tipLogo} alt="TIP AI" className="w-7 h-7 object-contain" />
                    <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">TIP <span className="text-blue-700 dark:text-blue-400">AI</span></span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider sidebar-item">
                    Tools
                </div>
                <NavItem
                    icon={Icons.LayoutDashboard}
                    label="Dashboard"
                    isActive={dashboardState === 'OVERVIEW'}
                    onClick={() => handleNavigation('OVERVIEW', true)}
                    className="sidebar-item"
                />

                <NavItem
                    icon={Icons.Plus}
                    label="Bagong Analysis"
                    isActive={dashboardState === 'UPLOAD'}
                    onClick={() => handleNavigation('UPLOAD')}
                    count="+"
                    className="sidebar-item"
                />

                <NavItem
                    icon={Icons.Grid}
                    label="Kasaysayan ng Scan"
                    isActive={dashboardState === 'HISTORY'}
                    onClick={() => handleNavigation('HISTORY', true)}
                    className="sidebar-item"
                />

                {/* AI & Insights Section - Strictly visible only in RESULTS mode with active file */}
                {dashboardState === 'RESULTS' && activeFile && (
                    <div ref={aiSectionRef}>
                        <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider ai-item">
                            AI & Insights
                        </div>
                        <NavItem
                            icon={Icons.FileText}
                            label="Tignan ang Report"
                            isActive={rightPanelOpen && dashboardState === 'RESULTS'}
                            onClick={() => {
                                if (rightPanelOpen) {
                                    if (setRightPanelOpen) setRightPanelOpen(false);
                                } else {
                                    setDashboardState('RESULTS');
                                    setIsChatOpen(false);
                                    if (setRightPanelOpen) setRightPanelOpen(true);
                                }
                            }}
                            className="ai-item"
                        />
                        <NavItem
                            icon={Icons.MessageCircle}
                            label="AI Assistant"
                            isActive={isChatOpen}
                            onClick={() => {
                                if (isChatOpen) {
                                    setIsChatOpen(false);
                                } else {
                                    setIsChatOpen(true);
                                    setDashboardState('RESULTS');
                                    if (setRightPanelOpen) setRightPanelOpen(false);
                                }
                            }}
                            className="ai-item"
                        />
                    </div>
                )}

                <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider sidebar-item">
                    Account
                </div>
                <NavItem
                    icon={Icons.Shield}
                    label="Profile ng Pagsunod"
                    isActive={dashboardState === 'COMPLIANCE'}
                    onClick={() => handleNavigation('COMPLIANCE')}
                    className="sidebar-item"
                />
                <NavItem
                    icon={Icons.Settings}
                    label="Mga Setting"
                    isActive={dashboardState === 'SETTINGS'}
                    onClick={() => handleNavigation('SETTINGS')}
                    className="sidebar-item"
                />
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 bg-[#f8f9fc] dark:bg-slate-900/30 transition-colors">
                {/* Free Plan / Upgrade Card */}
                <div
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-3 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Katayuan ng Sistema</p>
                        <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">BETA</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">Public Preview</span>
                    </div>



                    <button
                        onClick={onUpgrade}
                        className="w-full bg-[#002147] dark:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 group-hover:bg-[#003366] dark:group-hover:bg-blue-700 transition-colors"
                    >
                        <Icons.Zap size={12} className="text-[#C9A227] fill-[#C9A227] dark:text-yellow-300 dark:fill-yellow-300" />
                        Institutional Access
                    </button>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                    <Icons.HelpCircle size={18} />
                    Support
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
