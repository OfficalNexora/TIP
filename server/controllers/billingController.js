// const { supabase } = require('../services/supabaseClient'); // Removed to enforce usage of req.supabase
const paymentService = require('../services/paymentService');

const BillingController = {
    /**
     * Get Subscription Data
     */
    getSubscription: async (req, res) => {
        try {
            const { data: user, error } = await req.supabase
                .from('users')
                .select('subscription_status, subscription_metadata')
                .eq('id', req.user.id)
                .single();

            if (error || !user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            res.json({
                status: user.subscription_status || 'free',
                metadata: user.subscription_metadata || {},
                providers: {
                    gcash: { number: paymentService.gcashDetails.number, name: paymentService.gcashDetails.name },
                    paypal: { email: paymentService.paypalDetails.email }
                }
            });
        } catch (error) {
            console.error('[Billing] Fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch billing status.' });
        }
    },

    /**
     * Request Upgrade (Initiate GCash/PayPal Flow)
     */
    upgradePlan: async (req, res) => {
        try {
            const { provider } = req.body; // 'gcash' | 'paypal'
            const userId = req.user.id;

            if (!['gcash', 'paypal'].includes(provider)) {
                return res.status(400).json({ error: 'Invalid payment provider. Choose gcash or paypal.' });
            }

            let redirectUrl;
            if (provider === 'gcash') {
                redirectUrl = await paymentService.getGcashPaymentFlow(req.user);
            } else {
                redirectUrl = await paymentService.getPaypalPaymentFlow(req.user);
            }

            // Log attempt
            await req.supabase.from('security_audit_logs').insert({
                user_id: userId,
                event_type: 'SUBSCRIPTION_INITIATED',
                status: 'PENDING',
                metadata: { provider }
            });

            res.json({
                message: 'Payment initialized.',
                redirectUrl: redirectUrl
            });

        } catch (error) {
            console.error('[Billing] Upgrade failed:', error);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * Confirm Payment (Success Callback)
     * This is the "Automatic Notify" endpoint called once a payment is successful.
     */
    confirmPayment: async (req, res) => {
        try {
            const { userId, provider, amount, token } = req.body;

            if (!userId || !provider) {
                return res.status(400).json({ error: 'Missing payment confirmation data.' });
            }

            console.log(`[Billing] Received Success Signal for ${userId} via ${provider}`);

            await paymentService.handleSuccessfulPayment(userId, provider, { amount, token });

            res.json({ success: true, message: 'Plan upgraded to PRO.' });

        } catch (error) {
            console.error('[Billing] Confirmation failed:', error);
            res.status(500).json({ error: 'Failed to confirm payment.' });
        }
    },

    /**
     * Managed Payment Methods (Not applicable for Direct GCash/PayPal)
     */
    getPaymentMethods: async (req, res) => {
        res.json({ methods: [] });
    },

    /**
     * Invoices/Activity
     */
    getInvoices: async (req, res) => {
        try {
            const { data, error } = await req.supabase
                .from('security_audit_logs')
                .select('*')
                .eq('user_id', req.user.id)
                .in('event_type', ['SUBSCRIPTION_INITIATED', 'SUBSCRIPTION_UPGRADED'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data || []);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch billing history' });
        }
    }
};

module.exports = BillingController;
