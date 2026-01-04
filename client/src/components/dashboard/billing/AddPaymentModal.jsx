import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import Icons from '../../ui/Icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';

// Initialize Stripe (Publishable Key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SetupForm = ({ onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // Confirm the SetupIntent
            // valid return_url is required by Stripe, even if we don't redirect (will handle partials)
            const result = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/settings?setup_success=true',
                },
                redirect: 'if_required'
            });

            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
            } else {
                // Success!
                // The SetupIntent is 'succeeded'.
                // We typically need to tell our backend properly attach it if needed, 
                // but confirmSetup usually attaches it to Customer if 'customer' was set on intent creation.
                // Our backend attachPaymentMethod logic might be redundant if we use SetupIntent flow directly,
                // BUT current backend endpoint saves to DB. So we still need to sync.

                // Let's create the payment method record in our DB manually or rely on webhook.
                // For immediate UI update, we can call our 'addPaymentMethod' endpoint with the PaymentMethod ID.

                const pmId = result.setupIntent.payment_method;
                onSuccess(pmId);
            }
        } catch (err) {
            setError(err.message);
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    theme: 'night',
                    variables: {
                        colorPrimary: '#3b82f6',
                        colorBackground: '#1e293b',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        borderRadius: '8px',
                    },
                }}
            />

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-200 text-sm flex items-center gap-2">
                    <Icons.AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {processing ? (
                        <>
                            <Icons.Loader className="animate-spin" size={16} /> Saving...
                        </>
                    ) : (
                        'Save Card'
                    )}
                </button>
            </div>
        </form>
    );
};

const AddPaymentModal = ({ isOpen, onClose, onSuccess }) => {
    const { session } = useAuth();
    const notify = useNotification();
    const [step, setStep] = useState('SELECT'); // 'SELECT' | 'CARD_FORM'
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [loading, setLoading] = useState(false);

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) {
            setStep('SELECT');
            setSelectedMethod(null);
            setClientSecret(null);
            setLoading(false);
        }
    }, [isOpen]);

    // Fetch SetupIntent ONLY when Card is selected
    const handleMethodSelect = async (method) => {
        setSelectedMethod(method);

        if (method === 'card') {
            setStep('CARD_FORM');
            if (session) {
                try {
                    setLoading(true);
                    const token = session.access_token;
                    const res = await axios.post('/api/billing/setup-intent', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setClientSecret(res.data.client_secret);
                } catch (err) {
                    console.error('Failed to init setup intent:', err);
                    alert('Could not initialize payment form. Please try again.');
                    onClose();
                } finally {
                    setLoading(false);
                }
            }
        } else {
            // Placeholder for GCash / PayPal redirects
            notify.info(
                'Coming Soon',
                `${method === 'paypal' ? 'PayPal' : 'GCash'} integration is currently under development. Please use Card for now.`
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {step === 'SELECT' ? <Icons.CreditCard className="text-blue-400" /> : <Icons.ArrowLeft className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setStep('SELECT')} />}
                        {step === 'SELECT' ? 'Add Payment Method' : 'Add Secure Card'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {step === 'SELECT' ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400 mb-4">Choose a secure payment method to save to your account.</p>

                            <button onClick={() => handleMethodSelect('card')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                        <Icons.CreditCard className="text-blue-400" size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">Credit / Debit Card</p>
                                        <p className="text-[10px] text-slate-500">Fast, secure checkout</p>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" size={16} />
                            </button>

                            <button onClick={() => handleMethodSelect('paypal')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center border border-[#003087]/20 group-hover:border-[#009cde]/50 transition-colors">
                                        <Icons.PayPal className="text-[#003087] group-hover:text-[#009cde]" size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">PayPal</p>
                                        <p className="text-[10px] text-slate-500">Safe, easy payments</p>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" size={16} />
                            </button>

                            <button onClick={() => handleMethodSelect('gcash')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                                        <Icons.GCash className="text-blue-400" size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white text-sm">GCash</p>
                                        <p className="text-[10px] text-slate-500">Pay via e-wallet</p>
                                    </div>
                                </div>
                                <Icons.ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" size={16} />
                            </button>
                        </div>
                    ) : (
                        // FORM STEP
                        <>
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-xs text-blue-200">
                                <Icons.Info size={16} className="shrink-0 text-blue-400" />
                                <div>
                                    <p className="font-bold text-blue-400 mb-1">Test Mode Active</p>
                                    <p>Use this Stripe test card to verify the flow:</p>
                                    <div className="mt-2 flex items-center justify-between bg-slate-900/50 p-2 rounded border border-blue-500/10 font-mono text-blue-300">
                                        <span>4242 4242 4242 4242</span>
                                        <span className="text-slate-500">Any Date / CVC</span>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Icons.Loader className="animate-spin text-blue-500" size={32} />
                                    <p className="text-slate-400 text-sm">Initializing secure connection...</p>
                                </div>
                            ) : clientSecret ? (
                                <Elements stripe={stripePromise} options={{
                                    clientSecret,
                                    appearance: {
                                        theme: 'night',
                                        variables: {
                                            colorPrimary: '#3b82f6',
                                            colorBackground: '#0f172a',
                                            colorText: '#ffffff',
                                            colorDanger: '#ef4444',
                                            fontFamily: 'Inter, system-ui, sans-serif',
                                        }
                                    }
                                }}>
                                    <SetupForm
                                        onSuccess={onSuccess}
                                        onCancel={onClose}
                                    />
                                </Elements>
                            ) : (
                                <p className="text-red-400 text-center">Failed to load payment form.</p>
                            )}
                        </>
                    )}
                </div>

                <div className="bg-slate-900/50 p-4 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                        <Icons.Lock size={10} />
                        Payments processed securely by Stripe. No card data hits our servers.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddPaymentModal;
