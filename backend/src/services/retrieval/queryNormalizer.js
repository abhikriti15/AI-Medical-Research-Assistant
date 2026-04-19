const logger = require('../../config/logger');

class QueryNormalizer {
  constructor() {
    this.genericTerms = new Set([
      'treatment', 'therapy', 'clinical', 'medicine', 'drug', 
      'medication', 'trial', 'study', 'research', 'analysis',
      'review', 'meta', 'systematic', 'effect', 'efficacy',
      'safety', 'outcome', 'result', 'findings', 'conclusion'
    ]);
    
    this.medicalStopWords = new Set([
      'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to',
      'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'can', 'could', 'may', 'might', 'must', 'shall'
    ]);
  }

  /**
   * Extract core disease term from query
   * @param {string} query - User query
   * @returns {string} Normalized disease term
   */
  extractDiseaseTerm(query) {
    if (!query || typeof query !== 'string') {
      return '';
    }

    const queryLower = query.toLowerCase();
    
    // First, check for multi-word disease patterns
    const multiWordDiseases = [
      'lung cancer', 'breast cancer', 'prostate cancer', 'pancreatic cancer',
      'ovarian cancer', 'colorectal cancer', 'bladder cancer', 'kidney cancer',
      'liver cancer', 'brain cancer', 'skin cancer', 'thyroid cancer',
      'esophageal cancer', 'stomach cancer', 'cervical cancer', 'uterine cancer',
      'testicular cancer', 'bone cancer', 'blood cancer', 'leukemia',
      'lymphoma', 'melanoma', 'sarcoma', 'mesothelioma',
      'type 1 diabetes', 'type 2 diabetes', 'gestational diabetes',
      'rheumatoid arthritis', 'osteoarthritis', 'psoriatic arthritis',
      'crohn disease', 'ulcerative colitis', 'irritable bowel syndrome',
      'chronic obstructive pulmonary disease', 'cystic fibrosis',
      'parkinson disease', 'alzheimer disease', 'multiple sclerosis',
      'lupus erythematosus', 'scleroderma', 'sjogren syndrome',
      'heart failure', 'coronary artery disease', 'myocardial infarction',
      'atrial fibrillation', 'ventricular tachycardia', 'hypertension',
      'chronic kidney disease', 'polycystic kidney disease',
      'nonalcoholic fatty liver disease', 'cirrhosis', 'hepatitis',
      'migraine', 'tension headache', 'cluster headache',
      'major depressive disorder', 'bipolar disorder', 'anxiety disorder',
      'obsessive compulsive disorder', 'post traumatic stress disorder',
      'attention deficit hyperactivity disorder', 'autism spectrum disorder'
    ];

    // Check for multi-word diseases first
    for (const disease of multiWordDiseases) {
      if (queryLower.includes(disease)) {
        logger.info(`Query normalization: "${query}" → "${disease}" (multi-word)`);
        return disease;
      }
    }

    // If no multi-word disease found, extract single words
    const words = queryLower.split(/\s+/);
    
    // Remove generic medical terms and stop words
    const filteredWords = words.filter(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      return !this.genericTerms.has(cleanWord) && 
             !this.medicalStopWords.has(cleanWord) &&
             cleanWord.length > 2;
    });

    // Find the most specific term (usually the longest word)
    if (filteredWords.length === 0) {
      return words[0] || '';
    }

    // Prefer longer, more specific terms
    const sortedWords = filteredWords.sort((a, b) => b.length - a.length);
    const diseaseTerm = sortedWords[0];

