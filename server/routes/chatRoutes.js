const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { message, analysisId, history } = req.body || {};
        const reply = await chatService.generate(message, req.user.id, analysisId, history || [], req.supabase);
        res.json(reply);
    } catch (error) {
        console.error('[Chat] failed:', error);
        res.status(500).json({ error: 'Chat service unavailable.' });
    }
});

module.exports = router;
