const { supabase } = require('./supabaseClient');

/**
 * Lightweight demo chat responder (no external LLM calls).
 * Uses latest analysis result (if provided) to craft contextual replies.
 */
class ChatService {
    async generate(message, userId, analysisId) {
        const normalized = (message || '').trim();
        if (!normalized) return { reply: 'Please type a question.' };

        // Try to enrich with analysis context
        let context = null;
        if (analysisId) {
            const { data } = await supabase
                .from('analysis_results')
                .select('result_json, created_at')
                .eq('analysis_id', analysisId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            context = data?.result_json || null;
        }

        const reply = this.composeReply(normalized, context);
        return { reply, contextUsed: !!context };
    }

    composeReply(message, ctx) {
        const lines = [];
        if (ctx) {
            const risk = ctx.forensic_analysis?.risk_level || ctx.ai_usage || 'katamtaman';
            const aiProb = ctx.forensic_analysis?.heuristic_score ?? ctx.confidence_score ?? '—';
            const patterns = ctx.forensic_analysis?.pattern_list || [];
            const top = patterns.slice(0, 3).map(p => `"${p.pattern || p.text || p}"`).join(', ');
            lines.push(`Based on this report, risk is ${risk} (score: ${aiProb}).`);
            if (top) lines.push(`AI word patterns seen: ${top}.`);
            const omissions = ctx.forensic_analysis?.omission_count || 0;
            if (omissions > 0) lines.push(`Omission flags: ${omissions}. Clarify methodology/ethics where missing.`);
        } else {
            lines.push('I can help explain results, risk scores, or next steps.');
        }

        // Light heuristics on user ask
        const lower = message.toLowerCase();
        if (lower.includes('improve') || lower.includes('fix')) {
            lines.push('To improve the score: reduce template phrases, add concrete citations, and expand methodology details.');
        } else if (lower.includes('ai') || lower.includes('plag')) {
            lines.push('AI probability combines heuristic patterns and omissions; keep original phrasing and cite sources to lower risk.');
        }

        lines.push('This is a demo assistant (no external LLM).');
        return lines.join(' ');
    }
}

module.exports = new ChatService();
