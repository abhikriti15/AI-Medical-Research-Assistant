const logger = require('../../config/logger');
const ollamaService = require('../llm/ollamaService');

class LLMReranker {
  /**
   * Rerank top results using LLM for strict relevance
   * @param {Array} papers - Top papers from hybrid scoring
   * @param {string} query - Original query
   * @param {string} disease - Core disease term
   * @returns {Array} Reranked papers
   */
  async rerankPapers(papers, query, disease) {
    if (papers.length <= 5) {
      logger.info('Skipping LLM reranking - fewer than 5 papers');
      return papers;
    }

    logger.info(`LLM reranking ${papers.length} papers for disease: "${disease}"`);

    try {
      // Prepare context for LLM
      const papersContext = papers.slice(0, 20).map((paper, index) => ({
        id: index + 1,
        title: paper.title,
        abstract: paper.abstract?.substring(0, 300) || '',
        year: paper.year,
        source: paper.source
      }));

      const prompt = this.createRerankingPrompt(query, disease, papersContext);
      
      const llmResponse = await ollamaService.rerankWithLLM(prompt);
      
      if (!llmResponse || !llmResponse.rankedIds) {
        logger.warn('LLM reranking failed or returned no ranking');
        return papers.slice(0, 5); // Return top 5 as fallback
      }

      // Map LLM ranking back to papers
      const rankedPapers = this.applyLLMRanking(papers, llmResponse.rankedIds);
      
      logger.info(`LLM reranking complete: ${rankedPapers.length} papers`);
      return rankedPapers;
      
    } catch (error) {
      logger.error(`LLM reranking error: ${error.message}`);
      return papers.slice(0, 5); // Return top 5 as fallback
    }
  }

  /**
   * Create prompt for LLM reranking
   * @param {string} query - Original query
   * @param {string} disease - Core disease term
   * @param {Array} papersContext - Paper context
   * @returns {string} LLM prompt
   */
  createRerankingPrompt(query, disease, papersContext) {
    return `You are a medical research expert. Rank the following research papers STRICTLY based on relevance to "${disease} treatment".

QUERY: "${query}"
DISEASE: "${disease}"

CRITICAL RULES:
1. ONLY include papers that are DIRECTLY about "${disease}"
2. EXCLUDE papers about other medical conditions (cancer, ovarian, cardiac, etc.) unless they specifically mention "${disease}"
3. PRIORITIZE papers with "${disease}" in the title
4. PRIORITIZE clinical trials and treatment studies

PAPERS TO RANK:
${papersContext.map(p => `
[${p.id}] ${p.title} (${p.year}, ${p.source})
Abstract: ${p.abstract}
`).join('\n')}

INSTRUCTIONS:
1. Review each paper for direct relevance to "${disease}"
2. Assign a relevance score from 1-10 (10 = most relevant)
3. Return ONLY the IDs of the top 5 most relevant papers in order
4. Format: "TOP_5: 3,7,1,9,2"

OUTPUT FORMAT:
TOP_5: [comma-separated IDs in order of relevance]`;
  }

  /**
   * Apply LLM ranking to papers
   * @param {Array} papers - Original papers
   * @param {Array} rankedIds - LLM-ranked IDs (1-indexed)
   * @returns {Array} Reranked papers
   */
  applyLLMRanking(papers, rankedIds) {
    if (!rankedIds || !Array.isArray(rankedIds) || rankedIds.length === 0) {
      return papers.slice(0, 5);
    }

    // Convert 1-indexed IDs to array indices
    const paperIndices = rankedIds.map(id => id - 1).filter(idx => idx >= 0 && idx < papers.length);
    
    // Get papers in LLM order
    const llmRankedPapers = paperIndices.map(idx => ({
      ...papers[idx],
      llmRanked: true,
      llmRank: paperIndices.indexOf(idx) + 1
    }));

    // Fill remaining slots with original ranking if needed
    if (llmRankedPapers.length < 5) {
      const remainingIndices = Array.from({ length: papers.length }, (_, i) => i)
        .filter(idx => !paperIndices.includes(idx))
        .slice(0, 5 - llmRankedPapers.length);
      
      const remainingPapers = remainingIndices.map(idx => papers[idx]);
      llmRankedPapers.push(...remainingPapers);
    }

    return llmRankedPapers.slice(0, 5);
  }

  /**
   * Generate relevance explanation for each paper
   * @param {Array} papers - Reranked papers
   * @param {string} disease - Core disease term
   * @returns {Array} Papers with relevance explanations
   */
  addRelevanceExplanations(papers, disease) {
    return papers.map((paper, index) => {
      const title = (paper.title || '').toLowerCase();
      const abstract = (paper.abstract || '').toLowerCase();
      const diseaseLower = disease.toLowerCase();

      let relevanceReason = '';

      if (title.includes(diseaseLower)) {
        relevanceReason = `Directly addresses ${disease} in the title`;
      } else if (abstract.includes(diseaseLower)) {
        relevanceReason = `Focuses on ${disease} in the abstract`;
      } else if (title.includes('treatment') || title.includes('therapy')) {
        relevanceReason = `Discusses treatment approaches relevant to ${disease}`;
      } else if (abstract.includes('clinical trial')) {
        relevanceReason = `Clinical trial relevant to ${disease}`;
      } else {
        relevanceReason = `Related research on ${disease}`;
      }

      return {
        ...paper,
        relevanceExplanation: relevanceReason,
        displayRank: index + 1
      };
    });
  }
}

module.exports = new LLMReranker();