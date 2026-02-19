import React from 'react';
import { createPortal } from 'react-dom';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useUI, useActions } from '../../contexts/DashboardContext';

const SubscriptionModal = () => {
    const { isSubscriptionOpen: isOpen } = useUI();
    const { setSubscriptionOpen } = useActions();

    const onClose = () => setSubscriptionOpen(false);
    const onUpgrade = () => alert("Contact Sales for Institutional Access.");
    const currentPlan = "Audit Basic";
    const [isUpgrading, setIsUpgrading] = React.useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async (plan) => {
        setIsUpgrading(true);
        try {
            await onUpgrade(plan);
            onClose();
        } catch (error) {
            console.error('Upgrade failed:', error);
        } finally {
            setIsUpgrading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-all duration-500"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative glass-panel border-white/10 shadow-premium w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all z-20 border-white/5"
                >
                    <Icons.X size={18} />
                </button>

                {/* Left Side: Institutional Context */}
                <div className="p-12 md:w-5/12 flex flex-col justify-between relative overflow-hidden bg-indigo-500/5">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 space-y-8">
                        <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center text-indigo-400 border-white/10">
                            <Icons.Shield size={28} />
                        </div>

                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter leading-tight">
                                Institutional <br />Capabilities
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 leading-relaxed">
                                Enable high-throughput analysis and programmatic interoperability.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            {[
                                "Unlimited document analysis",
                                "API Authentication nodes",
                                "Custom forensic parameters",
                                "Priority verification support",
                                "Multi-user role orchestration"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 glass-panel rounded-full flex items-center justify-center text-indigo-400 border-white/10">
                                        <Icons.Check size={10} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 pt-10">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Grade V2.4</div>
                    </div>
                </div>

                {/* Right Side: Plan Selection */}
                <div className="p-12 md:w-7/12 flex flex-col justify-center">
                    <div className="mb-10">
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Access Control</h3>
                        <h2 className="text-xl font-black text-white tracking-tight">Select Protocol Tier</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Free Tier */}
                        <div className={`glass-panel p-6 flex items-center justify-between transition-all border-white/5 ${currentPlan === 'Audit Basic' ? 'bg-white/5 border-indigo-500/30' : 'opacity-40'}`}>
                            <div>
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Audit Basic</h4>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Individual node • 5 Scans/mo</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-white font-black text-lg tracking-tighter">$0.00</span>
                                {currentPlan === 'Audit Basic' && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active State</span>}
                            </div>
                        </div>

                        {/* Pro Tier */}
                        <div className={`glass-panel p-8 relative transition-all border-white/10 bg-indigo-500/5 group hover:border-indigo-500/40`}>
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-500 rounded-lg text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                                Recommended
                            </div>

                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h4 className="text-lg font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors uppercase">
                                        Institutional
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed max-w-[240px]">
                                        Unlimited forensic throughput and direct API uplink.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-white font-black text-xl tracking-tighter">Enterprise</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleUpgrade('Enterprise')}
                                disabled={isUpgrading}
                                className="w-full py-4 glass-panel bg-indigo-600 hover:bg-indigo-500 border-white/10 text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-premium active:scale-[0.98] disabled:opacity-50"
                            >
                                {isUpgrading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Initialize Upgrade <Icons.ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SubscriptionModal;

