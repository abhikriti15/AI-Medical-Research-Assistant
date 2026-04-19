const logger = require('../config/logger');
const queryExpansionService = require('../services/queryExpansion');
const aggregationService = require('../services/retrieval/aggregationService');
const rankingPipeline = require('../services/ranking/rankingPipeline');
const ollamaService = require('../services/llm/ollamaService');
const Conversation = require('../models/Conversation');
const { v4: uuidv4 } = require('uuid');

class QueryController {
  async handleQuery(req, res) {
    const startTime = Date.now();
    const { query, disease, structuredInput, sessionId, userId } = req.body;

    let session = sessionId || uuidv4();
    let conversation;
    let expandedQuery = query; // Default to original query if expansion fails
    let papers = [];
    let trials = [];
    let totalResults = 0;
    let rankedPapers = [];
    let rankedTrials = [];
    let llmResponse = {};

    try {
      // Get or create session
      conversation = await Conversation.findOne({ sessionId: session });

      if (!conversation) {
        conversation = new Conversation({
          userId,
          sessionId: session,
          context: {
            currentDisease: disease,
          },
        });
      }

      // 1. Query Expansion (with error handling)
      try {
        const previousQueries = conversation.messages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .slice(-3);

        expandedQuery = await queryExpansionService.expandQuery(
          query,
          disease,
          previousQueries
        );
      } catch (error) {
        logger.error('Query expansion failed, using original query:', error.message);
        expandedQuery = query;
      }

      logger.info(`=== QUERY PROCESSING START ===`);
      logger.info(`Original query: "${query}"`);
      logger.info(`Disease context: "${disease}"`);
      logger.info(`Expanded query: "${expandedQuery}"`);

      // 2. Precision Retrieval (with detailed logging)
      try {
        const retrievalResults = await aggregationService.fetchAllResults(
          expandedQuery,
          disease
        );
        papers = retrievalResults.papers || [];
        trials = retrievalResults.trials || [];
        totalResults = retrievalResults.totalResults || 0;

        // Log retrieval details
        logger.info(`Retrieval results: ${papers.length} papers, ${trials.length} trials`);
        
        if (retrievalResults.metadata) {
          logger.info(`Retrieval metadata: ${JSON.stringify(retrievalResults.metadata)}`);
        }

        // Log sample papers for debugging
        if (papers.length > 0) {
          logger.info(`Sample papers retrieved:`);
          papers.slice(0, 3).forEach((paper, i) => {
            logger.info(`  ${i + 1}. ${paper.title?.substring(0, 80)}...`);
            logger.info(`     Relevance: ${paper.relevanceExplanation || 'N/A'}`);
          });
        }

        // Check for failsafe mode
        if (retrievalResults.failsafeMessage) {
          logger.warn(`Failsafe mode activated: ${retrievalResults.failsafeMessage}`);
        }
      } catch (error) {
        logger.error('Retrieval failed:', error.message);
        // Continue with empty arrays
      }

      // 3. Ranking (with error handling)
      try {
        const rankingResults = await rankingPipeline.rankResults(
          papers,
          trials,
          expandedQuery
        );
        rankedPapers = rankingResults.papers || papers.slice(0, 5); // Fallback to first 5 papers
        rankedTrials = rankingResults.trials || trials.slice(0, 3); // Fallback to first 3 trials
        
        logger.info(`Ranking complete: ${rankedPapers.length} papers, ${rankedTrials.length} trials`);
      } catch (error) {
        logger.error('Ranking failed, using unranked results:', error.message);
        rankedPapers = papers.slice(0, 5);
        rankedTrials = trials.slice(0, 3);
      }

      // 4. LLM Response Generation (with error handling built into service)
      try {
        llmResponse = await ollamaService.generateResponse(
          rankedPapers,
          rankedTrials,
          expandedQuery,
          disease
        );
        
        logger.info('LLM response generated successfully');
      } catch (error) {
        logger.error('LLM generation failed, using fallback:', error.message);
        // ollamaService already has fallback, but just in case
        llmResponse = {
          summary: `Based on research query: "${query}"\n\nFound ${rankedPapers.length} research papers and ${rankedTrials.length} clinical trials.`,
          papers: rankedPapers,
          trials: rankedTrials,
          generatedAt: new Date().toISOString(),
          fallback: true,
        };
      }

      // 5. Store in conversation
      conversation.messages.push({
        role: 'user',
        content: query,
        metadata: {
          disease,
          queryType: structuredInput ? 'structured' : 'natural',
          expandedQuery,
          responseTime: Date.now() - startTime,
        },
      });

      conversation.messages.push({
        role: 'assistant',
        content: JSON.stringify(llmResponse),
        timestamp: new Date(),
      });

      await conversation.save();

      res.json({
        sessionId: session,
        expandedQuery,
        response: llmResponse,
        metadata: {
          totalResultsFound: totalResults,
          papersUsed: rankedPapers.length,
          trialsUsed: rankedTrials.length,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Query handler error:', error.message);
      
      // Even on total failure, return something useful
      res.json({
        sessionId: session,
        expandedQuery: query,
        response: {
          summary: `Search completed for: "${query}". Found ${papers.length} papers and ${trials.length} trials.`,
          papers: papers.slice(0, 5),
          trials: trials.slice(0, 3),
          generatedAt: new Date().toISOString(),
          fallback: true,
          error: error.message,
        },
        metadata: {
          totalResultsFound: totalResults,
          papersUsed: papers.length,
          trialsUsed: trials.length,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          error: true,
        },
      });
    }
  }
}

module.exports = new QueryController();