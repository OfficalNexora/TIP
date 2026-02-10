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
                alert('Registration successful! Please check your email or proceed to login.');
                setAuthMode('LOGIN');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-transparent animate-in fade-in duration-700 p-6">
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-8 w-full max-w-sm rounded-2xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-700">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {authMode === 'LOGIN' ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="text-sm text-slate-400">
                        {authMode === 'LOGIN' ? 'Sign in to access the platform.' : 'Enter your details to get started.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium text-center">
                        {error}
                    </div>
                )}

                {/* Tab Switcher - Simplified */}
                <div className="flex bg-slate-800/50 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => setAuthMode('LOGIN')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${authMode === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setAuthMode('CREATE')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${authMode === 'CREATE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Register
                    </button>
                </div>

                {/* Form Area */}
                <form onSubmit={handleAuthExec} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@institution.edu"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : (authMode === 'LOGIN' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
            </div>

            {/* FULL SCREEN OVERLAY FOR AUTH TRANSITIONS */}
            {loading && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Loader />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-8 animate-pulse">
                        {authMode === 'LOGIN' ? 'Verifying Credentials' : 'Registering Institutional Identity'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Auth;
