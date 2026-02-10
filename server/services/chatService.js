const Groq = require('groq-sdk');
const { supabase } = require('./supabaseClient');

// ============================================================================
// API KEY ROTATION - Reuses the same pattern from ethicsService.js
// ============================================================================

class ChatKeyManager {
    constructor() {
        this.keys = this._loadKeys();
        this.keyStatus = new Map();
        this.currentIndex = 0;
        console.log('[ChatService] Initialized with ' + this.keys.length + ' Groq API key(s)');
    }

    _loadKeys() {
        const multi = process.env.GROQ_API_KEYS;
        const single = process.env.GROQ_API_KEY;
        if (multi) {
            const keys = multi.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (keys.length > 0) return keys;
        }
        if (single) return [single];
        return [];
    }

    getNextAvailableKey() {
        if (this.keys.length === 0) return null;
        const now = new Date();
        let checked = 0;
        while (checked < this.keys.length) {
            const idx = (this.currentIndex + checked) % this.keys.length;
            const key = this.keys[idx];
            const status = this.keyStatus.get(key);
            if (!status || !status.exhausted || (status.cooldownUntil && status.cooldownUntil < now)) {
                if (status && status.exhausted && status.cooldownUntil < now) {
                    this.keyStatus.set(key, { exhausted: false, cooldownUntil: null });
                }
                this.currentIndex = (idx + 1) % this.keys.length;
                return { key, index: idx };
            }
            checked++;
        }
        return null;
    }

    markExhausted(key, cooldownSeconds) {
        cooldownSeconds = cooldownSeconds || 60;
        const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);
        this.keyStatus.set(key, { exhausted: true, cooldownUntil });
        console.log('[ChatService] Key exhausted. Cooldown until ' + cooldownUntil.toLocaleTimeString());
    }

    hasKeys() { return this.keys.length > 0; }
}

const keyManager = new ChatKeyManager();
const CHAT_MODEL = 'llama-3.1-8b-instant';

// ============================================================================
// SYSTEM PROMPT - Tagalog-first TIP AI assistant
// ============================================================================

const BASE_SYSTEM_PROMPT = [
    'Ikaw ay ang TIP AI Assistant - isang matulunging AI na katulong para sa TIP AI Ethics & Integrity Checker.',
    '',
    'TUNGKULIN MO:',
    '- Sumagot ng mga tanong tungkol sa resulta ng pagsusuri ng dokumento (risk scores, AI patterns, omissions, UNESCO principles).',
    '- Magbigay ng payo kung paano mapabuti ang iskor ng integridad.',
    '- Ipaliwanag ang mga konsepto ng AI ethics sa simpleng paraan.',
    '- Sumagot sa Tagalog bilang default, pero kung nagtanong ang user sa English, sumagot sa English.',
    '',
    'MGA PANUNTUNAN:',
    '- Maging maikli at direkta sa sagot. Huwag lumampas ng 150 salita maliban kung kailangan.',
    '- Gamitin ang konteksto ng pagsusuri kung available.',
    '- Huwag mag-imbento ng datos. Kung walang impormasyon, sabihin mo.',
    '- Maging professional at magalang.'
].join('\n');

// ============================================================================
// CHAT SERVICE
// ============================================================================

