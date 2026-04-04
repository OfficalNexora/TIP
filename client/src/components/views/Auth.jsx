import React, { useState } from 'react';
import { supabase } from '../../supabase';
import Icons from '../ui/Icons';
import { useTranslation } from '../../utils/useTranslation';

const Auth = () => {
    const [authMode, setAuthMode] = useState('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { t, language, setLanguage } = useTranslation();

    const handleAuthExec = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Diagnostic Log for On-Device Verification
            console.log(`[Auth] Attempting login to: ${import.meta.env.VITE_SUPABASE_URL}`);
            
            const cleanEmail = email.trim();
            const cleanPassword = password.trim();

            if (authMode === 'LOGIN') {
                const { error } = await supabase.auth.signInWithPassword({ 
                    email: cleanEmail, 
                    password: cleanPassword 
                });
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
                alert(t('auth.signUpSuccess'));
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
                    <h2 className="text-3xl font-black tracking-[0.2em] mb-4 uppercase">
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500">TIP</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A227] to-amber-200">AI</span>
                    </h2>
                    <h3 className="text-lg font-bold text-white mb-2">
                        {authMode === 'LOGIN' ? t('auth.welcomeBack') : t('auth.createAccount')}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                        {authMode === 'LOGIN' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
                    </p>
                </div>

                {/* Language Toggle */}
                <div className="absolute top-4 right-4 group">
                    <button 
                        onClick={() => setLanguage(language === 'en' ? 'tl' : 'en')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                    >
                        <Icons.Globe size={12} />
                        {t('auth.languageTag')}
                    </button>
                    <div className="absolute top-full right-0 mt-2 p-2 bg-slate-800 border border-white/10 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t('auth.chooseLanguage')}</p>
                    </div>
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
                        {t('auth.signIn')}
                    </button>
                    <button
                        onClick={() => setAuthMode('CREATE')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${authMode === 'CREATE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {t('auth.signUp')}
                    </button>
                </div>

                {/* Form Area */}
                <form onSubmit={handleAuthExec} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">{t('auth.emailLabel')}</label>
                        <input
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all placeholder:text-slate-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">{t('auth.passwordLabel')}</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={t('auth.passwordPlaceholder')}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all placeholder:text-slate-600 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-[#C9A227] hover:bg-amber-500 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:shadow-[0_0_30px_rgba(201,162,39,0.5)] transform active:scale-95 flex items-center justify-center gap-2 mt-4"
                        disabled={loading}
                    >
                        {loading ? t('auth.signingIn') : (authMode === 'LOGIN' ? t('auth.submitSignIn') : t('auth.submitSignUp'))}
                    </button>
                </form>

                {/* Social Auth Separator */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900/60 px-2 text-slate-500 font-bold tracking-widest">{t('auth.orSeparator')}</span>
                    </div>
                </div>

                {/* Social Auth Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={async () => {
                            setLoading(true);
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: { redirectTo: window.location.origin }
                            });
                            if (error) setError(error.message);
                            setLoading(false);
                        }}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <Icons.Google size={14} />
                        Google
                    </button>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'facebook',
                                options: { redirectTo: window.location.origin }
                            });
                            if (error) setError(error.message);
                            setLoading(false);
                        }}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all"
                    >
                        <Icons.Facebook size={14} />
                        Facebook
                    </button>
                </div>
            </div>

            {/* FULL SCREEN OVERLAY FOR AUTH TRANSITIONS */}
            {loading && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Icons.Loader className="animate-spin text-[#C9A227] mb-4" size={48} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-8 animate-pulse">
                        {authMode === 'LOGIN' ? t('auth.verifyingCredentials') : t('auth.registeringIdentity')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Auth;
