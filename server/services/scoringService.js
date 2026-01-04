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
     * @param {string|number} rate 
     * @returns {number}
     */
    normalize(rate) {
        if (typeof rate === 'number') return rate;
        if (!rate) return 0;

        const cleanRate = rate.toString().toUpperCase().trim();

        // Direct map check
        if (this.scoreMap[cleanRate]) return this.scoreMap[cleanRate];

        // Language specific mapping for UNESCO Mirror (Filipino)
        if (cleanRate === 'MATAAS') return this.scoreMap['EXEMPLARY'] || 90;
        if (cleanRate === 'KATAMTAMAN') return this.scoreMap['REFLECT'] || 60;
        if (cleanRate === 'MABABA') return this.scoreMap['FLAGGED'] || 30;

        // Fallback for numeric strings
        const parsed = parseInt(cleanRate);
        return isNaN(parsed) ? 50 : parsed;
    }

    /**
     * Compute average integrity score from a set of analyses.
     * @param {Array} analyses 
     * @returns {number}
     */
    computeAverage(analyses) {
        if (!analyses || analyses.length === 0) return 0;

        const validScores = analyses
            .map(a => {
                const results = a.analysis_results?.[0]?.result_json || a.results; // Handle both schema variants
                const confidence = results?.confidence;
                return this.normalize(confidence);
            })
            .filter(s => s > 0);

        if (validScores.length === 0) return 0;
        const sum = validScores.reduce((acc, curr) => acc + curr, 0);
        return Math.round(sum / validScores.length);
    }
}

module.exports = new ScoringService();
