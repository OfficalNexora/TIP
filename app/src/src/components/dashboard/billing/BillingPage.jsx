import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import PlanCard from './PlanCard';
import PaymentMethods from './PaymentMethods';
import BillingHistory from './BillingHistory';

import AddPaymentModal from './AddPaymentModal';

const BillingPage = () => {
    const { session, loading: authLoading } = useAuth();
    const user = session?.user;

    // STRICT STATE MANAGEMENT
    const [subscription, setSubscription] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState(null);
    const [invoices, setInvoices] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Fetch All Billing Data
    useEffect(() => {
        const fetchBillingData = async () => {
            if (authLoading) return; // Wait for auth to initialize

            if (!user) {
                setLoading(false); // No user, stop loading (page will likely redirect via protected route wrapper anyway)
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const token = session.access_token;
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // Parallel Data Fetching
                const [subRes, methodsRes, invoicesRes] = await Promise.allSettled([
                    axios.get('/api/billing/subscription', config),
                    axios.get('/api/billing/payment-methods', config),
                    axios.get('/api/billing/invoices', config)
                ]);

                // Handle Subscription
                if (subRes.status === 'fulfilled') {
                    setSubscription(subRes.value.data);
                } else {
                    console.warn('Failed to fetch subscription:', subRes.reason);
                    setSubscription({});
                }

                // Handle Payment Methods
                if (methodsRes.status === 'fulfilled') {
                    const data = methodsRes.value.data;
                    setPaymentMethods(Array.isArray(data) ? data : []);
                } else {
                    console.warn('Failed to fetch payment methods:', methodsRes.reason);
                    setPaymentMethods([]);
                }

                // Handle Invoices
                if (invoicesRes.status === 'fulfilled') {
                    const data = invoicesRes.value.data;
                    setInvoices(Array.isArray(data) ? data : []);
                } else {
                    console.warn('Failed to fetch invoices:', invoicesRes.reason);
                    setInvoices([]);
                }

            } catch (err) {
                console.error('Critical billing load error:', err);
                setError('Unable to load billing information. Please check your connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchBillingData();
    }, [user, authLoading, session]);

    // Action Handlers
    const handleUpgrade = async (priceId) => {
        // Validation: Must have payment method for paid plans
        if (priceId !== 'free' && (!paymentMethods || paymentMethods.length === 0)) {
            // Open modal instead of failing
            setIsPaymentModalOpen(true);
            return;
        }

        try {
            const token = session?.access_token;
            await axios.post('/api/billing/subscription/create', {
                priceId
            }, { headers: { Authorization: `Bearer ${token}` } });

            window.location.reload();
        } catch (err) {
            alert('Upgrade failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAddPaymentMethod = async (type, details) => {
        if (type === 'card') {
            setIsPaymentModalOpen(true);
        } else if (type === 'gcash') {
            alert('GCash Redirect: This will redirect you to the GCash secure portal. \n\nImplementation pending backend checkout session.');
        }
    };

    const handlePaymentSuccess = async (method, referenceNumber) => {
        try {
            const token = session?.access_token;
            // Persist the manual payment record
            const res = await axios.post('/api/billing/manual-payment', {
                method,
                referenceNumber
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('Payment submitted for manual verification!');
            setIsPaymentModalOpen(false);
        } catch (err) {
            console.error('Failed to submit payment:', err);
            alert('Submission failed.');
        }
    };

    const handleRemovePaymentMethod = async (id) => {
        try {
            const token = session?.access_token;
            await axios.delete(`/api/billing/payment-methods/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
        } catch (err) {
            alert('Failed to remove method: ' + err.message);
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel? This will downgrade you at the end of the billing period.')) return;

        try {
            const token = session?.access_token;
            await axios.post('/api/billing/subscription/cancel', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Subscription canceled. It will remain active until the period ends.');
            window.location.reload();
        } catch (err) {
            alert('Cancellation failed: ' + err.message);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Subscription & Billing</h1>
                <p className="text-blue-200/80">Manage your institutional plan, payment methods, and invoices.</p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    {error}
                </div>
            )}

            <div className="grid gap-8">
                {/* 1. Subscription Status */}
                <PlanCard
                    subscription={subscription}
                    isLoading={loading}
                    onUpgrade={handleUpgrade}
                    onCancel={handleCancelSubscription}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. Payment Methods */}
                    <div className="lg:col-span-2">
                        <PaymentMethods
                            methods={paymentMethods}
                            isLoading={loading}
                            onAdd={handleAddPaymentMethod}
                            onRemove={handleRemovePaymentMethod}
                        />
                    </div>

                    {/* 3. Billing History & Stats */}
                    <div className="lg:col-span-1">
                        <div className="h-full"></div>
                    </div>
                </div>

                {/* 4. Full Invoice History */}
                <BillingHistory
                    invoices={invoices}
                    isLoading={loading}
                />
            </div>

            {/* Secure Payment Modal */}
            <AddPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
};

export default BillingPage;
