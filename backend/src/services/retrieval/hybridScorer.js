const logger = require('../../config/logger');
const scoringService = require('../ranking/scoringService');

class HybridScorer {
  /**
   * Calculate hybrid score combining keyword and embedding similarity
   * @param {Object} document - Paper or trial
   * @param {string} query - Original query
   * @param {string} disease - Core disease term
   * @returns {Object} Scores and final score
   */
  calculateScores(document, query, disease) {
    const title = (document.title || '').toLowerCase();
    const abstract = (document.abstract || document.description || '').toLowerCase();
    const text = `${title} ${abstract}`;
    const diseaseLower = disease.toLowerCase();

    // 1. Keyword score (BM25)
    const keywordScore = scoringService.bm25Score(query, document);

    // 2. Disease relevance score
    let diseaseScore = 0;
    if (title.includes(diseaseLower)) {
      diseaseScore += 0.6; // Disease in title
    }
    if (abstract.includes(diseaseLower)) {
      diseaseScore += 0.4; // Disease in abstract
    }

    // 3. Treatment relevance
    let treatmentScore = 0;
    const treatmentKeywords = ['treatment', 'therapy', 'drug', 'medication', 'intervention'];
    if (treatmentKeywords.some(term => text.includes(term))) {
      treatmentScore = 0.3;
    }

    // 4. Clinical relevance
    let clinicalScore = 0;
    if (text.includes('clinical trial') || text.includes('randomized') || 
        text.includes('controlled study')) {
      clinicalScore = 0.2;
    }

    // 5. Source credibility
    let sourceScore = 0;
    if (document.source === 'PubMed') {
      sourceScore = 0.1;
    }

    // 6. Recency score
    const recencyScore = scoringService.recencyScore(document.year || new Date().getFullYear());

    // Final hybrid score (weighted combination)
    const finalScore = (
      0.4 * keywordScore +      // Keyword matching
      0.3 * diseaseScore +      // Disease relevance
      0.1 * treatmentScore +    // Treatment focus
      0.1 * clinicalScore +     // Clinical relevance
      0.05 * sourceScore +      // Source credibility
      0.05 * recencyScore       // Recency
    );

    logger.debug(`Hybrid scoring for "${document.title?.substring(0, 50)}...":`);
    logger.debug(`  Keyword: ${keywordScore.toFixed(3)}, Disease: ${diseaseScore.toFixed(3)}`);
    logger.debug(`  Treatment: ${treatmentScore.toFixed(3)}, Clinical: ${clinicalScore.toFixed(3)}`);
    logger.debug(`  Source: ${sourceScore.toFixed(3)}, Recency: ${recencyScore.toFixed(3)}`);
    logger.debug(`  Final: ${finalScore.toFixed(3)}`);

    return {
      keywordScore,
      diseaseScore,
      treatmentScore,
      clinicalScore,
      sourceScore,
      recencyScore,
      finalScore
    };
  }

  /**
   * Score and rank papers using hybrid approach
   * @param {Array} papers - Filtered papers
   * @param {string} query - Original query
   * @param {string} disease - Core disease term
   * @returns {Array} Scored and ranked papers
   */
  scoreAndRankPapers(papers, query, disease) {
    logger.info(`Hybrid scoring ${papers.length} papers`);

    const scoredPapers = papers.map((paper) => {
      const scores = this.calculateScores(paper, query, disease);
      
      return {
        ...paper,
        hybridScores: scores,
        finalHybridScore: scores.finalScore
      };
    });

    // Sort by hybrid score
    const rankedPapers = scoredPapers.sort((a, b) => 
      b.finalHybridScore - a.finalHybridScore
    );

    logger.info(`Top paper score: ${rankedPapers[0]?.finalHybridScore?.toFixed(3) || 0}`);
    return rankedPapers;
  }

  /**
   * Score and rank trials using hybrid approach
   * @param {Array} trials - Filtered trials
   * @param {string} query - Original query
   * @param {string} disease - Core disease term
   * @returns {Array} Scored and ranked trials
   */
  scoreAndRankTrials(trials, query, disease) {
    logger.info(`Hybrid scoring ${trials.length} trials`);

    const scoredTrials = trials.map((trial) => {
      const scores = this.calculateScores(trial, query, disease);
      
      // Additional trial-specific scoring
      let trialSpecificScore = 0;
      const status = (trial.status || '').toUpperCase();
      
      if (status === 'RECRUITING') {
        trialSpecificScore += 0.3;
      } else if (status === 'ACTIVE_NOT_RECRUITING') {
        trialSpecificScore += 0.2;
      }

      if (trial.enrollmentCount > 100) {
        trialSpecificScore += 0.1;
      }

      const finalScore = scores.finalScore + trialSpecificScore;

      return {
        ...trial,
        hybridScores: { ...scores, trialSpecificScore },
        finalHybridScore: finalScore
      };
    });

    // Sort by hybrid score
    const rankedTrials = scoredTrials.sort((a, b) => 
      b.finalHybridScore - a.finalHybridScore
    );

    logger.info(`Top trial score: ${rankedTrials[0]?.finalHybridScore?.toFixed(3) || 0}`);
    return rankedTrials;
  }
}

module.exports = new HybridScorer();