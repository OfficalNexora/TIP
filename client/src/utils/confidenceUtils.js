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
    const map = {
        'exemplary': 98,
        'mataas': 95,
        'compliant': 90,
        'katamtaman': 85,
        'observed': 75,
        'mababa': 60,
        'reflect': 50,
        'flagged': 20
    };

    return map[normalized] || 0;
};

/**
 * Returns a human-readable compliance label based on the confidence level.
 */
export const getComplianceLabel = (confidence) => {
    const score = normalizeConfidence(confidence);
    if (score >= 90) return 'Verified_Compliant';
    if (score >= 75) return 'Review_Required';
    return 'Action_Recommended';
};
