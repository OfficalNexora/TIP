const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// Auth is already applied at /api level in server/index.js

// --- INLINED HANDLERS TO PREVENT ROUTER INITIALIZATION ERRORS ---

router.get('/subscription', async (req, res) => {
    try {
        const { data: sub, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

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
});

router.post('/subscription/upgrade', async (req, res) => {
    res.status(400).json({
        error: 'Automated billing is currently disabled.',
        message: 'Please use the GCash or PayPal options in the billing portal for manual verification.'
    });
});

router.get('/payment-methods', async (req, res) => res.json([]));

router.post('/payment-methods', async (req, res) => {
    res.status(400).json({
        error: 'Automated card linking is disabled.',
        message: 'To maintain security and support localized payments, please use the GCash or PayPal options.'
    });
});

router.get('/invoices', async (req, res) => res.json([]));

router.post('/manual-payment', async (req, res) => {
    try {
        const { method, referenceNumber } = req.body;
        const userId = req.user.id;
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
        res.status(500).json({ error: 'Failed' });
    }
});

router.post('/setup-intent', (req, res) => res.status(400).json({ error: 'Disabled.' }));

module.exports = router;
