import { useState } from 'react';
import Icons from '../ui/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useUI, useData, useActions } from '../../contexts/DashboardContext';

const Header = ({ setAppState }) => {
    const { dashboardState } = useUI();
    const { searchTerm, files = [] } = useData();
    const { setDashboardState, setSearchTerm, loadFile } = useActions();
    const { userProfile, session, signOut } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const displayName = userProfile?.name || userProfile?.full_name || "Authorized User";
    const displayEmail = userProfile?.email || session?.user?.email || "Institutional Account";
    const displayInitials = userProfile?.initials || (displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || "IA";

    const getTitle = () => {
        switch (dashboardState) {
            case 'OVERVIEW': return 'Terminal';
            case 'HISTORY': return 'Archive';
            case 'COMPLIANCE': return 'Auditor Profile';
            case 'SETTINGS': return 'Settings';
            case 'UPLOAD': return 'Upload';
            case 'SCANNING': return 'Analyzing';
            case 'RESULTS': return 'Resolution';
            default: return 'TIP AI';
        }
    };

    return (
        <header className="h-20 flex items-center justify-between px-6 md:px-10 bg-transparent z-50 sticky top-0 transition-all">

            {/* Left: Mobile Title / Context */}
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">
                    {getTitle()}
                </span>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                    TIP <span className="text-indigo-400 opacity-50">AI</span>
                </h2>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-6">

                {/* Subtle Search Toggle (Desktop only for now) */}
                <div className="hidden md:flex items-center glass-panel h-10 px-4 gap-3 rounded-xl border-white/5 bg-white/5">
                    <Icons.Search className="text-slate-500" size={14} />
                    <input
                        type="text"
                        placeholder="Quick scan archive..."
                        className="bg-transparent border-none text-[12px] text-white outline-none w-40 placeholder:text-slate-600 font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Profile Circle */}
                <div className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className={`w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center overflow-hidden transition-all font-black text-[12px] group hover:scale-105 active:scale-95
                            ${userMenuOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
                    >
                        {userProfile?.avatarUrl ? (
                            <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-indigo-400">{displayInitials}</span>
                        )}
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 top-14 w-56 glass-panel rounded-2xl p-2 z-[100] animate-in slide-in-from-top-2 duration-300" onMouseLeave={() => setUserMenuOpen(false)}>
                            <div className="px-3 py-3 mb-2 border-b border-white/5">
                                <p className="text-[13px] font-black text-white truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-500 font-bold truncate tracking-tight">{displayEmail}</p>
                            </div>

                            <button className="w-full text-left px-3 py-2.5 text-[12px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-3">
                                <Icons.Settings size={14} /> Platform Settings
                            </button>

                            <button
                                onClick={async () => {
                                    if (signOut) await signOut();
                                    setAppState('LANDING');
                                    setUserMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2.5 text-[12px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-3 mt-1"
                            >
                                <Icons.LogOut size={14} /> Terminate Session
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

