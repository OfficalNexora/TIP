/**
 * PaymentService (Production - Stripe)
 * 
 * Interacts with Stripe API for subscription and payment management.
 * 
 * REQUIRED ENV VARS:
 * - STRIPE_SECRET_KEY
 */

const { supabase } = require('./supabaseClient');
const Stripe = require('stripe');

class PaymentService {
    constructor() {
        this.providerName = 'STRIPE';
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!secretKey) {
            console.warn('⚠️ STRIPE_SECRET_KEY is missing. PaymentService will fail on requests.');
        }

        this.stripe = new Stripe(secretKey || 'sk_test_placeholder'); // Safe init to avoid crash on startup
    }

    /**
     * Create a customer in Stripe
     * Idempotent check should ideally happen, but for now we create fresh if not mapping found.
     */
    async createCustomer(user) {
        try {
            console.log(`[PaymentService] Creating Stripe customer for ${user.email}`);
            const customer = await this.stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id
                }
            });
            return {
                id: customer.id,
                email: customer.email,
                description: customer.description
            };
        } catch (error) {
            console.error('[PaymentService] Create Customer Failed:', error);
            throw new Error('Failed to create payment profile.');
        }
    }

    /**
     * Create a subscription
     */
    async createSubscription(customerId, priceId) {
        try {
            console.log(`[PaymentService] Creating subscription for ${customerId} with price ${priceId}`);

            // Map internal plan IDs to Stripe Price IDs
            // In a real app, these are in ENV or DB.
            const PRICE_MAP = {
                'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_12345_placeholder',
                'pro_annual': process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_67890_placeholder'
            };

            const stripePriceId = PRICE_MAP[priceId];
            if (!stripePriceId) throw new Error('Invalid price ID configuration.');

            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: stripePriceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    payment_method_types: ['card'],
                    save_default_payment_method: 'on_subscription'
                },
                expand: ['latest_invoice.payment_intent'],
            });

            // Stripe returns current_period_end as Unix timestamp (seconds)
            const periodEnd = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            return {
                id: subscription.id,
                status: subscription.status,
                current_period_end: periodEnd,
                cancel_at_period_end: subscription.cancel_at_period_end,
                client_secret: subscription.latest_invoice?.payment_intent?.client_secret
            };

        } catch (error) {
            console.error('[PaymentService] Create Subscription Failed:', error);
            throw new Error('Failed to initialize subscription.');
        }
    }

    /**
     * Attach a payment method
     * In Stripe, the FRONTEND usually confirms the SetupIntent or PaymentMethod.
     * The backend attaches it to the customer.
     */
    async attachPaymentMethod(customerId, paymentMethodDetails) {
        try {
            // For production, the frontend sends a 'paymentMethodId' created via Stripe.js
            // The 'paymentMethodDetails' object here is expected to contain that ID.
            const { paymentMethodId } = paymentMethodDetails;

            if (!paymentMethodId) {
                throw new Error('Missing paymentMethodId (Stripe token).');
            }

            console.log(`[PaymentService] Attaching PM ${paymentMethodId} to ${customerId}`);

            // 1. Check if already attached (Handling SetupIntent automatic attachment)
            const retrievedPm = await this.stripe.paymentMethods.retrieve(paymentMethodId);

            let paymentMethod;
            if (retrievedPm.customer === customerId) {
                console.log(`[PaymentService] PaymentMethod ${paymentMethodId} is already attached to ${customerId}.`);
                paymentMethod = retrievedPm;
            } else {
                paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customerId,
                });
            }

            // Set as default for invoice settings
            await this.stripe.customers.update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            return {
                id: paymentMethod.id,
                type: paymentMethod.type,
                card: paymentMethod.card, // Contains brand, last4, exp
                gcash: paymentMethod.type === 'gcash' ? {} : undefined
            };
        } catch (error) {
            console.error('[PaymentService] Attach PM Failed:', error);
            throw new Error(error.message || 'Failed to attach payment method.');
        }
    }

    /**
     * Cancel Subscription
     */
    async cancelSubscription(subscriptionId) {
        try {
            console.log(`[PaymentService] Canceling subscription ${subscriptionId}`);
            // Cancel at period end
            const subscription = await this.stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true
            });

            return {
                id: subscription.id,
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end
            };
        } catch (error) {
            console.error('[PaymentService] Cancel Failed:', error);
            throw new Error('Failed to cancel subscription.');
        }
    }
    /**
     * Create a SetupIntent for saving a card
     */
    async createSetupIntent(customerId) {
        try {
            console.log(`[PaymentService] Creating SetupIntent for ${customerId}`);
            const setupIntent = await this.stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
            });

            return {
                client_secret: setupIntent.client_secret,
                id: setupIntent.id
            };
        } catch (error) {
            console.error('[PaymentService] Create SetupIntent Failed:', error);
            throw new Error('Failed to initialize payment setup.');
        }
    }
}

module.exports = new PaymentService();
