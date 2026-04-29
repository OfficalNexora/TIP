/**
 * snippetMatcher.js
 * 
 * Robust string search to find exact offsets (start and end index) of a target string
 * within the full document text, even if whitespace, newlines, or punctuation differ.
 * Optimized via a single-pass state class to prevent heavy React DOM frame drops.
 * Employs \p{L}\p{N} for universal UTF-8 Unicode grapheme adherence.
 */

export class DocumentMatcher {
    constructor(fullText) {
        this.fullText = fullText || "";
        this.strippedText = "";
        this.indexMap = [];

        if (this.fullText.length > 0) {
            const regex = /[\p{L}\p{N}]/u;
            for (let i = 0; i < this.fullText.length; i++) {
                let char = this.fullText[i];
                if (regex.test(char)) {
                    this.strippedText += char.toLowerCase();
                    this.indexMap.push(i);
                }
            }
        }
    }

    findBestMatch(snippet) {
        if (!snippet || !this.strippedText) return null;

        // Strip the target snippet globally
        let strippedSnippet = snippet.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        if (!strippedSnippet || strippedSnippet.length < 5) return null;

        // Priority 1: Exact stripped match
        let startIndex = this.strippedText.indexOf(strippedSnippet);
        if (startIndex !== -1) {
            return this._resolveIndices(startIndex, strippedSnippet.length);
        }

        // Fallback 1: 80% prefix match
        let prefixLen = Math.floor(strippedSnippet.length * 0.8);
        if (prefixLen > 5) {
            let prefix = strippedSnippet.substring(0, prefixLen);
            startIndex = this.strippedText.indexOf(prefix);
            if (startIndex !== -1) {
                return this._resolveIndices(startIndex, prefixLen);
            }
        }

        // Fallback 2: First 6 meaningful words match
        let words = snippet.split(/\s+/).filter(w => w.length > 0);
        if (words.length > 5) {
            let shortSnippet = words.slice(0, 6).join("").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
            if (shortSnippet.length > 5) {
                startIndex = this.strippedText.indexOf(shortSnippet);
                if (startIndex !== -1) {
                    return this._resolveIndices(startIndex, shortSnippet.length);
                }
            }
        }

        return null;
    }

    _resolveIndices(startIndex, length) {
        let originalStart = this.indexMap[startIndex];
        let originalEnd = this.indexMap[startIndex + length - 1] + 1;
        
        return {
            startIndex: originalStart,
            endIndex: originalEnd,
            matchedText: this.fullText.substring(originalStart, originalEnd)
        };
    }
}
