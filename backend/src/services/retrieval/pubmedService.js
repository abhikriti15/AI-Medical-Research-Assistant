const axios = require('axios');
const logger = require('../../config/logger');
const { getCache, setCache } = require('../../config/redis');
const apiRetry = require('../../utils/apiRetry');

const PUBMED_SEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

class PubMedService {
  async searchPapers(query, limit = 100) {
    try {
      const cacheKey = `pubmed:${query}:${limit}`;
      const cached = await getCache(cacheKey);
      
      if (cached) {
        logger.info(`PubMed cache hit for query: ${query}`);
        return cached;
      }

      // Step 1: Search for paper IDs
      const searchParams = {
        db: 'pubmed',
        term: query,
        retmax: Math.min(limit, 200),
        rettype: 'json',
        sort: 'relevance',
      };

      const searchResponse = await apiRetry.withRetry(
        () => axios.get(PUBMED_SEARCH_URL, { params: searchParams, timeout: 10000 }),
        3,
        1000
      );

      const pmids = searchResponse.data.esearchresult?.idlist || [];
      
      if (pmids.length === 0) {
        logger.info(`PubMed found no papers for query: ${query}`);
        return [];
      }

      // Step 2: Fetch full paper details with abstracts
      const fetchParams = {
        db: 'pubmed',
        id: pmids.slice(0, 100).join(','),
        rettype: 'abstract',
        retmode: 'json',
      };

      const fetchResponse = await apiRetry.withRetry(
        () => axios.get(PUBMED_FETCH_URL, { params: fetchParams, timeout: 15000 }),
        3,
        1000
      );

      const papers = (fetchResponse.data.result?.uids || [])
        .map(uid => {
          const article = fetchResponse.data.result[uid];
          if (!article) return null;

          const title = article.title || '';
          const abstract = article.abstract || '';
          const year = parseInt(article.pubdate?.split(' ')[0]) || new Date().getFullYear();
          const authors = article.authors ? article.authors.map(a => a.name || a.Author).filter(Boolean) : [];

          return {
            id: article.uid,
            title,
            abstract,
            year,
            citationCount: 0,
            authors,
            url: `https://pubmed.ncbi.nlm.nih.gov/${article.uid}/`,
            source: 'PubMed',
            doi: article.doi || '',
          };
        })
        .filter(p => p && p.title && p.abstract);

      await setCache(cacheKey, papers, 86400);
      logger.info(`PubMed retrieved ${papers.length} papers for query: ${query}`);
      
      return papers;
    } catch (error) {
      logger.error(`PubMed search error: ${error.message}`);
      return [];
    }
  }
}

module.exports = new PubMedService();
