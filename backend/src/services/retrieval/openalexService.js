const axios = require('axios');
const logger = require('../../config/logger');
const { getCache, setCache } = require('../../config/redis');
const apiRetry = require('../../utils/apiRetry');

const OPENALEX_BASE_URL = 'https://api.openalex.org/works';

class OpenAlexService {
  parseAbstractFromInvertedIndex(abstractInvertedIndex) {
    if (!abstractInvertedIndex || typeof abstractInvertedIndex !== 'object') {
      return '';
    }

    try {
      const tokens = [];
      Object.entries(abstractInvertedIndex).forEach(([word, positions]) => {
        if (!Array.isArray(positions)) return;
        positions.forEach((position) => {
          tokens[position] = word;
        });
      });

      return tokens.filter(Boolean).join(' ').trim();
    } catch (e) {
      logger.warn(`Error parsing abstract: ${e.message}`);
      return '';
    }
  }

  async searchPapers(query, limit = 100) {
    try {
      const cacheKey = `openalex:${query}:${limit}`;
      const cached = await getCache(cacheKey);
      
      if (cached) {
        logger.info(`OpenAlex cache hit for query: ${query}`);
        return cached;
      }

      const params = {
        search: query,
        per_page: Math.min(limit, 200),
        sort: 'cited_by_count:desc',
        select: 'id,title,abstract_inverted_index,publication_year,cited_by_count,authorships,primary_location,doi,is_retracted',
      };

      const response = await apiRetry.withRetry(
        () => axios.get(OPENALEX_BASE_URL, { params, timeout: 10000 }),
        3,
        1000
      );

      const papers = (response.data.results || [])
        .filter(work => !work.is_retracted) // Filter out retracted papers
        .map(work => {
          const abstract = this.parseAbstractFromInvertedIndex(work.abstract_inverted_index);
          
          return {
            id: work.id,
            title: work.title,
            abstract: abstract || '',
            year: work.publication_year,
            citationCount: work.cited_by_count || 0,
            authors: (work.authorships || [])
              .map(a => a.author?.display_name)
              .filter(Boolean)
              .slice(0, 5),
            url: work.primary_location?.landing_page_url || work.id,
            source: 'OpenAlex',
            doi: work.doi,
          };
        })
        .filter(p => p.title && p.abstract); // Only include papers with title and abstract

      await setCache(cacheKey, papers, 86400);
      logger.info(`OpenAlex retrieved ${papers.length} papers for query: ${query}`);
      
      return papers;
    } catch (error) {
      logger.error(`OpenAlex search error: ${error.message}`);
      return [];
    }
  }

  async getPaperDetails(paperId) {
    try {
      const response = await apiRetry.withRetry(
        () => axios.get(`${OPENALEX_BASE_URL}/${paperId}`, { timeout: 5000 }),
        2,
        500
      );

      return response.data;
    } catch (error) {
      logger.error(`OpenAlex details error: ${error.message}`);
      return null;
    }
  }
}

module.exports = new OpenAlexService();
