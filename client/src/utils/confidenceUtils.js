/**
 * Normalizes institutional AI confidence ratings into numeric percentages.
 * Supports numeric strings, percentage strings, and specific institutional words.
 */
export const normalizeConfidence = (rating) => {
    if (rating === null || rating === undefined) return 0;

    // If it's already a number or numeric string
    const numeric = parseFloat(rating);
    if (!isNaN(numeric)) return numeric;

    const normalized = rating.toString().toLowerCase().trim();

    // Institutional Mapping (Synced with backend SCORING_MAP)
    // INVERTED LOGIC: 0 = Low Risk (Good), 100 = High Risk (Bad)
    const map = {
        'exemplary': 5,
        'mataas': 10,  // Low Risk (High Integrity)
        'compliant': 20,
        'katamtaman': 50,
        'observed': 60,
        'mababa': 90,  // High Risk (Low Integrity)
        'reflect': 80,
        'flagged': 95
    };

    return map[normalized] || 0;
};

/**
 * Returns a human-readable compliance label based on the confidence level.
 */
export const getComplianceLabel = (confidence) => {
    const score = normalizeConfidence(confidence);
    if (score >= 70) return 'High_Risk_Detected';
    if (score >= 40) return 'Moderate_Risk';
    return 'Low_Risk_Safe';
};
