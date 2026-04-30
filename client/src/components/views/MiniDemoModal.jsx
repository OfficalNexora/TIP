import React, { useState } from 'react';
import Icons from '../ui/Icons';
import GlitchText from '../ui/GlitchText';

const MiniDemoModal = ({ onClose }) => {
    const [textInput, setTextInput] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleAnalyze = async () => {
        if (textInput.trim().length < 50) {
            setErrorMsg('Ang teksto ay masyadong maikli (minimum 50 characters).');
            setStatus('error');
            return;
        }
        if (textInput.length > 3000) {
            setErrorMsg('Ang teksto ay masyadong mahaba (maximum 3000 characters).');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/demo/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Server Error');
            }

            setResult(data);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.message || 'May naganap na error. Pakisubukan muli.');
            setStatus('error');
        }
    };

    const handleReset = () => {
        setTextInput('');
        setResult(null);
        setStatus('idle');
        setErrorMsg('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal Box */}
            <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl md:rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 md:p-8 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#C9A227]/20 flex items-center justify-center border border-[#C9A227]/50">
                                <Icons.Cpu size={16} className="text-[#C9A227]" />
                            </span>
                            TIP AI Live Demo
                        </h2>
                        <p className="text-xs md:text-sm text-slate-400 mt-2">
                            Mabilisang pagsusuri ng maliit na text block (Max 3,000 characters limit).
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-rose-500/80 text-white flex items-center justify-center transition-all border border-transparent hover:border-rose-400"
                    >
                        <Icons.X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                    {status === 'idle' || status === 'error' ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
                                I-paste ang teksto dito
                            </label>
                            <textarea
                                value={textInput}
                                onChange={(e) => {
                                    setTextInput(e.target.value);
                                    if(status === 'error') setStatus('idle');
                                }}
                                placeholder="Halimbawa: Ayon sa pag-aaral, ang AI ay mabilis na umuunlad..."
                                className="w-full h-48 md:h-64 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/50 resize-none font-mono"
                            ></textarea>
                            
                            <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                                <span>{textInput.length} / 3000 chars</span>
                            </div>

                            {status === 'error' && (
                                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm flex items-center gap-2">
                                    <Icons.AlertTriangle size={16} />
                                    {errorMsg}
                                </div>
                            )}

                            <button
                                onClick={handleAnalyze}
                                disabled={textInput.trim().length === 0}
                                className="w-full py-4 bg-[#C9A227] hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(201,162,39,0.2)] flex items-center justify-center gap-2"
                            >
                                <Icons.Play size={18} />
                                Suriin Ngayon
                            </button>
                        </div>
                    ) : status === 'loading' ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-[#C9A227] animate-spin"></div>
                            <div className="text-center">
                                <GlitchText text="TINATAYA ANG TEKSTO..." className="text-[#C9A227] font-black tracking-[0.3em] text-sm" />
                                <p className="text-xs font-mono text-slate-500 mt-2 animate-pulse">Running optimized mini-audit...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kasiguraduhan ng AI</span>
                                    <div className="text-6xl font-black tracking-tighter" style={{
                                        color: result.ai_probability > 50 ? '#ef4444' : '#10b981'
                                    }}>
                                        {result.ai_probability}%
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col justify-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Buod (Summary)</span>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {result.short_explanation}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/5 text-amber-200/80 text-xs text-center flex gap-2 items-center justify-center">
                                <Icons.Info size={14} className="text-[#C9A227]" />
                                Limitado lamang sa mabilisang analysis ang Demo Version.
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10"
                            >
                                Suriin Muli
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MiniDemoModal;
