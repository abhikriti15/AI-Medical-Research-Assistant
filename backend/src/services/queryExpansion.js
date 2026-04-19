const { ollamaClient } = require('../config/ollama');
const logger = require('../config/logger');

class QueryExpansionService {
  async expandQuery(userQuery, diseaseContext = null, conversationHistory = []) {
    const baseExpandedQuery = this.buildMedicalQuery(userQuery, diseaseContext);
    console.log('Expanded Query:', baseExpandedQuery);

    try {
      const contextString = diseaseContext 
        ? `Medical context: Patient is concerned about ${diseaseContext}.`
        : '';

      const historyString = conversationHistory.length > 0
        ? `Previous discussion: ${conversationHistory.slice(-3).join(' | ')}`
        : '';

      const prompt = `
You are a medical query expansion expert. Your task is to take a user's query and expand it with relevant medical terminology and context.

${contextString}
${historyString}

User Query: "${userQuery}"
Required base terms: "${baseExpandedQuery}"

Provide ONLY a compact search query (no explanation), include the required base terms, and keep it medical-focused for academic paper search.
      `.trim();

      const response = await ollamaClient.post('/api/generate', {
        model: process.env.LLM_MODEL || 'mistral',
        prompt,
        stream: false,
        temperature: 0.3,
      });

      const llmQuery = response.data.response.trim();
      const expandedQuery = this.mergeMedicalTerms(baseExpandedQuery, llmQuery);
      logger.info(`Query expanded: "${userQuery}" → "${expandedQuery}"`);
      console.log('Expanded Query:', expandedQuery);
      return expandedQuery;
    } catch (error) {
      logger.error('Query expansion failed:', error.message);
      return baseExpandedQuery;
    }
  }

  buildMedicalQuery(userQuery, diseaseContext) {
    const disease = (diseaseContext || '').trim();
    const query = (userQuery || '').trim();
    return `${disease} ${query} treatment clinical trial therapy medicine`
      .replace(/\s+/g, ' ')
      .trim();
  }

  mergeMedicalTerms(baseExpandedQuery, llmQuery) {
    const combined = `${baseExpandedQuery} ${llmQuery || ''}`.toLowerCase();
    const requiredTerms = ['treatment', 'clinical', 'trial', 'therapy', 'medicine'];

    const normalized = requiredTerms.reduce((acc, term) => {
      return acc.includes(term) ? acc : `${acc} ${term}`;
    }, combined);

    return normalized.replace(/\s+/g, ' ').trim();
  }
}

module.exports = new QueryExpansionService();