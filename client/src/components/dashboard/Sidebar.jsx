import React from 'react';
import tipLogo from '../../assets/no background logo fnl.png';
import Icons from '../ui/Icons';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Sidebar = ({ dashboardState, setDashboardState, activeFile, files, loadFile, setActiveFile, onUpgrade }) => {
    useGSAP(() => {
        gsap.fromTo(".sidebar-item",
            { autoAlpha: 0, x: -10 },
            { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        );
    }, []);

    const NavItem = ({ icon: Icon, label, isActive, onClick, count }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors sidebar-item ${isActive
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
                    icon={Icons.FileText}
                    label="Resulta ng Analysis"
                    isActive={dashboardState === 'OVERVIEW'}
                    onClick={() => { setDashboardState('OVERVIEW'); setActiveFile(null); }}
                />
                <NavItem
                    icon={Icons.Plus}
                    label="Bagong Analysis"
                    isActive={dashboardState === 'UPLOAD'}
                    onClick={() => setDashboardState('UPLOAD')}
                    count="+"
                />
                <NavItem
                    icon={Icons.Grid}
                    label="Scan History"
                    isActive={dashboardState === 'HISTORY'}
                    onClick={() => { setDashboardState('HISTORY'); setActiveFile(null); }}
                />

                <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider sidebar-item">
                    Account
                </div>
                <NavItem
                    icon={Icons.Shield}
                    label="Compliance Profile"
                    isActive={dashboardState === 'COMPLIANCE'}
                    onClick={() => setDashboardState('COMPLIANCE')}
                />
                <NavItem
                    icon={Icons.Settings}
                    label="Settings"
                    isActive={dashboardState === 'SETTINGS'}
                    onClick={() => setDashboardState('SETTINGS')}
                />
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800 bg-[#f8f9fc] dark:bg-slate-900/30 transition-colors">
                {/* Free Plan / Upgrade Card */}
                <div
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-3 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md"
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">System Status</p>
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

