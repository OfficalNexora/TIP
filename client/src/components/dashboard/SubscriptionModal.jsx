import React from 'react';
import { createPortal } from 'react-dom';
import Icons from '../ui/Icons';
import InsightCard from '../ui/InsightCard';
import { useUI, useActions } from '../../contexts/DashboardContext';
import { useTranslation } from '../../utils/useTranslation';

const SubscriptionModal = () => {
    const { isSubscriptionOpen: isOpen } = useUI();
    const { setSubscriptionOpen } = useActions();
    const { t } = useTranslation();

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[#000812] border border-blue-900/40 rounded-3xl shadow-[0_0_100px_rgba(0,33,71,0.5)] w-full max-w-6xl overflow-hidden animate-fade-in flex flex-col font-sans transition-colors duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 rounded-full transition-all z-20"
                >
                    <Icons.X size={20} />
                </button>

                <div className="p-8 md:p-14">
                    {/* Header */}
                    <div className="text-center mb-14">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#002147] to-[#00142D] flex items-center justify-center ring-1 ring-blue-500/20 shadow-lg transform rotate-3">
                                <Icons.Shield size={32} className="text-[#C9A227] transform -rotate-3" />
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            {t('upgrade.title')}
                        </h2>
                        <p className="text-blue-200/60 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
                            {t('upgrade.subtitle')}
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        
                        {/* Audit Basic - Free Tier */}
                        <div className="bg-[#001124] border border-blue-900/40 rounded-3xl p-8 flex flex-col relative transition-all hover:border-blue-700/40 hover:bg-[#00152b]">
                            <div className="mb-6">
                                <h3 className="text-slate-300 text-xl font-bold mb-3 tracking-wide">{t('upgrade.basic.title')}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">₱0</span>
                                    <span className="text-slate-500 text-sm font-bold">{t('upgrade.perMo')}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-3 font-medium">{t('upgrade.basic.desc')}</p>
                            </div>
                            
                            <div className="flex-1 space-y-4 mt-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-slate-300" /></div>
                                    <span className="text-sm text-slate-300 font-medium">{t('upgrade.basic.f1')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-slate-300" /></div>
                                    <span className="text-sm text-slate-300 font-medium">{t('upgrade.basic.f2')}</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-40">
                                    <div className="min-w-5 flex justify-center"><Icons.X size={18} className="text-slate-500" /></div>
                                    <span className="text-sm text-slate-400 font-medium">{t('upgrade.basic.f3')}</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-40">
                                    <div className="min-w-5 flex justify-center"><Icons.X size={18} className="text-slate-500" /></div>
                                    <span className="text-sm text-slate-400 font-medium">{t('upgrade.basic.f4')}</span>
                                </div>
                            </div>

                            <button className="w-full py-4 rounded-2xl bg-slate-800/50 text-slate-400 font-bold text-sm cursor-not-allowed border border-slate-700/50">
                                {t('upgrade.currentPlan')}
                            </button>
                        </div>

                        {/* Enterprise - Most Popular Tier */}
                        <div className="bg-gradient-to-b from-[#1a1400] to-[#00162d] border border-[#C9A227] rounded-3xl p-8 flex flex-col relative transform md:-translate-y-6 shadow-[0_0_50px_rgba(201,162,39,0.15)] ring-2 ring-[#C9A227]/20 transition-all hover:shadow-[0_0_60px_rgba(201,162,39,0.25)] hover:-translate-y-8 duration-300 z-10">
                            
                            {/* Glow behind the badge */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-8 bg-amber-500/40 blur-xl rounded-full"></div>
                            
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 via-[#C9A227] to-amber-500 text-[#000812] px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(201,162,39,0.5)] whitespace-nowrap">
                                {t('upgrade.mostPopular')}
                            </div>
                            
                            <div className="mb-6 mt-4">
                                <h3 className="text-[#C9A227] text-xl font-bold mb-3 tracking-wide">{t('upgrade.ent.title')}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">₱1,650</span>
                                    <span className="text-amber-500/60 text-sm font-bold">{t('upgrade.perMo')}</span>
                                </div>
                                <p className="text-xs text-amber-200/60 mt-3 font-medium">{t('upgrade.ent.desc')}</p>
                            </div>
                            
                            <div className="flex-1 space-y-4 mt-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-[#C9A227]" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.ent.f1')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-[#C9A227]" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.ent.f2')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-[#C9A227]" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.ent.f3')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-[#C9A227]" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.ent.f4')}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleUpgrade('Enterprise')}
                                disabled={isUpgrading}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-[#C9A227] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#000812] font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(201,162,39,0.3)] disabled:opacity-50 transition-all hover:scale-[1.03] active:scale-[0.98] uppercase tracking-wider"
                            >
                                {isUpgrading ? (
                                    <div className="w-5 h-5 border-2 border-[#000812] border-t-transparent rounded-full animate-spin"></div>
                                ) : t('upgrade.ent.btn')}
                            </button>
                        </div>

                        {/* Enterprise++ - Best Value Tier */}
                        <div className="bg-gradient-to-b from-[#001736] to-[#001124] border border-blue-500/40 rounded-3xl p-8 flex flex-col relative shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all hover:border-blue-400/60 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden">
                            
                            {/* Inner ambient glow */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-b-lg text-[9px] font-black uppercase tracking-widest shadow-lg border-x border-b border-blue-400/30">
                                {t('upgrade.bestValue')}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-blue-400 text-xl font-bold mb-3 tracking-wide flex items-center gap-1">
                                    {t('upgrade.entplus.title')}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">₱4,999</span>
                                    <span className="text-blue-400/60 text-sm font-bold">{t('upgrade.perMo')}</span>
                                </div>
                                <p className="text-xs text-blue-200/60 mt-3 font-medium">{t('upgrade.entplus.desc')}</p>
                            </div>
                            
                            <div className="flex-1 space-y-4 mt-4 mb-10 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-blue-400" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.entplus.f1')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-blue-400" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.entplus.f2')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-blue-400" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.entplus.f3')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="min-w-5 flex justify-center"><Icons.CheckCircle size={18} className="text-blue-400" /></div>
                                    <span className="text-sm text-slate-100 font-medium">{t('upgrade.entplus.f4')}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => handleUpgrade('EnterprisePlus')}
                                disabled={isUpgrading}
                                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,99,235,0.2)] disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider relative z-10"
                            >
                                {isUpgrading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : t('upgrade.entplus.btn')}
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
