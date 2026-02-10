const { supabase } = require('./supabaseClient');

class PaymentService {
    constructor() {
        this.providerName = 'MANUAL';
        console.log('[PaymentService] Initialized for Manual Payments (GCash/PayPal). Stripe is disabled.');
    }

    /**
     * Internal logging for payment attempts
     */
    async logPaymentAttempt(userId, details) {
        console.log(`[PaymentService] Manual payment attempt logged for user ${userId}:`, details);
        // Additional business logic for manual payments can go here
        return { success: true };
    }
}

module.exports = new PaymentService();
