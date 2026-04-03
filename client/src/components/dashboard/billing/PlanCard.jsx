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
    const isPro = planId.includes('enterprise');
    const isPlus = planId === 'enterprise_plus_monthly' || planId === 'enterprise_plus';
    const status = subscription?.status || 'inactive';

    // Status Badge Logic
    const getStatusColor = (s) => {
        switch (s) {
            case 'active': return 'emerald';
            case 'past_due': return 'amber';
            case 'canceled': return 'slate';
            case 'trialing': return 'blue';
            case 'incomplete': return 'amber';
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

    // Price Logic (Institutional PHP)
    const priceDisplay = isPlus ? '₱4,999' : (isPro ? '₱1,650' : '₱0');
    const intervalDisplay = '/mo';

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
                        {isPlus ? 'Enterprise++' : (isPro ? 'Enterprise' : 'Free')}
                        {isPro && <Icons.CheckCircle className="text-emerald-400" size={24} />}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-blue-100/80 mb-6 max-w-lg leading-relaxed">
                        {isPlus 
                            ? 'Unlimited institutional auditing with deep-tier API access and dedicated forensic support.'
                            : isPro
                                ? 'Full institutional access with up to 150 tokens, API integration, and priority compliance support.'
                                : 'Limited individual access. Upgrade to unlock institutional features.'}
                    </p>

                    {/* Feature List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {[
                            isPlus ? 'Unlimited Analysis Tokens' : (isPro ? '150 Analysis Tokens' : '3 Tokens / Month'),
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
                    <div className="flex flex-col gap-4">
                        {!isPro ? (
                            <div className="flex flex-col md:flex-row gap-3">
                                <button
                                    onClick={() => onUpgrade('enterprise_monthly')}
                                    className="bg-[#C9A227] hover:bg-[#D4AF37] text-[#002147] flex-1 py-3 rounded-md text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:translate-y-[-1px] flex items-center justify-center gap-2"
                                >
                                    <Icons.Zap size={16} /> Upgrade to Enterprise (₱1,650)
                                </button>
                                <button
                                    onClick={() => onUpgrade('enterprise_plus_monthly')}
                                    className="bg-blue-600 hover:bg-blue-500 text-white flex-1 py-3 rounded-md text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:translate-y-[-1px] flex items-center justify-center gap-2"
                                >
                                    <Icons.ShieldCheck size={16} /> Enterprise++ (₱4,999)
                                </button>
                            </div>
                        ) : isPlus ? (
                            <div className="flex flex-col gap-2">
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 w-fit">
                                    <Icons.CheckCircle size={16} /> Active Enterprise++ Plan
                                </span>
                                <button onClick={onCancel} className="text-blue-300 hover:text-white text-xs underline underline-offset-4 transition-colors w-fit">
                                    Manage Subscription
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => onUpgrade('enterprise_plus_monthly')}
                                    className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-md text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Icons.ArrowUpCircle size={16} /> Upgrade to Enterprise++ (Unlimited)
                                </button>
                                <button onClick={onCancel} className="text-blue-300 hover:text-white text-xs underline underline-offset-4 transition-colors w-fit">
                                    Manage Subscription
                                </button>
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