    logger.info(`Query normalization: "${query}" → "${diseaseTerm}"`);
    return diseaseTerm;
  }

  /**
   * Create enhanced search query
   * @param {string} query - Original query
   * @param {string} disease - Extracted disease term
   * @returns {string} Enhanced query for search APIs
   */
  createEnhancedQuery(query, disease) {
    if (!disease) {
      return query;
    }

    // Add disease-specific terms for better retrieval
    const diseaseSynonyms = this.getDiseaseSynonyms(disease);
    const enhancedTerms = [disease, ...diseaseSynonyms];
    
    // Add treatment-related terms if not already present
    if (!query.toLowerCase().includes('treatment') && 
        !query.toLowerCase().includes('therapy')) {
      enhancedTerms.push('treatment');
    }

    const enhancedQuery = enhancedTerms.join(' ');
    logger.info(`Enhanced query: "${query}" → "${enhancedQuery}"`);
    return enhancedQuery;
  }

  /**
   * Get synonyms for common diseases
   * @param {string} disease - Disease term
   * @returns {string[]} Synonyms
   */
  getDiseaseSynonyms(disease) {
    const synonymMap = {
      'varicocele': ['varicoceles', 'testicular', 'scrotal', 'spermatic'],
      'testicular': ['testis', 'scrotal', 'gonadal', 'male reproductive'],
      'pain': ['discomfort', 'ache', 'soreness', 'tenderness'],
      'diabetes': ['diabetic', 'diabetes mellitus', 'dm', 'type 2 diabetes', 't2d'],
      'hypertension': ['high blood pressure', 'htn', 'blood pressure'],
      'asthma': ['bronchial asthma', 'respiratory'],
      'arthritis': ['rheumatoid', 'osteoarthritis', 'joint'],
      'depression': ['mdd', 'major depressive disorder', 'mental health'],
      'cancer': ['tumor', 'malignancy', 'neoplasm', 'carcinoma'],
      'alzheimer': ['dementia', 'cognitive impairment', 'neurodegenerative'],
      'parkinson': ['parkinsonism', 'movement disorder'],
      'copd': ['chronic obstructive pulmonary disease', 'lung disease'],
    };

    // Check for multi-word diseases
    const diseaseLower = disease.toLowerCase();
    if (diseaseLower.includes('testicular pain')) {
      return ['testicular', 'scrotal', 'orchialgia', 'male pelvic pain'];
    }
    if (diseaseLower.includes('back pain')) {
      return ['spinal', 'lumbar', 'dorsalgia', 'low back'];
    }
    if (diseaseLower.includes('headache')) {
      return ['migraine', 'cephalalgia', 'head pain'];
    }

    return synonymMap[diseaseLower] || [];
  }

  /**
   * Get domain-specific keywords for filtering
   * @param {string} disease - Disease term
   * @returns {Object} Whitelist and blacklist keywords
   */
  getDomainKeywords(disease) {
    const domainMap = {
      'varicocele': {
        whitelist: ['varicocele', 'testicular', 'scrotal', 'spermatic', 'male infertility', 
                   'sperm', 'semen', 'testis', 'gonadal', 'andrology'],
        blacklist: ['cancer', 'ovarian', 'breast', 'uterine', 'endometrial', 'gynecological',
                   'cardiac', 'heart', 'cerebral', 'brain', 'neurological', 'psychiatric']
      },
      'testicular': {
        whitelist: ['testicular', 'testis', 'scrotal', 'male reproductive', 'orchialgia',
                   'male pelvic', 'genital', 'urological'],
        blacklist: ['cancer', 'ovarian', 'breast', 'uterine', 'endometrial', 'gynecological',
                   'cardiac', 'heart', 'cerebral', 'brain', 'neurological', 'psychiatric',
                   'fire', 'wildland', 'mathematical model', 'fuel'] // Added specific irrelevant terms
      },
      'pain': {
        whitelist: ['pain', 'discomfort', 'ache', 'soreness', 'tenderness', 'symptom'],
        blacklist: ['fire', 'wildland', 'mathematical model', 'fuel', 'engineering', 'physics']
      },
      'diabetes': {
        whitelist: ['diabetes', 'diabetic', 'glucose', 'insulin', 'glycemic', 'metabolic',
                   'type 2', 't2d', 'hyperglycemia', 'hypoglycemia'],
        blacklist: ['cancer', 'alzheimer', 'parkinson', 'asthma', 'copd', 'arthritis']
      },
      'hypertension': {
        whitelist: ['hypertension', 'blood pressure', 'htn', 'cardiovascular', 'bp',
                   'systolic', 'diastolic', 'antihypertensive'],
        blacklist: ['cancer', 'diabetes', 'asthma', 'copd', 'arthritis']
      },
      'asthma': {
        whitelist: ['asthma', 'bronchial', 'respiratory', 'airway', 'inhaler', 'bronchodilator',
                   'wheeze', 'dyspnea', 'corticosteroid'],
        blacklist: ['cardiac', 'diabetes', 'cancer', 'arthritis', 'neurological']
      }
    };

    return domainMap[disease.toLowerCase()] || {
      whitelist: [disease],
      blacklist: []
    };
  }
}

module.exports = new QueryNormalizer();