const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');

/**
 * Billing API (Authenticated)
 * These routes require a valid user session.
 */

// GET /api/billing/subscription
router.get('/subscription', BillingController.getSubscription);

// POST /api/billing/upgrade
// Initiates the GCash/PayPal flow by returning a redirect/deep-link URL.
router.post('/upgrade', BillingController.upgradePlan);

// GET /api/billing/invoices
router.get('/invoices', BillingController.getInvoices);

// GET /api/billing/payment-methods (Returns empty list, as methods are external)
router.get('/payment-methods', BillingController.getPaymentMethods);

module.exports = router;
