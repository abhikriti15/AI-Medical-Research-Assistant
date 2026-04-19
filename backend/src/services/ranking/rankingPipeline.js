const logger = require('../../config/logger');
const embeddingService = require('./embeddingService');
const scoringService = require('./scoringService');

class RankingPipeline {
  async rankResults(papers, trials, query) {
    try {
      logger.info(`Ranking ${papers.length} papers and ${trials.length} trials`);

      // Score papers using fast methods only (no embeddings)
      const scoredPapers = papers.map((paper) => {
        const keywordScore = scoringService.bm25Score(query, paper);
        const credibilityScore = scoringService.credibilityScore(paper);
        const recencyScore = scoringService.recencyScore(paper.year);

        const finalScore =
          0.5 * keywordScore +
          0.3 * credibilityScore +
          0.2 * recencyScore;

        return {
          ...paper,
          scores: {
            keyword: keywordScore,
            credibility: credibilityScore,
            recency: recencyScore,
            final: finalScore,
          },
        };
      });

      // Score trials
      const scoredTrials = trials.map((trial) => {
        const keywordScore = scoringService.bm25Score(query, trial);
        const statusScore = this.getTrialStatusScore(trial.status);
        const enrollmentScore = this.getEnrollmentScore(trial.enrollmentCount);

        const finalScore = 0.4 * keywordScore + 0.3 * statusScore + 0.3 * enrollmentScore;

        return {
          ...trial,
          scores: {
            keyword: keywordScore,
            status: statusScore,
            enrollment: enrollmentScore,
            final: finalScore,
          },
        };
      });

      // Sort and select top results
      const topPapers = scoredPapers
        .sort((a, b) => b.scores.final - a.scores.final)
        .slice(0, 5);

      const topTrials = scoredTrials
        .sort((a, b) => b.scores.final - a.scores.final)
        .slice(0, 3);

      logger.info(`Selected top ${topPapers.length} papers and ${topTrials.length} trials`);

      return {
        papers: topPapers,
        trials: topTrials,
      };
    } catch (error) {
      logger.error(`Ranking pipeline error: ${error.message}`);
      // Return unranked results as fallback
      return {
        papers: papers.slice(0, 5),
        trials: trials.slice(0, 3),
      };
    }
  }

  getTrialStatusScore(status) {
    const statusScores = {
      RECRUITING: 1.0,
      ACTIVE_NOT_RECRUITING: 0.8,
      ENROLLING_BY_INVITATION: 0.7,
      NOT_YET_RECRUITING: 0.5,
      COMPLETED: 0.3,
      TERMINATED: 0.1,
      WITHDRAWN: 0.0,
    };
    return statusScores[status] || 0.5;
  }

  getEnrollmentScore(enrollmentCount) {
    if (enrollmentCount === 0) return 0.5;
    if (enrollmentCount < 50) return 0.6;
    if (enrollmentCount < 200) return 0.8;
    return 1.0;
  }
}

module.exports = new RankingPipeline();
