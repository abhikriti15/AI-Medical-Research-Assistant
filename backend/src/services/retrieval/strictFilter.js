const logger = require('../../config/logger');

class StrictFilter {
  /**
   * Apply strict disease-specific filtering
   * @param {Array} papers - Raw papers
   * @param {string} disease - Core disease term
   * @param {Object} domainKeywords - Whitelist and blacklist
   * @returns {Array} Filtered papers
   */
  filterPapers(papers, disease, domainKeywords) {
    logger.info(`Strict filtering: ${papers.length} papers, disease: "${disease}"`);
    
    if (!disease || disease.length < 3) {
      logger.warn('Disease term too short, skipping strict filter');
      return papers;
    }

    const diseaseLower = disease.toLowerCase();
    const { whitelist, blacklist } = domainKeywords;
    const whitelistLower = whitelist.map(w => w.toLowerCase());
    const blacklistLower = blacklist.map(b => b.toLowerCase());

    const filtered = papers.filter((paper) => {
      const title = (paper.title || '').toLowerCase();
      const abstract = (paper.abstract || '').toLowerCase();
      const text = `${title} ${abstract}`;

      // CRITICAL: Must contain EXACT disease phrase in title or abstract
      // For multi-word diseases like "lung cancer", check for the exact phrase
      const hasExactDisease = title.includes(diseaseLower) || abstract.includes(diseaseLower);
      
      // Also check for disease-specific patterns
      // For "lung cancer", also accept "lung carcinoma", "pulmonary cancer", etc.
      const diseasePatterns = this.getDiseasePatterns(diseaseLower);
      const hasDiseasePattern = diseasePatterns.some(pattern => 
        title.includes(pattern) || abstract.includes(pattern)
      );
      
      if (!hasExactDisease && !hasDiseasePattern) {
        logger.debug(`Filtered out paper without exact disease "${diseaseLower}": "${title.substring(0, 50)}..."`);
        return false;
      }

      // Check for whitelist keywords (at least one)
      const hasWhitelistKeyword = whitelistLower.some(keyword => 
        text.includes(keyword)
      );
      
      if (!hasWhitelistKeyword) {
        return false;
      }

      // Check for blacklist keywords (none allowed)
      const hasBlacklistKeyword = blacklistLower.some(keyword => 
        text.includes(keyword)
      );
      
      if (hasBlacklistKeyword) {
        return false;
      }

      // Additional quality checks
      if (!title.trim() || title.length < 10) {
        return false;
      }

      if (!abstract || abstract.length < 50) {
        return false;
      }

      // CRITICAL: Filter out obviously irrelevant papers
      const irrelevantKeywords = [
        'fire', 'wildland', 'fuel', 'mathematical model', 'engineering', 
        'physics', 'chemistry', 'computer science', 'economics', 'business',
        'climate', 'weather', 'geology', 'astronomy', 'agriculture',
        'forest', 'combustion', 'spread', 'prediction model'
      ];
      
      const hasIrrelevantKeyword = irrelevantKeywords.some(keyword => 
        text.includes(keyword)
      );
      
      if (hasIrrelevantKeyword) {
        logger.debug(`Filtered out paper with irrelevant keyword: "${title.substring(0, 50)}..."`);
        return false;
      }

      // Additional check: Must have medical context
      const medicalContextKeywords = [
        'medical', 'clinical', 'patient', 'treatment', 'therapy', 'diagnosis',
        'disease', 'health', 'hospital', 'physician', 'doctor', 'nurse',
        'symptom', 'prognosis', 'etiology', 'pathology', 'pharmacology'
      ];
      
      const hasMedicalContext = medicalContextKeywords.some(keyword => 
        text.includes(keyword)
      );
      
      if (!hasMedicalContext) {
        logger.debug(`Filtered out paper lacking medical context: "${title.substring(0, 50)}..."`);
        return false;
      }

      return true;
    });

    logger.info(`After strict filtering: ${filtered.length} papers`);
    
    // Score filtered papers
    const scoredPapers = filtered.map((paper) => {
      const title = (paper.title || '').toLowerCase();
      const abstract = (paper.abstract || '').toLowerCase();
      
      let relevanceScore = 0;

      // Disease position scoring
      if (title.includes(diseaseLower)) {
        relevanceScore += 3; // Disease in title
      }
      if (abstract.includes(diseaseLower)) {
        relevanceScore += 2; // Disease in abstract
      }

      // Treatment relevance
      const treatmentKeywords = ['treatment', 'therapy', 'drug', 'medication', 'intervention'];
      if (treatmentKeywords.some(term => title.includes(term) || abstract.includes(term))) {
        relevanceScore += 1;
      }

      // Clinical trial relevance
      if (title.includes('clinical trial') || abstract.includes('clinical trial')) {
        relevanceScore += 1;
      }

      // Source quality
      if (paper.source === 'PubMed') {
        relevanceScore += 1;
      }

      // Recency boost (last 5 years)
      const currentYear = new Date().getFullYear();
      if (paper.year >= currentYear - 5) {
        relevanceScore += 1;
      }

      return {
        ...paper,
        strictFilterScore: relevanceScore,
        passedStrictFilter: true
      };
    });

    // Sort by relevance score
    return scoredPapers.sort((a, b) => b.strictFilterScore - a.strictFilterScore);
  }

  /**
   * Filter clinical trials
   * @param {Array} trials - Raw trials
   * @param {string} disease - Core disease term
   * @param {Object} domainKeywords - Whitelist and blacklist
   * @returns {Array} Filtered trials
   */
  filterTrials(trials, disease, domainKeywords) {
    logger.info(`Strict filtering trials: ${trials.length} trials, disease: "${disease}"`);
    
    if (!disease || disease.length < 3) {
      return trials;
    }

    const diseaseLower = disease.toLowerCase();
    const { whitelist, blacklist } = domainKeywords;
    const blacklistLower = blacklist.map(b => b.toLowerCase());

    const filtered = trials.filter((trial) => {
      const title = (trial.title || '').toLowerCase();
      const description = (trial.description || '').toLowerCase();
      const text = `${title} ${description}`;

      // Must contain disease
      if (!text.includes(diseaseLower)) {
        return false;
      }

      // Check for blacklist keywords
      const hasBlacklistKeyword = blacklistLower.some(keyword => 
        text.includes(keyword)
      );
      
      if (hasBlacklistKeyword) {
        return false;
      }

      // Trial status check (prefer active trials)
      const status = (trial.status || '').toUpperCase();
      const validStatuses = ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'];
      
      if (!validStatuses.includes(status)) {
        return false;
      }

      return true;
    });

    logger.info(`After strict trial filtering: ${filtered.length} trials`);
    return filtered;
  }
}

module.exports = new StrictFilter();