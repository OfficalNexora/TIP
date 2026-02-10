import React, { useState } from 'react';
import Icons from '../../ui/Icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';

const AddPaymentModal = ({ isOpen, onClose, onSuccess }) => {
    const { session } = useAuth();
    const notify = useNotification();
    const [step, setStep] = useState('SELECT'); // 'SELECT' | 'GCASH' | 'PAYPAL'
    const [referenceNumber, setReferenceNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) {
            setStep('SELECT');
            setReferenceNumber('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmitManual = async (method) => {
        if (!referenceNumber) {
            notify.error('Required', 'Please enter your payment reference number.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSuccess(method, referenceNumber);
        } catch (err) {
            console.error('Failed to submit manual payment:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {step !== 'SELECT' && <Icons.ArrowLeft className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setStep('SELECT')} />}
                        {step === 'SELECT' ? 'Add Payment Method' : step === 'GCASH' ? 'Pay via GCash' : 'Pay via PayPal'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {step === 'SELECT' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400 mb-6">Choose a secure payment method for institutional access.</p>

                            <button onClick={() => setStep('PAYPAL')} className="w-full flex items-center justify-between p-5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#003087]/50 hover:bg-slate-800/80 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#003087]/10 flex items-center justify-center border border-[#003087]/20 group-hover:border-[#009cde]/50 transition-colors">
                                        <Icons.PayPal className="text-[#003087] group-hover:text-[#009cde]" size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-base">PayPal</p>
                                        <p className="text-xs text-slate-500">Secure global payments</p>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" size={20} />
                            </button>

                            <button onClick={() => setStep('GCASH')} className="w-full flex items-center justify-between p-5 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/80 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors primary-box-shadow">
                                        <Icons.GCash className="text-blue-400" size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-base">GCash</p>
                                        <p className="text-xs text-slate-500">Philippines #1 E-Wallet</p>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" size={20} />
                            </button>
                        </div>
                    ) : step === 'GCASH' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-6 text-center">
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Scan QR or Pay to Number</p>
                                <div className="w-48 h-48 bg-white p-2 rounded-lg mx-auto mb-4 shadow-xl">
                                    {/* Placeholder for QR Code */}
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold text-center border-2 border-dashed border-slate-300">
                                        [ GCASH QR CODE ASSET ]
                                    </div>
                                </div>
                                <p className="text-lg font-mono font-bold text-white tracking-widest leading-none">09XX XXX XXXX</p>
                                <p className="text-[10px] text-slate-500 mt-2">UNESCO AI MIRROR OFFICIAL</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Step 2: Enter Reference Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter GCash Ref #"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            <button
                                onClick={() => handleSubmitManual('GCASH')}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify Payment'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                            <div className="bg-[#003087]/5 border border-[#003087]/20 rounded-xl p-8">
                                <Icons.PayPal size={48} className="text-[#003087] mx-auto mb-4" />
                                <h4 className="text-white font-bold mb-2">PayPal Checkout</h4>
                                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                    Click below to pay via PayPal. After payment, please paste the **Transaction ID** below for institutional verification.
                                </p>
                                <a
                                    href="https://paypal.me/yourlink"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block px-8 py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-full font-bold transition-all shadow-md"
                                >
                                    Pay with PayPal
                                </a>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-slate-400 uppercase">Transaction ID</label>
                                <input
                                    type="text"
                                    placeholder="Enter PayPal Trans ID"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            <button
                                onClick={() => handleSubmitManual('PAYPAL')}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-slate-100 hover:bg-white text-slate-900 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : 'Submit Transaction ID'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/50 p-4 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5 leading-none">
                        <Icons.Shield size={10} className="text-blue-500/50" />
                        Manual verification typically takes 12-24 hours for institutional access.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddPaymentModal;
