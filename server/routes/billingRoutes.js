const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');

// Auth is already applied at /api level in server/index.js
// No need to apply again here

// Subscription
router.get('/subscription', BillingController.getSubscription);
router.post('/subscription/upgrade', BillingController.upgradePlan);

// Payment Methods
router.get('/payment-methods', BillingController.getPaymentMethods);
router.post('/payment-methods', BillingController.addPaymentMethod);

// Invoices
router.get('/invoices', BillingController.getInvoices);

// Manual Payment
router.post('/manual-payment', BillingController.submitManualPayment);

// Setup Intent (Stripe leftover) - Replaced with generic stub
router.post('/setup-intent', (req, res) => res.status(400).json({ error: 'Automated card setup is disabled. Please use manual payments.' }));

module.exports = router;
