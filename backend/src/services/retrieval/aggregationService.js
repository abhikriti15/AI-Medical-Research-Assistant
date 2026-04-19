const logger = require('../../config/logger');
const openalexService = require('./openalexService');
const pubmedService = require('./pubmedService');
const clinicalTrialsService = require('./clinicalTrialsService');
const PrecisionRetrievalService = require('./precisionRetrievalService');
const PQueue = require('p-queue').default;

class AggregationService {
  constructor() {
    // Create precision service instance
    this.precisionService = new PrecisionRetrievalService(this);
  }

  async fetchAllResults(expandedQuery, disease) {
    // Try precision retrieval first
    try {
      logger.info(`Attempting precision retrieval for "${disease}"`);
      const precisionResults = await this.precisionService.retrievePreciseResults(
        expandedQuery, 
        disease
      );

      return {
        papers: precisionResults.papers,
        trials: precisionResults.trials,
        totalResults: precisionResults.papers.length + precisionResults.trials.length,
        metadata: precisionResults.metadata,
        failsafeMessage: precisionResults.failsafeMessage
      };
    } catch (error) {
      logger.error(`Precision retrieval failed, falling back to basic: ${error.message}`);
      return this.fetchAllResultsBasic(expandedQuery, disease);
    }
  }

  async fetchAllResultsBasic(expandedQuery, disease) {
    const queue = new PQueue({ concurrency: 3, timeout: 35000 });

    const promises = [
      queue.add(() => {
        logger.info('Fetching from OpenAlex...');
        return openalexService.searchPapers(expandedQuery, 100);
      }),
      queue.add(() => {
        logger.info('Fetching from PubMed...');
        return pubmedService.searchPapers(expandedQuery, 100);
      }),
      queue.add(() => {
        logger.info('Fetching from ClinicalTrials.gov...');
        return clinicalTrialsService.searchTrials(disease, 100);
      }),
    ];

    const [openalexResults, pubmedResults, trialsResults] = await Promise.allSettled(promises);

    const pubmedPapers = pubmedResults.status === 'fulfilled' ? pubmedResults.value : [];
    const openalexPapers = openalexResults.status === 'fulfilled' ? openalexResults.value : [];
    const papers = [...pubmedPapers, ...openalexPapers];

    const trials = trialsResults.status === 'fulfilled' ? trialsResults.value : [];

    logger.info(`Raw results: ${pubmedPapers.length} PubMed, ${openalexPapers.length} OpenAlex, ${trials.length} trials`);

    // Remove duplicates
    const uniquePapers = this.removeDuplicates(papers, 'title');
    
    // Apply relevance filters (less strict)
    const filteredPapers = this.filterRelevantMedicalPapers(uniquePapers, disease);
    
    logger.info(`Aggregated results: ${filteredPapers.length} papers, ${trials.length} trials`);

    return {
      papers: filteredPapers,
      trials,
      totalResults: filteredPapers.length + trials.length,
    };
  }

  removeDuplicates(items, key) {
    const seen = new Set();
    return items.filter(item => {
      const value = item[key]?.toLowerCase().trim();
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  filterRelevantMedicalPapers(papers, disease) {
    const currentYear = new Date().getFullYear();
    const diseaseTerm = (disease || '').toLowerCase().trim();
    
    // Less strict filtering - focus on medical relevance
    const scored = papers
      .filter((paper) => {
        const title = (paper.title || '').toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const text = `${title} ${abstract}`;
        const year = Number(paper.year);

        // Basic validation
        if (!title.trim() || title.length < 10) return false;
        if (!Number.isFinite(year) || year < 2010 || year > currentYear) return false;

        // Must have some medical relevance
        const medicalKeywords = ['treatment', 'therapy', 'drug', 'clinical', 'trial', 'patient', 'disease', 'diagnosis', 'medical', 'health', 'syndrome', 'disorder', 'condition', 'study', 'research'];
        const hasMedicalKeyword = medicalKeywords.some(term => text.includes(term));
        
        if (!hasMedicalKeyword) return false;

        // If disease specified, prefer papers mentioning it
        if (diseaseTerm && diseaseTerm.length > 2) {
          const diseaseInTitle = title.includes(diseaseTerm);
          const diseaseInAbstract = abstract.includes(diseaseTerm);
          return diseaseInTitle || diseaseInAbstract || hasMedicalKeyword;
        }

        return true;
      })
      .map((paper) => {
        const title = (paper.title || '').toLowerCase();
        const abstract = (paper.abstract || '').toLowerCase();
        const text = `${title} ${abstract}`;
        
        let score = 0;

        // Disease relevance
        if (diseaseTerm && diseaseTerm.length > 2) {
          if (title.includes(diseaseTerm)) score += 5;
          if (abstract.includes(diseaseTerm)) score += 3;
        }

        // Treatment/therapy relevance
        const treatmentKeywords = ['treatment', 'therapy', 'drug', 'medication', 'intervention', 'cure', 'management'];
        if (treatmentKeywords.some(term => text.includes(term))) score += 3;

        // Clinical relevance
        if (text.includes('clinical') || text.includes('trial') || text.includes('patient')) score += 2;

        // Source boost
        if (paper.source === 'PubMed') score += 2;

        // Citation boost
        if (paper.citationCount > 100) score += 2;
        else if (paper.citationCount > 50) score += 1;

        // Recency boost
        const age = new Date().getFullYear() - paper.year;
        if (age <= 2) score += 2;
        else if (age <= 5) score += 1;

        // Abstract quality
        if (abstract.length > 200) score += 1;

        return {
          ...paper,
          retrievalScore: score,
        };
      })
      .sort((a, b) => b.retrievalScore - a.retrievalScore);

    return scored;
  }
}

module.exports = new AggregationService();