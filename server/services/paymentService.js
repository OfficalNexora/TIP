/**
 * PaymentService (GCash & PayPal Native)
 * 
 * Handles deep linking and order generation for GCash and PayPal.
 * Webhooks notify the server to upgrade users to 'pro' status.
 */

class PaymentService {
    constructor() {
        this.gcashDetails = {
            number: process.env.GCASH_NUMBER || '09XXXXXXXXX',
            name: process.env.GCASH_NAME || 'UNESCO AI MIRROR'
        };
        this.paypalDetails = {
            email: process.env.PAYPAL_EMAIL || 'paypal@example.com'
        };
    }

    /**
     * Generate GCash Deep Link / Payment URL
     * In a real production setup with PayMongo or direct GCash API:
     * We would create a 'Source' or 'Payment' and get the redirect URL.
     */
    async getGcashPaymentFlow(user, amount = 299) {
        console.log(`[Payment] Generating GCash flow for ${user.email}`);

        // For PayMongo (common in PH):
        // const response = await fetch('https://api.paymongo.com/v1/sources', { ... });
        // return response.data.attributes.redirect.checkout_url;

        // For this implementation, we return a simulated redirect that mimics the flow
        const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
        return `${baseUrl}/webhooks/payment-sim/gcash?user_id=${user.id}&amount=${amount}`;
    }

    /**
     * Generate PayPal Order
     */
    async getPaypalPaymentFlow(user, amount = 5.99) {
        console.log(`[Payment] Generating PayPal flow for ${user.email}`);

        // Real PayPal REST API integration:
        // const order = await paypal.orders.create({ ... });
        // return order.links.find(l => l.rel === 'approve').href;

        const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
        return `${baseUrl}/webhooks/payment-sim/paypal?user_id=${user.id}&amount=${amount}`;
    }

    /**
     * Unified Webhook Handler
     * Called by GCash/PayPal (or our simulator) when payment succeeds.
     */
    async handleSuccessfulPayment(userId, provider, metadata = {}) {
        const { supabaseAdmin } = require('./supabaseClient');

        console.log(`[PaymentSuccess] ${provider} confirmed for user ${userId}`);

        const { error } = await supabaseAdmin
            .from('users')
            .update({
                subscription_status: 'pro',
                subscription_metadata: {
                    last_payment_provider: provider,
                    payment_date: new Date().toISOString(),
                    ...metadata
                }
            })
            .eq('id', userId);

        if (error) {
            console.error('[PaymentUpdateFailed]', error);
            throw error;
        }

        // Audit Log
        await supabaseAdmin.from('security_audit_logs').insert({
            user_id: userId,
            event_type: 'SUBSCRIPTION_UPGRADED',
            status: 'SUCCESS',
            metadata: { provider, ...metadata }
        });

        return true;
    }
}

module.exports = new PaymentService();
