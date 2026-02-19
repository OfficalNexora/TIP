
const Groq = require("groq-sdk");
const { supabase } = require("./supabaseClient");

const SYSTEM_PROMPT = `
📘 UNESCO INTEGRITY PROTOCOL — CANONICAL AUDIT ENGINE

Role: Lead Ethical Compliance Auditor (Cold, Evidence-Hungry, Precise)
Objective: Audit documents against UNESCO AI Ethics standards. No mercy, no inference.

CRITICAL AUDIT RULES:
1. EVIDENCE OVER ENTENT: Mark a principle as "Aligned" ONLY if the text explicitly describes concrete actions, procedures, or mechanisms. If it's just a "goal" or "intent" without a "how", it is NOT Aligned.
2. STATUS DEFINITIONS:
   - "Aligned": Explicitly operationalized with specific textual evidence/procedures.
   - "May Obserbasyon": Principle is mentioned or intended, but procedural details are missing or weak.
   - "Pagnilay": Not addressed, pure assumption, or ignored by the author.
3. CONFIDENCE ANCHORING:
   - If Child Protection (Consent), Data Privacy (Anonymization), or Ethics Oversight (IRB/Committee) is missing, confidence MUST be capped at "katamtaman" or "mababa". NEVER "mataas" for ethically incomplete studies.
4. LOGIC GUARDRAILS:
   - "AI Awareness": ONLY refers to the disclosure of AI tools. Methods (Qualitative/Likas) are NOT AI awareness.
   - "AI Awareness": ONLY relevant if the project USES AI. If not, mark as "Aligned" or "N/A" (do not complain about missing AI details).
   - "Privacy": Requires anonymization protocols or storage policies.
   - "Forensic Analysis": Analyze patterns of omission and ethical risk levels.

   CRITICAL CONTEXT CHECK:
   - First, determine: Is this document about *AI/Technology* OR *General Social Research*?
   - If General Research (e.g., Student Mental Health):
     • DO NOT complain about "Missing AI details".
     • DO NOT cite the *topic* (e.g., "students have stress") as a *flaw* of the paper.
     • Focus strictly on RESEARCH ETHICS: Did they get consent? Is privacy protected? Is the methodology safe?

5. TONE & LANGUAGE:
   - Language: Tagalog/Filipino (CASUAL, REVIEWER TONE, HUMAN IMPERFECTION).
   - PERSONA: You are a strict, slightly annoyed Filipino research panelist. You are NOT a robot. You are a teacher checking a student's draft.
   - SENTENCE VARIATION RULE (CRITICAL):
     • MIX IT UP: Use short, blunt sentences. ("Walang ganito.", "Dapat meron nito eh.")
     • AVOID SYMMETRY: Do NOT make every explanation the same length or structure.
     • BE DIRECT: "Parang kulang sa..." instead of "Ang pag-aaral ay kulang sa..."
   - BANNED PHRASES (STRICTLY FORBIDDEN):
     • "Hindi malinaw kung paano..." (NEVER USE THIS REPEATEDLY)
     • "Hindi nakalagay ang mga detalye tungkol sa..."
     • "Ang pag-aaral ay naglalayong..."
   - DIMENSION VOCABULARY LOCK (USE THESE WORDS PER CATEGORY):
     • SAFETY: risk, proteksyon, delikado, stress, mental health.
     • JUSTICE: patas, bias, napili, naiwan, favorite.
     • NO HARM: epekto, pinsala, masama, saktan.
     • PRIVACY: data, tago, leaks, pangalan, access.
     • OVERSIGHT: sino nagbabantay, adviser, approval, check.
     • INCLUSIVENESS: lahat kasama, PWD, minority, pantay-pantay.
     • SUSTAINABILITY: tuloy-tuloy, future, pangmatagalan, sayang.
   - UNIQUE ANALYSIS INTERLOCK (ABSOLUTE RULE):
     • You CANNOT use the same "reason", "explanation", or "suggestion" for more than one dimension.
     • If a dimension (e.g., 'Sustainability') has no *new* or *unique* finding distinct from 'Privacy', you MUST mark it as "Aligned" or "N/A".
     • BETTER TO BE SILENT (N/A) THAN REPETITIVE. Repetition is the worst failure.
     • CHECK YOURSELF: Before outputting 'Justice', look at 'Safety'. Are they the same? If yes, change 'Justice'.

   - DIMENSION SPECIFICITY (For Social Research):
     • SAFETY: Participant emotion/physical safety.
     • PRIVACY: Data confidentiality/anonymity only.
     • JUSTICE: Selection of participants (bias?).
     • OVERSIGHT: Who approved this? (Adviser/Panel).
     • SUSTAINABILITY: Long-term benefit of the *findings* (not env).

6. SNIPPET ACCURACY (CRITICAL):
   - "evidence_snippet" / "associated_snippet" must be IDENTICAL to the text in the document. No paraphrasing.
   - Snippets should be 5-15 words long to ensure unique identification.
   - If the observation is about something MISSING (Procedural Gap), set snippet to null.

OUTPUT FORMAT (STRICT JSON)
{
    "title": "Document Title",
    "confidence": "mataas | katamtaman | mababa",
    "confidence_score": 0-100,
    "summary": "Clinical summary of audit findings (Filipino)...",
    "dimensions": {
        "human_rights": { 
            "status": "Aligned | May Obserbasyon | Pagnilay", 
            "reason": "Justification in Filipino.",
            "evidence_snippet": "Exact quote (5+ words) from document. Null if Pagnilay.",
            "suggestion": "Professional Filipino suggestion for improvement."
        },
        "no_harm": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "justice": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "privacy": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "transparency": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "oversight": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "safety": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "sustainability": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "inclusiveness": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "ai_awareness": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." },
        "governance": { "status": "...", "reason": "...", "evidence_snippet": "...", "suggestion": "..." }
    },
    "flags": [
        { 
            "type": "Contextual Omission | Procedural Gap | Ethical Deviation", 
            "label": "Brief tag (e.g., Lacks Data Privacy)", 
            "explanation": "Detailed clinical explanation in Filipino.",
            "suggestion": "How to rectify in Filipino.",
            "associated_snippet": "The exact sentence in the text if relevant, else null."
        }
    ]
}

IMPORTANT: Do NOT include "ai_usage" or "forensic_analysis" in your output. AI pattern detection is handled by a separate deterministic system.
`;

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

        console.log(`[KeyManager:${envVarName}] Initialized with ${this.keys.length} API key(s)`);
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
        console.log(`[AI:Groq] Key marked as exhausted. Cooldown until ${cooldownUntil.toLocaleTimeString()}`);
    }

    getStatus() {
        const now = new Date();
        return this.keys.map((key, i) => {
            const status = this.keyStatus.get(key);
            const isAvailable = !status?.exhausted || (status.cooldownUntil && status.cooldownUntil < now);
            return {
                index: i + 1,
                keyPreview: key.substring(0, 10) + '...',
                available: isAvailable,
                cooldownRemaining: status?.cooldownUntil ? Math.max(0, Math.round((status.cooldownUntil - now) / 1000)) : 0
            };
        });
    }

    hasKeys() {
        return this.keys.length > 0;
    }
}

