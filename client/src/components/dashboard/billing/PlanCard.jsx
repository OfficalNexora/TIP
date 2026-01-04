import React from 'react';
import Icons from '../../ui/Icons';

const PlanCard = ({ subscription, onUpgrade, isLoading, onCancel }) => {
    // 1. Loading State
    if (isLoading) {
        return (
            <div className="bg-[#002147] rounded-lg p-6 h-[300px] animate-pulse relative overflow-hidden">
                <div className="h-6 w-24 bg-blue-400/20 rounded mb-4"></div>
                <div className="h-10 w-48 bg-blue-400/20 rounded mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 w-full bg-blue-400/10 rounded"></div>
                    <div className="h-4 w-3/4 bg-blue-400/10 rounded"></div>
                </div>
            </div>
        );
    }

    // 2. Data Derivation (Strict Backend Contract)
    const planId = subscription?.plan_id || 'free';
    const isPro = planId.includes('pro'); // e.g. 'pro_monthly'
    const status = subscription?.status || 'inactive';

    // Status Badge Logic
    const getStatusColor = (s) => {
        switch (s) {
            case 'active': return 'emerald';
            case 'past_due': return 'amber';
            case 'canceled': return 'slate';
            case 'trialing': return 'blue';
            case 'incomplete': return 'amber'; // Payment failed/incomplete
            default: return 'slate';
        }
    };
    const statusColor = getStatusColor(status);

    // Renewal Date Logic
    const renewalDate = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : null;

    // Price Logic (Strictly from backend subscription or fallback map if waiting)
    // In a real generic app, we'd fetch Plans[] to get price. 
    // Here we map known IDs to display text, BUT only if sub exists.
    const priceDisplay = isPro ? '₱2,500' : '₱0';
    const intervalDisplay = '/mo'; // Could be dynamic based on plan_id

    return (
        <div className="bg-[#002147] text-white rounded-lg p-6 relative overflow-hidden shadow-lg transition-all animate-fade-in border border-blue-900/50">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                    {/* Header & Status */}
                    <div className="flex items-center gap-3 mb-3">
                        <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Current Plan</p>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-${statusColor}-500/20 text-${statusColor}-300 border-${statusColor}-500/30`}>
                            {status.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-3xl font-bold mb-3 flex items-center gap-2 tracking-tight">
                        {isPro ? 'Institutional Pro' : 'Audit Basic'}
                        {isPro && <Icons.CheckCircle className="text-emerald-400" size={24} />}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-blue-100/80 mb-6 max-w-lg leading-relaxed">
                        {isPro
                            ? 'Full institutional access with unlimited scans, API integration, and priority compliance support.'
                            : 'Limited individual access. Upgrade to unlock institutional features.'}
                    </p>

                    {/* Feature List (Visual Only - Logic remains static as features don't change dynamically usually) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {[
                            isPro ? 'Unlimited Document Scans' : '5 Scans / Month',
                            isPro ? 'Full API Access' : 'No API Access',
                            'Compliance Reports (PDF)',
                            'Data Encryption'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-blue-50">
                                <Icons.Check size={14} className={isPro ? "text-emerald-400" : "text-slate-500"} />
                                <span className={isPro ? "" : "text-slate-400"}>{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        {!isPro ? (
                            <button
                                onClick={() => onUpgrade('pro_monthly')}
                                className="bg-[#C9A227] hover:bg-[#D4AF37] text-[#002147] px-6 py-2.5 rounded-md text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:translate-y-[-1px] flex items-center gap-2"
                            >
                                <Icons.Zap size={16} /> Upgrade to Pro
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-md text-sm font-bold border border-white/20 transition-all backdrop-blur-sm cursor-not-allowed opacity-70"
                                    title="Self-service management coming soon"
                                >
                                    Manage Plan
                                </button>
                                {status === 'active' && (
                                    <button
                                        onClick={onCancel}
                                        className="text-red-300 hover:text-red-200 text-sm font-medium px-3 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Price & Renewal (Hidden on Mobile) */}
                <div className="text-right hidden md:block min-w-[120px]">
                    <p className="text-3xl font-bold text-white mb-1">
                        {priceDisplay}
                        <span className="text-base font-normal text-blue-300">{intervalDisplay}</span>
                    </p>
                    {status === 'active' && renewalDate ? (
                        <p className="text-xs text-blue-300">
                            Renews {renewalDate}
                        </p>
                    ) : (
                        <p className="text-xs text-slate-400 italic">
                            {status === 'canceled' ? 'Expires soon' : 'No upcoming charges'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlanCard;
