import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/DashboardContext';
import Icons from '../ui/Icons';
import { translations } from '../../utils/translations';

const AdminPanel = () => {
    const { session } = useAuth();
    const { language } = useUI();
    const [users, setUsers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!session?.access_token) return;
            setLoading(true);
            try {
                const config = {
                    headers: { Authorization: `Bearer ${session.access_token}` }
                };

                const [usersRes, paymentsRes, statsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users`, config),
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payments`, config),
                    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats`, config)
                ]);

                setUsers(usersRes.data);
                setPayments(paymentsRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('[AdminPanel] Fetch failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [session]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 animate-pulse">
                <Icons.Loader className="animate-spin text-blue-600" size={32} />
                <p className="text-xs font-black uppercase tracking-widest">Loading Admin Context...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-8 pt-4">
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-tip-text-main mb-2">
                        Admin Hub
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        System-wide monitoring and institutional management.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                    >
                        User Directory
                    </button>
                    <button 
                        onClick={() => setActiveTab('payments')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                    >
                        Payment Feed
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <Icons.Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registered</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                            <Icons.Activity size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Scans</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">{stats?.totalScans || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                            <Icons.Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tokens</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">{stats?.activeTokens || 0}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-0">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    {activeTab === 'users' ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">User Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Tokens</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.full_name || 'Anonymous User'}</span>
                                                <span className="text-[10px] text-slate-400">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${user.role === 'admin' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-100 text-slate-500'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-slate-900 dark:text-tip-text-main">{user.credits || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {payments.map(log => (
                                <div key={log.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${log.event_type === 'SUBSCRIPTION_UPGRADED' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                            <Icons.Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                                {log.event_type.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-bold">User: {log.user_id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase mb-1">
                                            {log.metadata?.provider || 'Unknown'}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-bold">
                                            {new Date(log.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && (
                                <div className="p-20 text-center text-slate-400 uppercase tracking-[0.2em] font-black text-xs">
                                    No payment events detected
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    Confidential Administrative Data • TIP AI Integrity Engine
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
