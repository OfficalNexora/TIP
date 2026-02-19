const Groq = require('groq-sdk');

// ============================================================================
// API KEY ROTATION SYSTEM (GROQ)
// ============================================================================

class ApiKeyManager {
    constructor(envVarName, legacyEnvVarName) {
        this.envVarName = envVarName;
        this.legacyEnvVarName = legacyEnvVarName;
        this.keys = this._loadKeys();
        this.keyStatus = new Map(); // key -> { exhausted: boolean, cooldownUntil: Date }
        this.currentIndex = 0;

        console.log(`[Chat:KeyManager] Initialized with ${this.keys.length} API key(s)`);
    }

    _loadKeys() {
        const multipleKeys = process.env[this.envVarName];
        const singleKey = process.env[this.legacyEnvVarName];

        if (multipleKeys) {
            const keys = multipleKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (keys.length > 0) return keys;
        }

        if (singleKey) return [singleKey];
        return [];
    }

    getNextAvailableKey() {
        if (this.keys.length === 0) return null;

        const now = new Date();
        let checkedCount = 0;

        while (checkedCount < this.keys.length) {
            const index = (this.currentIndex + checkedCount) % this.keys.length;
            const key = this.keys[index];
            const status = this.keyStatus.get(key);

            if (!status || !status.exhausted || (status.cooldownUntil && status.cooldownUntil < now)) {
                if (status?.exhausted && status.cooldownUntil < now) {
                    this.keyStatus.set(key, { exhausted: false, cooldownUntil: null });
                }
                this.currentIndex = (index + 1) % this.keys.length;
                return { key, index };
            }
            checkedCount++;
        }
        return null;
    }

    markExhausted(key, cooldownSeconds = 60) {
        const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);
        this.keyStatus.set(key, { exhausted: true, cooldownUntil });
        console.log(`[Chat:Groq] Key marked as exhausted. Cooldown until ${cooldownUntil.toLocaleTimeString()}`);
    }

    hasKeys() {
        return this.keys.length > 0;
    }
}

const keyManager = new ApiKeyManager('GROQ_API_KEYS', 'GROQ_API_KEY');
const CHAT_MODEL = "llama-3.1-8b-instant";

const BASE_SYSTEM_PROMPT = `
Ikaw ay si "Nexora AI", isang dalubhasa sa UNESCO Ethical AI Standards at Research Integrity.
Ang iyong layunin ay tulungan ang mga researcher na maunawaan ang kanilang audit results.

MGA ALITUNTUNIN:
1. Gamitin ang Tagalog/Filipino (Natural, professional pero friendly na reviewer tone).
2. Magbigay ng praktikal na payo kung paano itataas ang compliance score.
3. Huwag mag-imbento ng facts. Gamitin lamang ang ibinigay na konteksto ng dokumento.
4. Kung ang tanong ay labas sa dokumento, sagutin ito batay sa pangkalahatang research ethics.
5. Manatiling tapat sa "Institutional Persona": Maging mapanuri pero nakakatulong.
`;

class ChatService {
    async generate(message, userId, analysisId, history, supabaseClient) {
        history = history || [];
        const normalized = (message || '').trim();
        if (!normalized) return { reply: 'Mangyaring mag-type ng tanong.', contextUsed: false };

        let analysisContext = null;
        if (analysisId && supabaseClient) {
            try {
                const { data } = await supabaseClient
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
        const topPatterns = patterns.slice(0, 5).map(p => '"' + (p.pattern || p.text || p) + '"').join(', ');
        const omissions = fa.omission_count || 0;

        const contextBlock = `
KONTEKSTO NG KASALUKUYANG DOKUMENTO:
- Antas ng Panganib: ${risk}
- AI Risk Score: ${score}%
- AI Patterns: ${topPatterns || 'Walang nakita'}
- Omission Flags: ${omissions}

Gamitin ang kontekstong ito para sumagot. Mag-focus sa kung bakit nakuha ang score na ito.
`;
        return BASE_SYSTEM_PROMPT + contextBlock;
    }

    _buildMessages(systemPrompt, history, latestMessage) {
        const msgs = [{ role: 'system', content: systemPrompt }];
        const trimmedHistory = (history || []).slice(-10);

        trimmedHistory.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'assistant') {
                msgs.push({ role: msg.role, content: msg.content });
            }
        });

        msgs.push({ role: 'user', content: latestMessage });
        return msgs;
    }

    async _callGroq(messages) {
        let attempts = 0;
        const maxAttempts = keyManager.keys.length;

        while (attempts < maxAttempts) {
            const keyInfo = keyManager.getNextAvailableKey();
            if (!keyInfo) break;
            attempts++;

            const groq = new Groq({ apiKey: keyInfo.key });
            try {
                const completion = await groq.chat.completions.create({
                    model: CHAT_MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 512,
                });

                const reply = completion.choices?.[0]?.message?.content;
                if (reply) return reply.trim();
            } catch (error) {
                console.warn(`[ChatService] Key #${keyInfo.index + 1} failed: ${error.message}`);
                if (error.status === 429) {
                    keyManager.markExhausted(keyInfo.key, 60);
                }
            }
        }
        return null;
    }

    _fallbackReply(message, ctx) {
        const lines = ["(Paumanhin, offline ang aking AI engine sa ngayon.)"];
        if (ctx) {
            const score = ctx.confidence_score || 0;
            lines.push(`Ang iyong dokumento ay may risk score na ${score}%.`);
            if (score > 60) lines.push("Mataas ang posibilidad ng AI patterns o kulang sa ethical disclosures.");
            else lines.push("Maayos ang alignment ng iyong dokumento sa UNESCO standards.");
        }
        lines.push("Subukan muli mamaya para sa mas detalyadong paliwanag.");
        return lines.join(' ');
    }
}

module.exports = new ChatService();
