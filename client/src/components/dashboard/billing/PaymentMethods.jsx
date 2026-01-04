import React, { useState } from 'react';
import Icons from '../../ui/Icons';

const PaymentMethods = ({ methods, onAdd, onRemove, isLoading }) => {
    const [isAdding, setIsAdding] = useState(false);

    // Derived state
    const hasMethods = Array.isArray(methods) && methods.length > 0;

    if (isLoading && !methods) {
        return (
            <div className="bg-[#1E293B] rounded-lg p-6 h-[200px] animate-pulse">
                <div className="h-6 w-32 bg-slate-700 rounded mb-6"></div>
                <div className="h-16 w-full bg-slate-700/50 rounded"></div>
            </div>
        );
    }

    if (methods && !Array.isArray(methods)) {
        console.error('PaymentMethods received invalid prop:', methods);
        return <div className="text-red-400 p-4">Error loading payment methods.</div>;
    }

    return (
        <div className="bg-[#1E293B] rounded-lg p-6 border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Icons.CreditCard size={20} className="text-blue-400" />
                    Payment Methods
                </h3>
            </div>

            {/* Payment Methods List or Empty State */}
            {hasMethods ? (
                <div className="space-y-4">
                    {methods.map((method) => (
                        <div key={method.id} className="relative p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all shadow-lg group overflow-hidden">
                            {/* Card Background Decor */}
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-slate-700/50 rounded flex items-center justify-center border border-slate-600/50 shadow-inner">
                                        {method.type === 'card' ? <Icons.CreditCard size={18} className="text-blue-300" /> : <Icons.Zap size={18} className="text-yellow-400" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white tracking-wide capitalize text-sm">
                                                {method.brand || method.type}
                                            </p>
                                            {method.is_default && (
                                                <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-500/20">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 font-mono text-xs mt-0.5">
                                            •••• {method.last4 || '••••'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Expires</p>
                                    <p className="text-xs text-slate-300 font-mono">{method.exp_month ? `${String(method.exp_month).padStart(2, '0')}/${method.exp_year}` : '--/--'}</p>
                                </div>
                            </div>

                            {!method.is_default && (
                                <button
                                    onClick={() => onRemove(method.id)}
                                    className="absolute bottom-3 right-4 text-[10px] text-red-400/60 hover:text-red-300 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Compact Add Button when list exists */}
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:bg-slate-800/50 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Icons.Plus size={16} /> Add another method
                        </button>
                    ) : (
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 animate-in fade-in zoom-in-95">
                            {/* ... Selection Logic ... */}
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Method</h4>
                                <button onClick={() => setIsAdding(false)}><Icons.X size={14} className="text-slate-500 hover:text-white" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { onAdd('card'); setIsAdding(false); }} className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-800 transition-all text-left group">
                                    <span className="block text-white text-sm font-medium">Card</span>
                                    <span className="text-[10px] text-slate-500 group-hover:text-blue-400">Stripe Secure</span>
                                </button>
                                <button onClick={() => { onAdd('gcash'); setIsAdding(false); }} className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-blue-500/50 hover:bg-slate-800 transition-all text-left group">
                                    <span className="block text-white text-sm font-medium">GCash</span>
                                    <span className="text-[10px] text-slate-500 group-hover:text-blue-400">Redirect</span>
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                /* Unified Empty State + Add Action (No "Too Much Air") */
                <div className="text-center py-6 px-4 bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600 transition-all group">
                    {!isAdding ? (
                        <>
                            <div className="w-10 h-10 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/10 transition-colors">
                                <Icons.CreditCard size={20} className="text-slate-400 group-hover:text-blue-400" />
                            </div>
                            <h4 className="text-slate-200 font-medium text-sm mb-1">No payment method</h4>
                            <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">Add a card to enable automatic billing for your subscription.</p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold border border-blue-500/20 hover:border-transparent transition-all"
                            >
                                + Add Payment Method
                            </button>
                        </>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95">
                            <h4 className="text-sm font-medium text-white mb-3">Select Method</h4>
                            <div className="grid grid-cols-2 gap-2 max-w-[240px] mx-auto">
                                <button onClick={() => { onAdd('card'); setIsAdding(false); }} className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-all">
                                    <span className="text-xs font-bold">Card</span>
                                </button>
                                <button onClick={() => { onAdd('gcash'); setIsAdding(false); }} className="p-3 bg-slate-900 border border-slate-700 rounded-lg hover:border-blue-500 hover:text-blue-400 transition-all">
                                    <span className="text-xs font-bold">GCash</span>
                                </button>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="mt-3 text-[10px] text-slate-500 hover:text-slate-300">Cancel</button>
                        </div>
                    )}
                </div>
            )}

            {/* Removed the separate "Add Method Section" div entirely */}

            <div className="mt-4 flex items-center gap-2 justify-center text-[10px] text-slate-500">
                <Icons.Lock size={10} />
                <span>Securely processed by Stripe. Your details are never stored on our servers.</span>
            </div>
        </div>
    );
};

export default PaymentMethods;
