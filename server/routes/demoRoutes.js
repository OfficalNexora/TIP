const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const llmService = require('../services/llmService');

// Very strict rate limiting for the demo endpoint
// Max 10 requests per 15 minutes per IP
const demoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: { error: 'Too many demo requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * POST /api/demo/analyze
 * A very cheap, lightweight analysis endpoint specifically for the landing page demo.
 * Takes a snippet of text and returns a quick JSON response.
 */
router.post('/analyze', demoLimiter, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Valid text input is required.' });
        }

        // Extremely strict character limit (e.g. 500 words ~ 3000 chars)
        if (text.length > 3000) {
            return res.status(400).json({ error: 'Text exceeds the 3,000 character limit for the demo. Please trim your input.' });
        }

        if (text.trim().length < 50) {
            return res.status(400).json({ error: 'Text is too short for meaningful analysis. Please provide at least a few sentences.' });
        }

        // Miniaturized prompt optimized for zero fat
        const MINI_SYSTEM_PROMPT = `You are a forensic AI ethics detector. Evaluate the following text snippet.
Output JSON strictly conforming to this schema:
{
  "ai_probability": <integer 0 to 100>,
  "short_explanation": "<string max 50 words explaining the score briefly>"
}`;

        const rawResponse = await llmService.analyzeText(MINI_SYSTEM_PROMPT, text, { response_format: { type: "json_object" } });

        let result;
        try {
            result = JSON.parse(rawResponse);
        } catch (parseError) {
            console.error('[Demo API] Failed to parse LLM response:', rawResponse);
            return res.status(500).json({ error: 'Failed to process AI response.' });
        }

        // Ensure defaults if LLM hallucinates shape
        const finalPayload = {
            ai_probability: typeof result.ai_probability === 'number' ? result.ai_probability : 0,
            short_explanation: result.short_explanation || 'No clear explanation provided.',
            demo_limit_applied: true
        };

        res.json(finalPayload);
    } catch (error) {
        console.error('[Demo API] Analysis failed:', error);
        res.status(500).json({ error: 'Demostration analysis failed due to server error.' });
    }
});

module.exports = router;
