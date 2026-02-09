// Demo web plagiarism checker (stubbed). Replace with real API integration later.
const DEMO = process.env.DEMO_PLAGIARISM !== 'false';

class PlagiarismWebService {
    async check(text, analysisId) {
        if (!DEMO) return { enabled: false };
        const hash = this.hashText(text);
        // Canned demo data with deterministic pseudo-random based on hash
        const score = (hash % 35) + 15; // 15-49% similarity for demo visuals
        const sources = [
            {
                url: 'https://example.edu/research/related-study',
                title: 'Related Study on Topic X',
                snippet: '... recent years there has been a growing interest in ...',
                similarity: Math.min(30 + (hash % 10), 60)
            },
            {
                url: 'https://journals.example.com/article/123',
                title: 'Journal Article 123',
                snippet: '... methodology indicates a mixed-method approach was employed ...',
                similarity: Math.min(20 + (hash % 15), 50)
            }
        ];
        return {
            enabled: true,
            similarity: score / 100,
            sources,
            matched_count: sources.length,
            note: 'Demo mode: replace with real web plagiarism API results.'
        };
    }

    hashText(text = '') {
        let h = 0;
        for (let i = 0; i < text.length; i++) {
            h = (h * 31 + text.charCodeAt(i)) >>> 0;
        }
        return h;
    }
}

module.exports = new PlagiarismWebService();
