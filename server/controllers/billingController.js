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
            const { planId, paymentMethodId } = req.body; // e.g., 'pro_monthly'
            const userId = req.user.id;
            const userEmail = req.user.email;

            console.log(`[Billing] Upgrading user ${userId} to ${planId}`);

            // 1. Get or create Stripe customer
            let stripeCustomerId;

            // Check if user already has a stripe_customer_id stored
            const { data: userData, error: userFetchError } = await supabase
                .from('users')
                .select('stripe_customer_id, full_name')
                .eq('id', userId)
                .single();

            if (userFetchError) throw userFetchError;

            if (userData?.stripe_customer_id) {
                // Use existing customer
                stripeCustomerId = userData.stripe_customer_id;
                console.log(`[Billing] Using existing Stripe customer: ${stripeCustomerId}`);
            } else {
                // Create new customer in Stripe
                console.log(`[Billing] Creating new Stripe customer for ${userEmail}`);
                const customer = await paymentService.createCustomer({
                    id: userId,
                    email: userEmail,
                    full_name: userData?.full_name || userEmail
                });
                stripeCustomerId = customer.id;

                // Store customer ID in our database
                await supabase
                    .from('users')
                    .update({ stripe_customer_id: stripeCustomerId })
                    .eq('id', userId);

                console.log(`[Billing] Created Stripe customer: ${stripeCustomerId}`);
            }

            // 2. Create subscription via Payment Service
            console.log('[Billing] Calling paymentService.createSubscription...');
            const subscription = await paymentService.createSubscription(stripeCustomerId, planId);
            console.log('[Billing] Payment service returned:', subscription);

            // 3. Update Local DB (Transactional ideally)
            // Upsert subscription
            console.log('[Billing] Upserting subscription to DB...');
            const { data, error } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan_id: planId,
                    status: subscription.status,
                    payment_provider_id: subscription.id,
                    current_period_end: subscription.current_period_end,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' }) // One sub per user rule
                .select()
                .single();

            if (error) {
                console.error('[Billing] DB upsert error:', error);
                throw error;
            }

            // 4. Update legacy user.subscription_status for backward compatibility
            await supabase.from('users').update({ subscription_status: 'Pro' }).eq('id', userId);

            // 5. Audit Log
            await supabase.from('billing_audit_logs').insert({
                user_id: userId,
                action: 'SUBSCRIPTION_UPGRADED',
                details: { plan: planId, sub_id: subscription.id }
            });

            console.log('[Billing] Upgrade successful');
            res.json(data);

        } catch (error) {
            console.error('[Billing] Upgrade failed:', error.message);
            console.error('[Billing] Full error:', error);
            res.status(500).json({ error: error.message || 'Upgrade failed' });
        }
    },

    // GET /api/billing/payment-methods
    getPaymentMethods: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', req.user.id)
                .order('is_default', { ascending: false });

            if (error) throw error;
            res.json(data || []);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch payment methods' });
        }
    },

    // POST /api/billing/payment-methods
    addPaymentMethod: async (req, res) => {
        try {
            const { type, details } = req.body; // type: 'card'|'gcash', details: { paymentMethodId }
            const userId = req.user.id;

            // 0. Get Stripe Customer ID
            const { data: userData } = await supabase
                .from('users')
                .select('stripe_customer_id')
                .eq('id', userId)
                .single();

            const stripeCustomerId = userData?.stripe_customer_id;
            if (!stripeCustomerId) throw new Error('No billing profile found.');

            // 1. Verify/Attach with Provider (if 'details' contains paymentMethodId from frontend)
            // If details.paymentMethodId is present, we attach it.
            let providerMethod;
            if (details?.paymentMethodId) {
                providerMethod = await paymentService.attachPaymentMethod(stripeCustomerId, details);
            } else {
                // Fallback or other logic? e.g. GCash redirect initiation
                // For now, if no ID, we error or handle specific types
                if (type === 'card') throw new Error('Missing payment method ID');
                providerMethod = { type, id: 'pending_source', card: {} };
            }

            // 2. Save to DB
            const { data, error } = await supabase
                .from('payment_methods')
                .insert({
                    user_id: userId,
                    type: providerMethod.type,
                    last4: providerMethod.type === 'card' ? providerMethod.card.last4 : 'GCash',
                    brand: providerMethod.type === 'card' ? providerMethod.card.brand : 'GCash',
                    provider_token: providerMethod.id,
                    exp_month: providerMethod.type === 'card' ? providerMethod.card.exp_month : null,
                    exp_year: providerMethod.type === 'card' ? providerMethod.card.exp_year : null,
                    is_default: true // Logic to check if others exist? 
                })
                .select()
                .single();

            if (error) throw error;
            res.json(data);

        } catch (error) {
            console.error('Add PM failed:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // DELETE /api/billing/payment-methods/:id
    removePaymentMethod: async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id)
                .eq('user_id', req.user.id);

            if (error) throw error;
            res.json({ message: 'Payment method removed' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to remove payment method' });
        }
    },

    // GET /api/billing/invoices
    getInvoices: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', req.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data || []);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch invoices' });
        }
    },
    // POST /api/billing/setup-intent
    createSetupIntent: async (req, res) => {
        try {
            const userId = req.user.id;
            const userEmail = req.user.email;

            // 1. Get or create Stripe Customer (Reuse logic or refactor)
            let stripeCustomerId;
            const { data: userData } = await supabase
                .from('users')
                .select('stripe_customer_id, full_name')
                .eq('id', userId)
                .single();

            if (userData?.stripe_customer_id) {
                stripeCustomerId = userData.stripe_customer_id;
            } else {
                const customer = await paymentService.createCustomer({
                    id: userId,
                    email: userEmail,
                    full_name: userData?.full_name || userEmail
                });
                stripeCustomerId = customer.id;
                await supabase.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('id', userId);
            }

            // 2. Create SetupIntent
            const setupIntent = await paymentService.createSetupIntent(stripeCustomerId);
            res.json(setupIntent);

        } catch (error) {
            console.error('[Billing] SetupIntent failed:', error);
            res.status(500).json({ error: 'Failed to initiate card setup' });
        }
    }
};

module.exports = BillingController;
