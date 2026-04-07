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
    // RISK MODEL: 0 = Safe (Good), 100 = Risk (Bad)
    const map = {
        'exemplary': 5,
        'mataas': 5,     // High Integrity -> Low Risk (Good)
        'aligned': 15,
        'compliant': 15,
        'katamtaman': 35, // Consistent with backend 35
        'reflect': 35,
        'observed': 35,
        'mababa': 85,     // Low Integrity -> High Risk (Bad)
        'flagged': 90,
        'kritikal': 98,
        'critical': 98
    };

    return map[normalized] || 10;
};

/**
 * Returns a human-readable compliance label based on the Risk Score.
 * 0-30: Safe, 30-60: Moderate, 60-85: High, 85+: Critical
 */
export const getComplianceLabel = (confidence) => {
    const score = normalizeConfidence(confidence);
    if (score >= 85) return 'Kritikal';
    if (score >= 60) return 'Mataas na Panganib';
    if (score >= 30) return 'Kailangan ng Rebyu';
    return 'Nakatugma';
};