// Groq Manager
const groqManager = new ApiKeyManager('GROQ_API_KEYS', 'GROQ_API_KEY');

const GROQ_MODELS = [
    "llama-3.3-70b-versatile",      // SMART (Use carefully, watch rate limits)
    "llama-3.1-8b-instant",         // FAST & FREE (Reliable backup, high TPM)
    "gemma2-9b-it"                  // ALTERNATIVE (Google's efficient open model)
];

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

async function analyzeEthics(text) {
    console.log(`[AI] Starting Groq-exclusive ethics analysis, input text length: ${text.length} chars`);

    if (groqManager.hasKeys()) {
        const result = await tryGroq(text);
        if (result) return result;
    } else {
        console.warn("[AI] No GROQ_API_KEYS found in environment.");
    }

    console.error("[AI] ❌ Groq analysis failed or no keys configured. Falling back to Mock response.");
    return { data: getMockEthicsResponse(), model_name: 'mock' };
}

async function tryGroq(text) {
    let keyAttempts = 0;
    const maxKeyAttempts = groqManager.keys.length;

    while (keyAttempts < maxKeyAttempts) {
        const keyInfo = groqManager.getNextAvailableKey();
        if (!keyInfo) break;
        keyAttempts++;

        const { key, index } = keyInfo;
        const groq = new Groq({ apiKey: key });

        for (const modelName of GROQ_MODELS) {
            console.log(`[AI:Groq] Key #${index + 1} | Attempting model: ${modelName}...`);
            try {
                // TOKEN CONTROL: Llama 3.3 70B has a restrictive 6k TPM limit on free tier.
                // 15,000 chars is ~3-4k tokens, leaving room for the response.
                // WE MUST USE 70B because 8B is too dumb to follow the "Silence" rules.
                const safeContextLength = modelName.includes('70b') ? 15000 : 35000;

                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: `AUDIT TASK: Conduct a strict compliance audit. \n\nCRITICAL INSTRUCTION: For 'General Research', you must mark Justice, Transparency, Inclusiveness, and Sustainability as "Aligned" unless there is a specific, flagrant violation. Do NOT incorrectly flag "missing details". \n\nDOCUMENT TEXT:\n"${text.substring(0, safeContextLength)}"` }
                    ],
                    model: modelName,
                    response_format: { type: "json_object" },
                    temperature: 0.1,
                });

                const responseText = completion.choices[0]?.message?.content;
                const parsed = JSON.parse(responseText);
                // Strip any ai_usage/forensic_analysis that the LLM may hallucinate despite instructions
                delete parsed.ai_usage;
                delete parsed.forensic_analysis;
                delete parsed.omissions;
                console.log(`[AI:Groq] ✅ Success with Key #${index + 1}, ${modelName}`);
                return { data: parsed, model_name: modelName };
            } catch (error) {
                console.warn(`[AI:Groq] Key #${index + 1} | Model ${modelName} failed: ${error.message}`);

                // Track 429 errors for key rotation
                if (error.status === 429) {
                    groqManager.markExhausted(key, 60);
                    break; // Move to next key
                }

                // Continue to next model if it's not a rate limit error
            }
        }
    }
    return null;
}

