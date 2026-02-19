/**
 * Smoke test: heuristicsService.analyze
 * 
 * Validates:
 * 1. Return shape has ai_probability_score, ai_risk_node, risk_breakdown, details
 * 2. details.patterns.detected_patterns is an array of {pattern, count, points, category}
 * 3. details.omissions has flagged_omissions and count
 * 4. details.style has expected metrics
 * 5. details.structure has sections_detected and predictability_score
 * 
 * Run: node scripts/test_heuristics.js
 */

const heuristicsService = require('../services/heuristicsService');

// Known AI-like text sample (triggers multiple patterns)
const AI_TEXT = `
This study aims to investigate the impact of artificial intelligence on educational outcomes.
Furthermore, it is important to note that the methodology employed in this research 
utilizes a comprehensive framework for analyzing data across multiple dimensions.
The results demonstrate that there is a significant correlation between technology adoption
and student performance. Moreover, it should be noted that this phenomenon has been 
extensively documented in prior literature. In conclusion, the findings suggest that
further research is needed to fully understand the implications of these developments.
The researchers utilized a mixed-methods approach combining both quantitative and qualitative
analysis to ensure the robustness of the findings. It is worth mentioning that the study
was conducted in accordance with established ethical guidelines and protocols.
`;

function assert(condition, message) {
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        process.exitCode = 1;
    } else {
        console.log(`  PASS: ${message}`);
    }
}

console.log('=== Heuristics Service Smoke Test ===\n');

const result = heuristicsService.analyze(AI_TEXT);

// Top-level shape
assert(result !== null, 'analyze() returns non-null');
assert(typeof result.ai_probability_score === 'number', 'ai_probability_score is a number');
assert(result.ai_probability_score >= 0 && result.ai_probability_score <= 100, 'ai_probability_score in 0-100 range');
assert(['Mababa', 'Katamtaman', 'Mataas'].includes(result.ai_risk_node), 'ai_risk_node is valid Likert value');
assert(typeof result.risk_breakdown === 'object', 'risk_breakdown is an object');

// Risk breakdown has all 5 dimensions
const breakdown = result.risk_breakdown;
assert(typeof breakdown.typography === 'number', 'risk_breakdown.typography is a number');
assert(typeof breakdown.patterns === 'number', 'risk_breakdown.patterns is a number');
assert(typeof breakdown.omissions === 'number', 'risk_breakdown.omissions is a number');
assert(typeof breakdown.style === 'number', 'risk_breakdown.style is a number');
assert(typeof breakdown.structure === 'number', 'risk_breakdown.structure is a number');

// Details shape
assert(typeof result.details === 'object', 'details is an object');

// Patterns
const patterns = result.details.patterns;
assert(Array.isArray(patterns.detected_patterns), 'detected_patterns is an array');
if (patterns.detected_patterns.length > 0) {
    const first = patterns.detected_patterns[0];
    assert(typeof first.pattern === 'string', 'pattern item has .pattern string');
    assert(typeof first.count === 'number', 'pattern item has .count number');
    assert(typeof first.points === 'number', 'pattern item has .points number');
    assert(typeof first.category === 'string', 'pattern item has .category string');
}

// Omissions
const omissions = result.details.omissions;
assert(typeof omissions.count === 'number', 'omissions.count is a number');
assert(Array.isArray(omissions.flagged_omissions), 'omissions.flagged_omissions is an array');

// Style
const style = result.details.style;
assert(typeof style.passive_voice_pct === 'number', 'style.passive_voice_pct is a number');
assert(typeof style.hedging_density === 'number', 'style.hedging_density is a number');

// Structure
const structure = result.details.structure;
assert(Array.isArray(structure.sections_detected), 'structure.sections_detected is an array');
assert(typeof structure.predictability_score === 'number', 'structure.predictability_score is a number');

// AI Usage derivation test
function deriveAiUsage(score) {
    if (score >= 60) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
}

const aiUsage = deriveAiUsage(result.ai_probability_score);
assert(['Low', 'Moderate', 'High'].includes(aiUsage), `ai_usage derived correctly: "${aiUsage}" for score ${result.ai_probability_score}`);

console.log(`\n--- Summary ---`);
console.log(`AI Probability Score: ${result.ai_probability_score}`);
console.log(`AI Risk Node: ${result.ai_risk_node}`);
console.log(`Derived AI Usage: ${aiUsage}`);
console.log(`Pattern Hits: ${patterns.detected_patterns.length}`);
console.log(`Omission Count: ${omissions.count}`);
console.log('================\n');
