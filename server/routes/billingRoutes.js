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
router.delete('/payment-methods/:id', BillingController.removePaymentMethod);

// Invoices
router.get('/invoices', BillingController.getInvoices);

// Setup Intent (for adding cards)
router.post('/setup-intent', BillingController.createSetupIntent);

module.exports = router;