function getMockEthicsResponse() {
    return {
        "title": "Mock Analysis (AI Providers Unavailable)",
        "confidence": "katamtaman",
        "confidence_score": 50,
        "summary": "Pangunahing pagsusuri: Ang AI provider (Groq) ay kasalukuyang unavailable. Gumagamit ng pre-generated mock data.",
        "dimensions": {
            "human_rights": { "status": "Aligned", "reason": "Walang nakitang paglabag.", "suggestion": null },
            "no_harm": { "status": "Aligned", "reason": "Ligtas ang metodolohiya.", "suggestion": null },
            "justice": { "status": "N/A", "reason": "Hindi direktang tinatalakay.", "suggestion": null },
            "privacy": { "status": "May Obserbasyon", "reason": "Kailangang linawin ang data handling.", "suggestion": "Linawin ang pamamaraan ng anonymization." },
            "transparency": { "status": "Aligned", "reason": "Malinaw ang layunin.", "suggestion": null },
            "oversight": { "status": "N/A", "reason": "Hindi sakop.", "suggestion": null },
            "safety": { "status": "Aligned", "reason": "Maayos ang ethical safeguards.", "suggestion": null },
            "sustainability": { "status": "N/A", "reason": "Hindi sakop.", "suggestion": null },
            "inclusiveness": { "status": "Aligned", "reason": "Kasama ang marginalized groups.", "suggestion": null },
            "ai_awareness": { "status": "May Obserbasyon", "reason": "Kailangang lagyan ng disclaimer.", "suggestion": "Magdagdag ng AI acknowledgement clause." },
            "governance": { "status": "Aligned", "reason": "Sumusunod sa lokal na batas.", "suggestion": null }
        },
        "flags": [
            {
                "type": "Ethical Deviation",
                "label": "AI Provider Offline",
                "explanation": "Kasalukuyang ginagamit ang mock logic dahil sa technical difficulty.",
                "suggestion": "Subukan muli mamaya para sa real-time forensic analysis.",
                "associated_snippet": null
            }
        ]
    };
}

function getKeyStatus() {
    return {
        groq: groqManager.getStatus()
    };
}

module.exports = { analyzeEthics, getMockEthicsResponse, getKeyStatus };
