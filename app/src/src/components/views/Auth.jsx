import React, { useState } from 'react';
import { supabase } from '../../supabase';
import Loader from '../ui/Loader';

const Auth = () => {
    const [authMode, setAuthMode] = useState('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAuthExec = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (authMode === 'LOGIN') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: email.split('@')[0] },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                alert('Success! Check your email to confirm registration.');
                setAuthMode('LOGIN');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-6 bg-tip-bg">

            {/* Ambient Background Glows */}
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="glass-card p-10 w-full max-w-sm relative z-10 animate-in zoom-in-95 fade-in duration-700">

                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-2">
                        {authMode === 'LOGIN' ? 'Tuloy po kayo' : 'Sumali sa TIP AI'}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium tracking-tight">
                        {authMode === 'LOGIN' ? 'Sign in to your secure workspace' : 'Create your institutional profile'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold text-center animate-shake">
                        {error}
                    </div>
                )}

                {/* Tab Switcher */}
                <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5">
                    <button
                        onClick={() => setAuthMode('LOGIN')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${authMode === 'LOGIN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        LOGIN
                    </button>
                    <button
                        onClick={() => setAuthMode('CREATE')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${authMode === 'CREATE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        REGISTER
                    </button>
                </div>

                {/* Form Area */}
                <form onSubmit={handleAuthExec} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Identifier</label>
                        <input
                            type="email"
                            placeholder="name@institution.edu"
                            className="glass-input w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Key</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="glass-input w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-premium w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (authMode === 'LOGIN' ? 'Enter Terminal' : 'Create Identity')}
                    </button>
                </form>
            </div>

            {/* FULL SCREEN OVERLAY FOR AUTH TRANSITIONS */}
            {loading && (
                <div className="fixed inset-0 z-[100] bg-tip-bg/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Loader />
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mt-10 animate-pulse">
                        Synchronizing Identity
                    </p>
                </div>
            )}
        </div>
    );
};

export default Auth;

