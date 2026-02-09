const { supabase } = require('./supabaseClient');

class PlagiarismService {
    constructor() {
        this.SHINGLE_SIZE = 5; // 5-word shingles balance noise vs recall
        this.MIN_WORDS = 80;   // skip tiny uploads
        this.DEFAULT_LIMIT = 120; // how many past docs to compare
    }

    normalize(text) {
        return (text || '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    makeShingles(text) {
        const words = text.split(' ');
        const shingles = new Set();
        for (let i = 0; i <= words.length - this.SHINGLE_SIZE; i++) {
            shingles.add(words.slice(i, i + this.SHINGLE_SIZE).join(' '));
        }
        return shingles;
    }

    jaccard(a, b) {
        if (!a.size || !b.size) return 0;
        const [small, big] = a.size < b.size ? [a, b] : [b, a];
        let intersect = 0;
        for (const item of small) {
            if (big.has(item)) intersect++;
        }
        const union = a.size + b.size - intersect;
        return union === 0 ? 0 : intersect / union;
    }

    async detect(text, currentAnalysisId) {
        const normalized = this.normalize(text);
        const wordCount = normalized.split(' ').length;
        if (wordCount < this.MIN_WORDS) {
            return { similarity: 0, reason: 'too_short', compared: 0 };
        }

        // Fetch recent completed analyses with stored text
        const { data, error } = await supabase
            .from('analyses')
            .select('id, full_text')
            .eq('status', 'COMPLETED')
            .not('full_text', 'is', null)
            .order('created_at', { ascending: false })
            .limit(this.DEFAULT_LIMIT);

        if (error) {
            console.error('[Plagiarism] Supabase fetch failed:', error.message);
            return { similarity: 0, error: error.message, compared: 0 };
        }

        const targetShingles = this.makeShingles(normalized);
        let best = { similarity: 0, matchId: null, overlap: 0, compared: 0 };

        for (const row of data || []) {
            if (!row.full_text || row.id === currentAnalysisId) continue;
            const candidate = this.normalize(row.full_text);
            const candidateShingles = this.makeShingles(candidate);
            const sim = this.jaccard(targetShingles, candidateShingles);
            if (sim > best.similarity) {
                best = {
                    similarity: parseFloat(sim.toFixed(3)),
                    matchId: row.id,
                    overlap: Math.min(targetShingles.size, candidateShingles.size),
                    compared: best.compared + 1
                };
            } else {
                best.compared += 1;
            }
        }

        return best;
    }
}

module.exports = new PlagiarismService();
