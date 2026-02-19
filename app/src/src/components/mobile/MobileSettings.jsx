import React from 'react';
import Icons from '../ui/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useActions } from '../../contexts/DashboardContext';

const MobileSettings = () => {
    const { session, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { setAppState, setDashboardState } = useActions();

    const handleLogout = async () => {
        try {
            await signOut();
            setAppState('AUTH'); // Redirect to Login, not Landing
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const userEmail = session?.user?.email || "Unknown User";
    const userRole = session?.user?.user_metadata?.role || "Auditor";

    return (
        <div className="h-full flex flex-col px-6 py-8 pb-32 overflow-y-auto custom-scrollbar bg-tip-bg fade-in-item safe-area-top">

            {/* Header */}
            <div className="mb-8 mt-4">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-1">Configuration</span>
                <h1 className="text-2xl font-black text-white tracking-tighter">System Settings</h1>
            </div>

            {/* Profile Card */}
            <div className="glass-card p-6 mb-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-white text-xl font-black">
                    {userEmail[0].toUpperCase()}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-white truncate max-w-[200px]">{userEmail}</h2>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{userRole}</span>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">

                {/* Appearance */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Interface</h3>
                    <button
                        onClick={toggleTheme}
                        className="w-full p-4 glass-card flex items-center justify-between active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <Icons.Moon size={18} className="text-indigo-400" />
                            <span className="text-sm font-bold text-white">Dark Mode</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>

                {/* Account Actions */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Session</h3>

                    <button className="w-full p-4 glass-card border-white/5 flex items-center gap-3 active:scale-95 transition-transform">
                        <Icons.User size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-300">Profile Details</span>
                    </button>

                    <button className="w-full p-4 glass-card border-white/5 flex items-center gap-3 active:scale-95 transition-transform">
                        <Icons.Lock size={18} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-300">Security & 2FA</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full p-4 glass-card border-rose-500/20 bg-rose-500/5 flex items-center gap-3 active:scale-95 transition-transform mt-4"
                    >
                        <Icons.LogOut size={18} className="text-rose-400" />
                        <span className="text-sm font-bold text-rose-400">Terminate Session</span>
                    </button>
                </div>
            </div>

            <div className="mt-auto pt-12 text-center">
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">UNESCO AI Ethics v2.4.0</p>
                <p className="text-[9px] text-slate-800">Secure Mobile Terminal</p>
            </div>
        </div>
    );
};

export default MobileSettings;
