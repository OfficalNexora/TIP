/**
 * Normalizes AI confidence/integrity words into numeric percentages based on .env config.
 * Institutional standard scoring: EXEMPLARY:98 | COMPLIANT:90 | OBSERVED:75 | REFLECT:50 | FLAGGED:20
 */
class ScoringService {
    constructor() {
        this.scoreMap = this._parseMap(process.env.SCORING_MAP);
    }

    _parseMap(mapStr) {
        if (!mapStr) return {};
        const pairs = mapStr.split('|');
        const map = {};
        pairs.forEach(p => {
            const [word, score] = p.split(':');
            if (word && score) {
                map[word.toUpperCase()] = parseInt(score);
            }
        });
        return map;
    }

    /**
     * Convert string rating to number.
     * Handles Filipino/English/Mixed case.
     * Returns a RISK SCORE (0 = Safe/Human, 100 = High Risk/AI).
     * @param {string|number} rate 
     * @returns {number}
     */
    normalize(rate) {
        if (typeof rate === 'number') return rate;
        if (!rate) return 0;

        const cleanRate = rate.toString().toUpperCase().trim();

        // Direct map check (usually strings like 'low', 'medium', 'high')
        if (this.scoreMap[cleanRate]) return this.scoreMap[cleanRate];

        // Language specific mapping for UNESCO Mirror (Filipino)
        // 0-is-good model: Low Risk (Mababa/Safe) -> Low Number
        if (cleanRate === 'MATAAS' || cleanRate === 'EXEMPLARY') return 5;
        if (cleanRate === 'ALIGNED' || cleanRate === 'COMPLIANT') return 15;
        if (cleanRate === 'KATAMTAMAN' || cleanRate === 'REFLECT' || cleanRate === 'OBSERVED') return 35;
        if (cleanRate === 'MABABA' || cleanRate === 'FLAGGED') return 90;
        if (cleanRate === 'KRITIKAL' || cleanRate === 'CRITICAL') return 98;

        // Fallback for numeric strings
        const parsed = parseInt(cleanRate);
        return isNaN(parsed) ? 10 : parsed;
    }

    /**
     * Compute average RISK score from a set of analyses.
     * @param {Array} analyses 
     * @returns {number}
     */
    computeAverage(analyses) {
        if (!analyses || analyses.length === 0) return 0;

        const validScores = analyses
            .map(a => {
                const results = a.analysis_results?.[0]?.result_json || a.results;
                // Prefer numeric confidence_score (risk) if available
                if (results?.confidence_score !== undefined) return results.confidence_score;
                // Fallback to normalizing the label
                return this.normalize(results?.confidence);
            })
            .filter(s => s !== null && s !== undefined);

        if (validScores.length === 0) return 0;
        const sum = validScores.reduce((acc, curr) => acc + curr, 0);
        return Math.round(sum / validScores.length);
    }
}

module.exports = new ScoringService();
