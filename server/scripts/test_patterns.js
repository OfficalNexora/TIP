/**
 * Test: Heuristics Pattern Detection (Refined)
 * 
 * Validates that the newly added high-probability AI patterns are detected.
 * 
 * Run: node scripts/test_patterns.js
 */

const heuristicsService = require('../services/heuristicsService');

// Text loaded with new "Batch 4" patterns
const AI_SAMPLE = `
This project stands as a testament to the unwavering commitment of our team.
It represents a game-changer in the digital landscape, offering a myriad of solutions.
By delving deeper into the rich tapestry of data, we can unlock the potential of AI.
This multifaceted approach underscores the importance of fostering innovation.
It heralds a new era where we are poised to leverage these tools.
`;

function assert(condition, message) {
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        process.exitCode = 1;
    } else {
        console.log(`  PASS: ${message}`);
    }
}

console.log('=== Pattern Refinement Test ===\n');

const result = heuristicsService.analyze(AI_SAMPLE);

// Check if patterns were detected
const hits = result.details.patterns.detected_patterns;
console.log(`Detected ${hits.length} patterns:`);
hits.forEach(h => console.log(` - "${h.pattern}" (Weight: ${h.points})`));

// Validation
assert(hits.some(h => h.pattern === 'stands as a testament'), 'Detected "stands as a testament"');
assert(hits.some(h => h.pattern === 'rich tapestry'), 'Detected "rich tapestry"');
assert(hits.some(h => h.pattern === 'game-changer'), 'Detected "game-changer"');
assert(hits.some(h => h.pattern === 'delving deeper'), 'Detected "delving deeper"');
assert(hits.some(h => h.pattern === 'multifaceted'), 'Detected "multifaceted"');

// Check Pattern Hit Count
console.log(`\nAI Probability Score: ${result.ai_probability_score}`);
// For short texts, score is dominated by patterns (max 25 pts) + style.
// We just want to ensure we caught the patterns.
assert(hits.length >= 5, 'Detected at least 5 AI patterns');

console.log('\n================\n');
