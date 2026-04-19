const logger = require('../../config/logger');
const queryNormalizer = require('./queryNormalizer');
const strictFilter = require('./strictFilter');
const hybridScorer = require('./hybridScorer');
const llmReranker = require('./llmReranker');

class PrecisionRetrievalService {
  constructor(basicRetrievalService) {
    this.basicRetrievalService = basicRetrievalService;
  }

  /**
   * Main pipeline for precise medical research retrieval
   * @param {string} query - User query
   * @param {string} disease - Original disease context
   * @returns {Object} Filtered and ranked results
   */
  async retrievePreciseResults(query, disease) {
    logger.info(`=== PRECISION RETRIEVAL PIPELINE START ===`);
    logger.info(`Query: "${query}"`);
    logger.info(`Disease context: "${disease}"`);

    // Step 1: Query normalization
    const normalizedDisease = queryNormalizer.extractDiseaseTerm(query) || disease;
    const enhancedQuery = queryNormalizer.createEnhancedQuery(query, normalizedDisease);
    const domainKeywords = queryNormalizer.getDomainKeywords(normalizedDisease);

    logger.info(`Normalized disease: "${normalizedDisease}"`);
    logger.info(`Enhanced query: "${enhancedQuery}"`);
    logger.info(`Domain keywords: ${JSON.stringify(domainKeywords)}`);

    // Step 2: Fetch raw results using basic service
    const rawResults = await this.basicRetrievalService.fetchAllResultsBasic(enhancedQuery, normalizedDisease);
    
    logger.info(`Raw retrieval: ${rawResults.papers.length} papers, ${rawResults.trials.length} trials`);

    // Step 3: Strict filtering
    const filteredPapers = strictFilter.filterPapers(
      rawResults.papers, 
      normalizedDisease, 
      domainKeywords
    );
    
    const filteredTrials = strictFilter.filterTrials(
      rawResults.trials, 
      normalizedDisease, 
      domainKeywords
    );

    logger.info(`After strict filtering: ${filteredPapers.length} papers, ${filteredTrials.length} trials`);

    // Step 4: Check if we have enough relevant results
    if (filteredPapers.length < 3) {
      logger.warn(`Insufficient relevant papers (${filteredPapers.length}) for "${normalizedDisease}"`);
      
      return this.generateFailsafeResponse(query, normalizedDisease, filteredPapers, filteredTrials);
    }

    // Step 5: Hybrid scoring
    const scoredPapers = hybridScorer.scoreAndRankPapers(
      filteredPapers, 
      query, 
      normalizedDisease
    );
    
    const scoredTrials = hybridScorer.scoreAndRankTrials(
      filteredTrials, 
      query, 
      normalizedDisease
    );

    // Step 6: LLM reranking (for papers only)
    const topPapersForReranking = scoredPapers.slice(0, 20);
    const rerankedPapers = await llmReranker.rerankPapers(
      topPapersForReranking, 
      query, 
      normalizedDisease
    );

    // Step 7: Add relevance explanations
    const finalPapers = llmReranker.addRelevanceExplanations(
      rerankedPapers, 
      normalizedDisease
    );

    // Step 8: Prepare final results
    const finalResults = {
      papers: finalPapers.slice(0, 5),
      trials: scoredTrials.slice(0, 3),
      metadata: {
        originalQuery: query,
        normalizedDisease: normalizedDisease,
        totalPapersRetrieved: rawResults.papers.length,
        totalTrialsRetrieved: rawResults.trials.length,
        papersAfterFiltering: filteredPapers.length,
        trialsAfterFiltering: filteredTrials.length,
        retrievalPipeline: 'precision',
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`=== PRECISION RETRIEVAL PIPELINE COMPLETE ===`);
    logger.info(`Final results: ${finalResults.papers.length} papers, ${finalResults.trials.length} trials`);
    
    return finalResults;
  }

  /**
   * Generate failsafe response when insufficient relevant results
   * @param {string} query - Original query
   * @param {string} disease - Normalized disease
   * @param {Array} filteredPapers - Filtered papers
   * @param {Array} filteredTrials - Filtered trials
   * @returns {Object} Failsafe response
   */
  generateFailsafeResponse(query, disease, filteredPapers, filteredTrials) {
    logger.warn(`Generating failsafe response for "${disease}"`);

    const message = `No highly relevant research found for "${disease}". 

We searched for "${disease}" but found only ${filteredPapers.length} relevant papers and ${filteredTrials.length} clinical trials.

Suggestions:
1. Try a more specific query (e.g., "${disease} treatment options" instead of just "${disease}")
2. Check the spelling of "${disease}"
3. Try related terms or synonyms
4. This condition may have limited published research`;

    return {
      papers: filteredPapers.slice(0, 3),
      trials: filteredTrials.slice(0, 2),
      metadata: {
        originalQuery: query,
        normalizedDisease: disease,
        totalPapersRetrieved: filteredPapers.length,
        totalTrialsRetrieved: filteredTrials.length,
        papersAfterFiltering: filteredPapers.length,
        trialsAfterFiltering: filteredTrials.length,
        retrievalPipeline: 'precision-failsafe',
        failsafe: true,
        failsafeMessage: message,
        timestamp: new Date().toISOString()
      },
      failsafeMessage: message
    };
  }
}

module.exports = PrecisionRetrievalService;