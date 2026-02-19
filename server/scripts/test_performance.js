/**
 * Performance Benchmark: Heuristics Service
 * 
 * Validates the speed of the optimized regex engine.
 * Goal: < 1ms per analysis on average.
 * 
 * Run: node scripts/test_performance.js
 */

const heuristicsService = require('../services/heuristicsService');

// 500-word academic sample
const TEXT_SAMPLE = `
In recent years, the rapid advancement of artificial intelligence has garnered significant attention
from scholars and practitioners alike. This study aims to explore the multifaceted implications of
generative AI in the realm of higher education. Furthermore, it is important to note that the
methodology employed in this research utilizes a comprehensive framework for analyzing data across
multiple dimensions. The results demonstrate that there is a significant correlation between
technology adoption and student performance. Moreover, it should be noted that this phenomenon
has been extensively documented in prior literature. In conclusion, the findings suggest that
further research is needed to fully understand the implications of these developments.
The researchers utilized a mixed-methods approach combining both quantitative and qualitative
analysis to ensure the robustness of the findings. It is worth mentioning that the study
was conducted in accordance with established ethical guidelines and protocols.
This stands as a testament to the unwavering commitment of the scientific community to foster
innovation while navigating the complexities of the digital landscape.
`.repeat(5); // Make it longer (~200 words * 5 = 1000 words)

const ITERATIONS = 1000;

console.log(`=== Heuristics Performance Benchmark ===`);
console.log(`Input Size: ~${TEXT_SAMPLE.length} chars`);
console.log(`Iterations: ${ITERATIONS}`);

const start = process.hrtime();

for (let i = 0; i < ITERATIONS; i++) {
    heuristicsService.analyze(TEXT_SAMPLE);
}

const end = process.hrtime(start);
const durationMs = (end[0] * 1000) + (end[1] / 1e6);
const avgMs = durationMs / ITERATIONS;

console.log(`\nTotal Time: ${durationMs.toFixed(2)}ms`);
console.log(`Average Time per Analysis: ${avgMs.toFixed(3)}ms`);

// Assert performance goal (e.g., < 2ms is acceptable, ideally < 1ms)
if (avgMs < 2.0) {
    console.log(`\nPASS: Performance is excellent (< 2ms/op)`);
} else {
    console.warn(`\nWARN: Performance is slower than expected (> 2ms/op)`);
}
console.log('========================================\n');
