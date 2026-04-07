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
    const [usage, setUsage] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

    useEffect(() => {
        const fetchAdminData = async () => {
            if (!session?.access_token) return;
            setLoading(true);
            
            const config = {
                headers: { 
                    Authorization: `Bearer ${session.access_token}`,
                    'ngrok-skip-browser-warning': '69420'
                }
            };

            const baseUrl = import.meta.env.VITE_API_BASE_URL;

            try {
                // Fetch Stats (Highest Priority)
                try {
                    const res = await axios.get(`${baseUrl}/api/admin/stats`, config);
                    setStats(res.data);
                } catch (e) { console.error('Stats failed', e); }

                // Fetch Users
                try {
                    const res = await axios.get(`${baseUrl}/api/admin/users`, config);
                    setUsers(Array.isArray(res.data) ? res.data : []);
                } catch (e) { console.error('Users failed', e); }

                // Fetch Payments (Invoices)
                try {
                    const res = await axios.get(`${baseUrl}/api/admin/payments`, config);
                    setPayments(Array.isArray(res.data) ? res.data : []);
                } catch (e) { console.error('Payments failed', e); }

                // Fetch Usage
                try {
                    const res = await axios.get(`${baseUrl}/api/admin/usage`, config);
                    setUsage(res.data);
                } catch (e) { console.error('Usage failed', e); }

            } catch (error) {
                console.error('[AdminPanel] Global Fetch error:', error);
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
                <p className="text-xs font-black uppercase tracking-widest">Synchronizing Infrastructure...</p>
            </div>
        );
    }

    const renderUserDirectory = () => (
        <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">User Identity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Tokens</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Joined</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.full_name || 'Anonymous User'}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{user.email}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${user.role === 'admin' ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-sm font-black text-slate-900 dark:text-tip-text-main">{user.credits || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`text-[9px] font-black uppercase ${user.subscription_status === 'pro' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {user.subscription_status || 'Free'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">
                            {new Date(user.created_at).toLocaleDateString()}
                        </td>
                    </tr>
                ))}
                {users.length === 0 && (
                    <tr>
                        <td colSpan="5" className="p-20 text-center text-slate-400 uppercase tracking-[0.2em] font-black text-xs">
                            No users found in directory
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    const renderPaymentFeed = () => (
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {payments.map(invoice => (
                <div key={invoice.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                            <Icons.Zap size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                {invoice.description || 'Token Top-up'}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                                {invoice.users?.full_name || 'System User'} • {invoice.users?.email}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-sm font-black uppercase mb-1 ${invoice.status === 'paid' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {invoice.currency} {parseFloat(invoice.amount).toFixed(2)}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(invoice.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
            {payments.length === 0 && (
                <div className="p-20 text-center text-slate-400 uppercase tracking-[0.2em] font-black text-xs">
                    No payment history recorded
                </div>
            )}
        </div>
    );

    const renderSystemUsage = () => (
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Token Consumption (Last 100)</h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                                {usage?.total_tokens?.toLocaleString() || 0}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">System Tokens Processed</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-emerald-500 uppercase">ACTIVE POOL</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase mt-1">Free Tier Optimized</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Model Distribution</h3>
                    <div className="space-y-4">
                        {usage?.by_model && Object.entries(usage.by_model).map(([model, count]) => (
                            <div key={model} className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{model}</span>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{count.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, (count / (usage.total_tokens || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {!usage?.by_model && <p className="text-[10px] text-slate-400 font-black uppercase">No model data available</p>}
                    </div>
                </div>
            </div>

            <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Icons.Activity size={14} className="text-blue-500" />
                        Live Infrastructure Feed
                    </h3>
                </div>
                <div className="bg-white/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Provider</th>
                                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Model</th>
                                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Load</th>
                                <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {usage?.recent_logs?.map(log => (
                                <tr key={log.id} className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-black text-blue-600 dark:text-blue-400 uppercase">{log.provider}</td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{log.model_name}</td>
                                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white uppercase">{log.total_tokens} tokens</td>
                                    <td className="px-6 py-4 text-slate-400 font-bold uppercase">{new Date(log.created_at).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                            {(!usage?.recent_logs || usage.recent_logs.length === 0) && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 uppercase tracking-widest font-black">No infrastructure logs detected</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 p-10 pt-6 max-h-[100vh] overflow-hidden">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20">
                            System Admin
                        </div>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-tip-text-main mb-2">
                        Admin Hub
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
                        Institutional engine dashboard. Monitor global usage metrics, revenue streams, and user infrastructure in real-time.
                    </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-inner">
                    {[
                        { id: 'users', label: 'User Directory', icon: Icons.Users },
                        { id: 'payments', label: 'Payment Feed', icon: Icons.Zap },
                        { id: 'usage', label: 'System Usage', icon: Icons.Activity }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => {
                                console.log('Switching to tab:', tab.id);
                                setActiveTab(tab.id);
                            }}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm group hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Icons.Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">{stats?.totalUsers || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm group hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Icons.Activity size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Scans</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">{stats?.totalScans || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm group hover:border-violet-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Icons.CreditCard size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">PHP {stats?.totalRevenue || '0.00'}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm group hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Icons.Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tokens</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase">{stats?.activeTokens || 0}</p>
                </div>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 bg-white/40 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800 rounded-[2.5rem] overflow-hidden flex flex-col min-h-0 shadow-inner">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    {activeTab === 'users' && renderUserDirectory()}
                    {activeTab === 'payments' && renderPaymentFeed()}
                    {activeTab === 'usage' && renderSystemUsage()}
                </div>
                <div className="px-8 py-5 bg-white/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 backdrop-blur-md flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        TIP AI Integrity Engine • Institutional Administration
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase">System Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
