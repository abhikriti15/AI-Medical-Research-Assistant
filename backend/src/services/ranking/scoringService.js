const bm25 = require('../../utils/bm25');
const logger = require('../../config/logger');

class ScoringService {
  constructor() {
    this.bm25Instance = new bm25.BM25();
  }

  bm25Score(query, document) {
    try {
      const text = `${document.title || ''} ${document.abstract || ''}`.toLowerCase();
      const queryTerms = query.toLowerCase().split(/\s+/);
      const docTerms = text.split(/\s+/);

      let score = 0;
      for (const term of queryTerms) {
        const termCount = docTerms.filter(t => t.includes(term)).length;
        score += termCount > 0 ? 1 : 0;
      }

      // Normalize to 0-1 range
      return Math.min(score / queryTerms.length, 1.0);
    } catch (error) {
      logger.error(`BM25 scoring error: ${error.message}`);
      return 0.5;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  credibilityScore(paper) {
    let score = 0.5; // Base score

    // Source boost
    if (paper.source === 'PubMed') {
      score += 0.3;
    } else if (paper.source === 'OpenAlex') {
      score += 0.2;
    }

    // Citation count boost
    if (paper.citationCount > 100) {
      score += 0.2;
    } else if (paper.citationCount > 50) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  recencyScore(year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 1) return 1.0;
    if (age <= 2) return 0.9;
    if (age <= 3) return 0.8;
    if (age <= 5) return 0.6;
    if (age <= 10) return 0.4;
    return 0.2;
  }
}

module.exports = new ScoringService();