class ChatService {
    async generate(message, userId, analysisId, history) {
        history = history || [];
        const normalized = (message || '').trim();
        if (!normalized) return { reply: 'Mangyaring mag-type ng tanong.', contextUsed: false };

        let analysisContext = null;
        if (analysisId) {
            try {
                const { data } = await supabase
                    .from('analysis_results')
                    .select('result_json, created_at')
                    .eq('analysis_id', analysisId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                analysisContext = data ? data.result_json : null;
            } catch (err) {
                console.warn('[ChatService] Failed to fetch analysis context:', err.message);
            }
        }

        const systemPrompt = this._buildSystemPrompt(analysisContext);
        const messages = this._buildMessages(systemPrompt, history, normalized);

        if (keyManager.hasKeys()) {
            const llmReply = await this._callGroq(messages);
            if (llmReply) {
                return { reply: llmReply, contextUsed: !!analysisContext };
            }
        }

        console.warn('[ChatService] Groq unavailable, using fallback demo reply');
        const fallback = this._fallbackReply(normalized, analysisContext);
        return { reply: fallback, contextUsed: !!analysisContext };
    }

    _buildSystemPrompt(ctx) {
        if (!ctx) return BASE_SYSTEM_PROMPT;

        const fa = ctx.forensic_analysis || {};
        const risk = fa.risk_level || 'hindi tiyak';
        const score = fa.heuristic_score != null ? fa.heuristic_score : (ctx.confidence_score != null ? ctx.confidence_score : '—');
        const patterns = fa.pattern_list || [];
        const patternCount = patterns.length;
        const topPatterns = patterns.slice(0, 5).map(function(p) { return '"' + (p.pattern || p.text || p) + '"'; }).join(', ');
        const omissions = fa.omission_count || 0;
        const riskExplanation = fa.risk_explanation || '';
        const omissionExplanation = fa.omission_explanation || '';

        const dimensions = ctx.dimensions || {};
        const dimSummary = Object.entries(dimensions)
            .map(function(entry) { return '  - ' + entry[0] + ': ' + (entry[1].alignment || entry[1].rate || 'N/A'); })
            .join('\n');

        const contextBlock = [
            '',
            'KONTEKSTO NG KASALUKUYANG DOKUMENTO:',
            '- Antas ng Panganib: ' + risk,
            '- AI Risk Score: ' + score + '%',
            '- Bilang ng AI Patterns: ' + patternCount + (topPatterns ? ' (hal: ' + topPatterns + ')' : ''),
            '- Bilang ng Omission Flags: ' + omissions,
            '- Paliwanag ng Panganib: ' + riskExplanation,
            '- Paliwanag ng Omissions: ' + omissionExplanation,
            dimSummary ? '\nUNESCO Dimensions:\n' + dimSummary : '',
            '',
            'Gamitin ang kontekstong ito para sumagot ng mga tanong tungkol sa dokumentong ito.'
        ].join('\n');

        return BASE_SYSTEM_PROMPT + contextBlock;
    }

    _buildMessages(systemPrompt, history, latestMessage) {
        var msgs = [{ role: 'system', content: systemPrompt }];
        var trimmedHistory = history.slice(-20);
        for (var i = 0; i < trimmedHistory.length; i++) {
            var msg = trimmedHistory[i];
            if (msg.role === 'user' || msg.role === 'assistant') {
                msgs.push({ role: msg.role, content: msg.content });
            }
        }
        msgs.push({ role: 'user', content: latestMessage });
        return msgs;
    }

    async _callGroq(messages) {
        var maxAttempts = keyManager.keys.length;
        for (var attempt = 0; attempt < maxAttempts; attempt++) {
            var keyInfo = keyManager.getNextAvailableKey();
            if (!keyInfo) {
                console.warn('[ChatService] No available Groq keys');
                return null;
            }
            var key = keyInfo.key;
            var index = keyInfo.index;
            var groq = new Groq({ apiKey: key });

            try {
                console.log('[ChatService] Key #' + (index + 1) + ' | Calling ' + CHAT_MODEL + '...');
                var completion = await groq.chat.completions.create({
                    model: CHAT_MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 512,
                    top_p: 0.9
                });

                var reply = completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content;
                if (reply) {
                    reply = reply.trim();
                    console.log('[ChatService] Success with Key #' + (index + 1));
                    return reply;
                }
            } catch (error) {
                console.warn('[ChatService] Key #' + (index + 1) + ' failed: ' + error.message);
                if (error.status === 429 || (error.message && error.message.includes('rate_limit'))) {
                    keyManager.markExhausted(key, 60);
                }
            }
        }
        return null;
    }

    _fallbackReply(message, ctx) {
        var lines = [];
        if (ctx) {
            var fa = ctx.forensic_analysis || {};
            var risk = fa.risk_level || 'katamtaman';
            var score = fa.heuristic_score != null ? fa.heuristic_score : (ctx.confidence_score != null ? ctx.confidence_score : '—');
            var patterns = fa.pattern_list || [];
            var top = patterns.slice(0, 3).map(function(p) { return '"' + (p.pattern || p.text || p) + '"'; }).join(', ');
            lines.push('Batay sa report na ito, ang panganib ay ' + risk + ' (score: ' + score + ').');
            if (top) lines.push('Nakitang AI patterns: ' + top + '.');
            var omissions = fa.omission_count || 0;
            if (omissions > 0) lines.push('May ' + omissions + ' na omission flags. Linawin ang methodology/ethics kung kulang.');
        } else {
            lines.push('Makakatulong ako sa pagpapaliwanag ng mga resulta, risk scores, o mga susunod na hakbang.');
        }

        var lower = message.toLowerCase();
        if (lower.includes('improve') || lower.includes('fix') || lower.includes('pabuti')) {
            lines.push('Para mapabuti ang score: bawasan ang template phrases, magdagdag ng citations, at palawakin ang detalye ng methodology.');
        } else if (lower.includes('ai') || lower.includes('plag')) {
            lines.push('Ang AI probability ay pinagsasama ang heuristic patterns at omissions; gumamit ng sariling phrasing at mag-cite ng sources.');
        }

        lines.push('(Fallback mode - ang Groq AI ay kasalukuyang hindi available.)');
        return lines.join(' ');
    }
}

module.exports = new ChatService();
