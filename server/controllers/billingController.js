const { supabase } = require('../services/supabaseClient');
const paymentService = require('../services/paymentService');

const BillingController = {
    // GET /api/billing/subscription
    getSubscription: async (req, res) => {
        try {
            // Fetch from local DB first
            const { data: sub, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', req.user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            // Return active sub or free placeholder
            if (!sub) {
                return res.json({
                    plan_id: 'free',
                    status: 'active',
                    current_period_end: null
                });
            }

            res.json(sub);
        } catch (error) {
            console.error('Get subscription failed:', error);
            res.status(500).json({ error: 'Failed to fetch subscription' });
        }
    },

    // POST /api/billing/subscription/upgrade
    upgradePlan: async (req, res) => {
        try {
            const { planId } = req.body;
            console.log(`[Billing] Upgrade requested to ${planId}. Note: Stripe is disabled. Manual verification required.`);

            // For now, redirect users to manual payment flow
            res.status(400).json({
                error: 'Automated billing is currently disabled.',
                message: 'Please use the GCash or PayPal options in the billing portal for manual verification.'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/billing/manual-payment
    submitManualPayment: async (req, res) => {
        try {
            const { method, referenceNumber } = req.body;
            const userId = req.user.id;

            console.log(`[ManualPayment] User ${userId} submitted ${method} ref: ${referenceNumber}`);

            const { error } = await supabase.from('manual_payments').insert({
                user_id: userId,
                method,
                reference_number: referenceNumber,
                status: 'PENDING'
            });

            if (error) throw error;

            res.json({ message: 'Payment submitted for manual verification' });
        } catch (error) {
            console.error('Manual payment submission failed:', error);
            res.status(500).json({ error: 'Failed to submit payment' });
        }
    },

    // GET /api/billing/payment-methods
    getPaymentMethods: async (req, res) => {
        try {
            // Return empty list or manual methods if tracked
            res.json([]);
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    },

    // POST /api/billing/payment-methods
    addPaymentMethod: async (req, res) => {
        res.status(400).json({ error: 'Automated card linking is disabled. Please use manual payments.' });
    },

    // Setup Intent (for adding cards) - STUBBED
    createSetupIntent: async (req, res) => {
        res.status(400).json({ error: 'Stripe functionality is disabled.' });
    }
};

module.exports = BillingController;
