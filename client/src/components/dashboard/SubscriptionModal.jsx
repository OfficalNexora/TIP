import React from 'react';
import { createPortal } from 'react-dom';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';

const SubscriptionModal = ({ isOpen, onClose, currentPlan = "Audit Basic", onUpgrade }) => {
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col md:flex-row font-sans transition-colors duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all z-20"
                >
                    <Icons.X size={20} />
                </button>

                {/* Left Side: Institutional Context */}
                <div className="bg-[#002147] text-white p-10 md:w-5/12 flex flex-col justify-between relative">
                    <div className="relative z-10">
                        <div className="mb-8 opacity-80">
                            <Icons.Shield size={32} className="text-blue-200" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 tracking-tight drop-shadow-sm" style={{ color: '#C9A227' }}>
                            Institutional Access & <br />Advanced Capabilities
                        </h3>
                        <p className="text-sm text-blue-200/80 leading-7 mb-8 font-light">
                            Enable extended analysis capacity, API interoperability, and priority audit support for regulatory workflows.
                        </p>
                        <div className="space-y-4">
                            {[
                                "Extended document analysis capacity",
                                "Programmatic access via secure API",
                                "Customizable compliance frameworks",
                                "Priority audit review support",
                                "Team roles and access control"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="mt-0.5 opacity-60">
                                        <Icons.CheckCircle size={16} className="text-blue-200" />
                                    </div>
                                    <span className="text-sm font-light text-blue-100/90">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Plan Selection */}
                <div className="p-10 md:w-7/12 bg-white dark:bg-tip-surface flex flex-col justify-center transition-colors">
                    <div className="mb-8 font-sans">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-tip-text-main transition-colors">Select Subscription Plan</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-light transition-colors">Transparent pricing for compliance capabilities.</p>
                    </div>

                    <div className="space-y-4">
                        {/* Free Tier */}
                        <div className={`border rounded-lg p-5 flex items-center justify-between transition-colors ${currentPlan === 'Audit Basic' ? 'bg-emerald-50/20 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                            <div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm transition-colors uppercase tracking-widest">Audit Basic</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Individual research use • 5 Scans/mo</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-slate-900 dark:text-tip-text-main font-bold text-sm transition-colors">$0/mo</span>
                                {currentPlan === 'Audit Basic' && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider transition-colors">Active Plan</span>}
                            </div>
                        </div>

                        {/* Pro Tier */}
                        <div className={`border rounded-lg p-6 relative transition-all ${currentPlan === 'Enterprise' ? 'border-emerald-500/30 bg-emerald-50/10 ring-1 ring-emerald-500/20' : 'border-[#002147]/20 dark:border-blue-900/40 bg-white dark:bg-slate-900/50 hover:border-blue-500 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-[#002147] dark:text-blue-400 text-lg flex items-center gap-2 transition-colors uppercase tracking-tight">
                                        Institutional Enterprise
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs transition-colors font-medium">
                                        Unlimited scans, PDF export, team orchestration, and direct institutional API link.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#002147] dark:text-blue-400 font-bold text-lg transition-colors">Contact Sales</span>
                                </div>
                            </div>

                            {currentPlan !== 'Enterprise' ? (
                                <button
                                    onClick={() => handleUpgrade('Enterprise')}
                                    disabled={isUpgrading}
                                    className="w-full py-3 rounded-md bg-[#002147] dark:bg-blue-600 text-white font-bold text-sm hover:translate-y-[-1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    {isUpgrading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>Upgrade Institutional Plan <Icons.ArrowRight size={16} /></>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full py-3 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500/20">
                                    <Icons.CheckCircle size={16} /> Current Active Plan
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>,
        document.body
    );
};

export default SubscriptionModal;
