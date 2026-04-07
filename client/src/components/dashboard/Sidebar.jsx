import React from 'react';
import tipLogo from '../../assets/no background logo fnl.png';
import Icons from '../ui/Icons';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';
import { useTranslation } from '../../utils/useTranslation';

const Sidebar = React.memo(() => {
    const { dashboardState, isChatOpen, rightPanelOpen } = useUI();
    const { activeFile, files, credits, creditsTotal } = useData();
    const { setDashboardState, setIsChatOpen, setRightPanelOpen, loadFile, setActiveFile, setSubscriptionOpen } = useActions();
    const { t } = useTranslation();

    const onUpgrade = () => setSubscriptionOpen(true);
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
                    <span className="text-lg font-bold tracking-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500">TIP</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A227] to-amber-200">AI</span>
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider sidebar-item">
                    {t('nav.tools')}
                </div>
                <NavItem
                    icon={Icons.LayoutDashboard}
                    label={t('nav.dashboard')}
                    isActive={dashboardState === 'OVERVIEW'}
                    onClick={() => handleNavigation('OVERVIEW', true)}
                    className="sidebar-item"
                />

                <NavItem
                    icon={Icons.Plus}
                    label={t('nav.newAnalysis')}
                    isActive={dashboardState === 'UPLOAD'}
                    onClick={() => handleNavigation('UPLOAD')}
                    count="+"
                    className="sidebar-item"
                />

                <NavItem
                    icon={Icons.Grid}
                    label={t('nav.scanHistory')}
                    isActive={dashboardState === 'HISTORY'}
                    onClick={() => handleNavigation('HISTORY', true)}
                    className="sidebar-item"
                />

                <NavItem
                    icon={Icons.Layers}
                    label={t('nav.batching')}
                    isActive={dashboardState === 'BATCH'}
                    onClick={() => handleNavigation('BATCH', true)}
                    className="sidebar-item"
                />

                {/* AI & Insights Section - Strictly visible only in RESULTS mode with active file */}
                {dashboardState === 'RESULTS' && activeFile && (
                    <div ref={aiSectionRef}>
                        <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider ai-item">
                            {t('nav.aiInsights')}
                        </div>
                        <NavItem
                            icon={Icons.FileText}
                            label={t('nav.viewReport')}
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
                            label={t('nav.aiAssistant')}
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
                    {t('nav.account')}
                </div>
                {userProfile?.role === 'admin' && (
                    <NavItem
                        icon={Icons.ShieldCheck}
                        label={t('nav.adminPanel') || 'Admin Hub'}
                        isActive={dashboardState === 'ADMIN'}
                        onClick={() => handleNavigation('ADMIN')}
                        className="sidebar-item"
                    />
                )}
                <NavItem
                    icon={Icons.Settings}
                    label={t('nav.settings')}
                    isActive={dashboardState === 'SETTINGS'}
                    onClick={() => handleNavigation('SETTINGS')}
                    className="sidebar-item"
                />
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 bg-[#f8f9fc] dark:bg-slate-900/30 transition-colors">
                {/* Institutional Usage Card */}
                <div
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 mb-3 shadow-md relative overflow-hidden group cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg"
                >
                    {/* Decorative glow */}
                    <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-all duration-700"></div>

                    <div className="flex items-center justify-between mb-3 relative z-10">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">{t('nav.institutionUsage')}</p>
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-blue-100 dark:ring-blue-800/50">
                            <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
                            ACTIVE
                        </div>
                    </div>

                    <div className="flex items-end justify-between mb-2 relative z-10">
                        <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{credits.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold ml-1">TOKENS</span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1">{t('nav.outOf')} {creditsTotal.toLocaleString()}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-slate-700/30">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                            style={{ width: `${Math.min(100, Math.max(0, (credits / (creditsTotal || 1)) * 100))}%` }}
                        ></div>
                    </div>

                    <button
                        onClick={onUpgrade}
                        className="w-full bg-[#001c3d] dark:bg-blue-600 hover:bg-[#002f66] dark:hover:bg-blue-500 text-white text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-sm hover:shadow-md"
                    >
                        <Icons.Zap size={13} className="text-yellow-400 fill-yellow-400" />
                        {t('nav.addTokens')}
                    </button>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                    <Icons.HelpCircle size={18} />
                    {t('nav.support')}
                </button>
            </div>
        </aside>
    );
});

export default Sidebar;
