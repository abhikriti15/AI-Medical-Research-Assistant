const logger = require('../../config/logger');

class OverviewGenerator {
  /**
   * Generate SPECIFIC, grounded condition overview from research papers
   * @param {Array} papers - Research papers
   * @param {Array} trials - Clinical trials
   * @param {string} query - User query
   * @param {string} disease - Condition/disease
   * @returns {string} Specific, grounded overview text
   */
  generateOverview(papers, trials, query, disease) {
    logger.info(`Generating SPECIFIC overview for "${disease}" with ${papers.length} papers`);
    
    if (papers.length === 0) {
      return `Limited high-quality research found for ${disease}. Available evidence suggests it is a condition requiring medical evaluation, but specific details are not well-documented in the current literature.`;
    }
    
    // Extract SPECIFIC information from papers
    const specificInfo = this.extractSpecificInformation(papers, disease);
    const treatmentInfo = this.extractSpecificTreatments(papers, disease);
    const researchHighlights = this.extractResearchHighlights(papers, disease);
    
    // Generate disease-specific overview
    const overview = this.createDiseaseSpecificOverview(disease, specificInfo, treatmentInfo, researchHighlights, papers.length);
    
    return overview;
  }

  /**
   * Extract SPECIFIC information from research papers
   * @param {Array} papers - Research papers
   * @param {string} disease - Condition
   * @returns {Object} Specific information
   */
  extractSpecificInformation(papers, disease) {
    const diseaseLower = disease.toLowerCase();
    const info = {
      definition: '',
      keyFeatures: [],
      subtypes: [],
      mechanisms: [],
      riskFactors: []
    };

    // Analyze top 5 papers for specific information
    const samplePapers = papers.slice(0, 5);
    
    samplePapers.forEach(paper => {
      const title = (paper.title || '').toLowerCase();
      const abstract = (paper.abstract || '').toLowerCase();
      const text = `${title} ${abstract}`;

      // Extract disease-specific definition
      if (!info.definition && text.includes(diseaseLower)) {
        info.definition = this.extractDiseaseDefinition(text, diseaseLower);
      }

      // Extract key biological/clinical features
      const features = this.extractKeyFeatures(text, diseaseLower);
      info.keyFeatures = [...new Set([...info.keyFeatures, ...features])];

      // Extract disease subtypes (for cancers, etc.)
      const subtypes = this.extractDiseaseSubtypes(text, diseaseLower);
      info.subtypes = [...new Set([...info.subtypes, ...subtypes])];

      // Extract disease mechanisms
      const mechanisms = this.extractDiseaseMechanisms(text, diseaseLower);
      info.mechanisms = [...new Set([...info.mechanisms, ...mechanisms])];

      // Extract risk factors
      const riskFactors = this.extractRiskFactors(text, diseaseLower);
      info.riskFactors = [...new Set([...info.riskFactors, ...riskFactors])];
    });

    return info;
  }

  /**
   * Extract disease-specific definition
   * @param {string} text - Paper text
   * @param {string} diseaseLower - Disease in lowercase
   * @returns {string} Disease definition
   */
  extractDiseaseDefinition(text, diseaseLower) {
    // Look for sentences that define the disease
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(diseaseLower)) {
        // Check if this looks like a definition
        const definitionIndicators = [
          'is a', 'refers to', 'defined as', 'characterized by', 
          'involves', 'affects', 'results from', 'condition where',
          'disorder characterized', 'disease involving'
        ];
        
        for (const indicator of definitionIndicators) {
          if (sentence.toLowerCase().includes(indicator)) {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 20 && cleanSentence.length < 150) {
              // Clean up the sentence
              let cleaned = cleanSentence
                .replace(/\[\d+\]/g, '') // Remove citations
                .replace(/\([^)]+\)/g, '') // Remove parentheses content
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();
              
              return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + '.';
            }
          }
        }
      }
    }
    
    // If no definition found, create a basic one based on disease type
    if (diseaseLower.includes('cancer')) {
      return `Cancer affecting specific tissues or organs.`;
    } else if (diseaseLower.includes('diabetes')) {
      return `Metabolic disorder affecting blood sugar regulation.`;
    } else if (diseaseLower.includes('varicocele')) {
      return `Condition involving enlarged veins in the scrotum.`;
    } else {
      return '';
    }
  }

  /**
   * Extract key biological/clinical features
   * @param {string} text - Paper text
   * @param {string} diseaseLower - Disease in lowercase
   * @returns {Array} Key features
   */
  extractKeyFeatures(text, diseaseLower) {
    const features = [];
    
    // Disease-specific feature patterns with descriptions
    const featurePatterns = {
      'lung cancer': [
        {pattern: 'tumor', description: 'abnormal growth in lung tissue'},
        {pattern: 'malignancy', description: 'cancerous growth'},
        {pattern: 'carcinoma', description: 'type of cancer'},
        {pattern: 'nodule', description: 'small lung growth'},
        {pattern: 'pulmonary', description: 'relating to the lungs'},
        {pattern: 'metastasis', description: 'cancer spread'},
        {pattern: 'nsclc', description: 'non-small cell lung cancer'},
        {pattern: 'sclc', description: 'small cell lung cancer'}
      ],
      'varicocele': [
        {pattern: 'scrotal', description: 'relating to the scrotum'},
        {pattern: 'testicular', description: 'relating to the testicles'},
        {pattern: 'vein', description: 'blood vessel'},
        {pattern: 'venous', description: 'relating to veins'},
        {pattern: 'dilation', description: 'enlargement'},
        {pattern: 'infertility', description: 'reduced fertility'},
        {pattern: 'sperm', description: 'male reproductive cells'},
        {pattern: 'semen', description: 'seminal fluid'}
      ],
      'diabetes': [
        {pattern: 'glucose', description: 'blood sugar'},
        {pattern: 'insulin', description: 'hormone regulating blood sugar'},
        {pattern: 'glycemic', description: 'relating to blood sugar levels'},
        {pattern: 'metabolic', description: 'relating to metabolism'},
        {pattern: 'type 1', description: 'autoimmune diabetes'},
        {pattern: 'type 2', description: 'insulin resistance diabetes'}
      ],
      'hypertension': [
        {pattern: 'blood pressure', description: 'force of blood against artery walls'},
        {pattern: 'vascular', description: 'relating to blood vessels'},
        {pattern: 'arterial', description: 'relating to arteries'},
        {pattern: 'systolic', description: 'upper blood pressure number'},
        {pattern: 'diastolic', description: 'lower blood pressure number'}
      ],
      'asthma': [
        {pattern: 'airway', description: 'breathing passages'},
        {pattern: 'bronchial', description: 'relating to bronchial tubes'},
        {pattern: 'inflammation', description: 'swelling and irritation'},
        {pattern: 'hyperresponsiveness', description: 'exaggerated response'},
        {pattern: 'wheeze', description: 'whistling breathing sound'}
      ]
    };

    // Check for disease-specific features
    for (const [disease, patterns] of Object.entries(featurePatterns)) {
      if (diseaseLower.includes(disease) || disease.includes(diseaseLower)) {
        for (const {pattern, description} of patterns) {
          if (text.includes(pattern) && !features.some(f => f.pattern === pattern)) {
            features.push({pattern, description});
          }
        }
      }
    }

    // If no disease-specific features found, extract general medical features
    if (features.length === 0) {
      const generalPatterns = [
        {pattern: 'treatment', description: 'medical intervention'},
        {pattern: 'therapy', description: 'treatment approach'},
        {pattern: 'clinical', description: 'relating to patient care'},
        {pattern: 'diagnosis', description: 'identification of condition'},
        {pattern: 'management', description: 'care and treatment'}
      ];
      
      for (const {pattern, description} of generalPatterns) {
        if (text.includes(pattern) && !features.some(f => f.pattern === pattern)) {
          features.push({pattern, description});
        }
      }
    }

    return features.slice(0, 5);
  }

  /**
   * Extract disease subtypes
   * @param {string} text - Paper text
   * @param {string} diseaseLower - Disease in lowercase
   * @returns {Array} Disease subtypes
   */
  extractDiseaseSubtypes(text, diseaseLower) {
    const subtypes = [];
    
    // Cancer subtype patterns
    if (diseaseLower.includes('cancer')) {
      const cancerSubtypes = [
        'non-small cell', 'small cell', 'nsclc', 'sclc',
        'adenocarcinoma', 'squamous cell', 'large cell',
        'stage i', 'stage ii', 'stage iii', 'stage iv',
        'localized', 'metastatic', 'advanced'
      ];
      
      for (const subtype of cancerSubtypes) {
        if (text.includes(subtype) && !subtypes.includes(subtype)) {
          subtypes.push(subtype);
        }
      }
    }
    
    // Diabetes subtypes
    if (diseaseLower.includes('diabetes')) {
      const diabetesSubtypes = ['type 1', 'type 2', 'gestational', 'mody'];
      for (const subtype of diabetesSubtypes) {
        if (text.includes(subtype) && !subtypes.includes(subtype)) {
          subtypes.push(subtype);
        }
      }
    }

    return subtypes.slice(0, 3);
  }

  /**
   * Extract disease mechanisms
   * @param {string} text - Paper text
   * @param {string} diseaseLower - Disease in lowercase
   * @returns {Array} Disease mechanisms
   */
  extractDiseaseMechanisms(text, diseaseLower) {
    const mechanisms = [];
    
    const mechanismKeywords = [
      'pathogenesis', 'pathophysiology', 'mechanism', 'process',
      'development', 'progression', 'underlying', 'cause',
      'etiology', 'origin', 'initiation', 'propagation'
    ];
    
    for (const keyword of mechanismKeywords) {
      if (text.includes(keyword)) {
        // Extract the sentence containing the mechanism
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (sentence.includes(keyword) && sentence.includes(diseaseLower)) {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 20 && cleanSentence.length < 100) {
              mechanisms.push(cleanSentence);
              break;
            }
          }
        }
      }
    }

    return mechanisms.slice(0, 2);
  }

  /**
   * Extract risk factors
   * @param {string} text - Paper text
   * @param {string} diseaseLower - Disease in lowercase
   * @returns {Array} Risk factors
   */
  extractRiskFactors(text, diseaseLower) {
    const riskFactors = [];
    
    const riskKeywords = [
      'risk factor', 'associated with', 'linked to', 'correlated with',
      'predisposition', 'susceptibility', 'exposure', 'history'
    ];
    
    for (const keyword of riskKeywords) {
      if (text.includes(keyword)) {
        // Extract the phrase after the risk factor mention
        const start = text.indexOf(keyword) + keyword.length;
        const end = Math.min(text.indexOf('.', start), text.indexOf(',', start), text.length);
        const phrase = text.substring(start, end).trim();
        
        if (phrase.length > 5 && phrase.length < 50) {
          const factors = phrase.split(/and|or|,/).map(f => f.trim()).filter(f => f.length > 3);
          riskFactors.push(...factors);
        }
      }
    }

    return [...new Set(riskFactors)].slice(0, 3);
  }

  /**
   * Extract SPECIFIC treatments from papers
   * @param {Array} papers - Research papers
   * @param {string} disease - Disease
   * @returns {Object} Specific treatment information
   */
  extractSpecificTreatments(papers, disease) {
    const diseaseLower = disease.toLowerCase();
    const treatments = {
      surgical: [],
      medical: [],
      other: [],
      specificDrugs: []
    };

    const samplePapers = papers.slice(0, 5);

    samplePapers.forEach(paper => {
      const text = `${paper.title || ''} ${paper.abstract || ''}`.toLowerCase();

      // Disease-specific treatment patterns
      if (diseaseLower.includes('cancer')) {
        // Cancer treatments
        const cancerTreatments = [
          'chemotherapy', 'radiation', 'radiotherapy', 'immunotherapy',
          'targeted therapy', 'surgery', 'resection', 'lobectomy',
          'pneumonectomy', 'chemoradiation', 'adjuvant', 'neoadjuvant',
          'checkpoint inhibitor', 'pd-1', 'pd-l1', 'ctla-4'
        ];
        
        cancerTreatments.forEach(treatment => {
          if (text.includes(treatment) && !treatments.medical.includes(treatment)) {
            treatments.medical.push(treatment);
          }
        });
      }
      
      if (diseaseLower.includes('varicocele')) {
        // Varicocele treatments
        const varicoceleTreatments = [
          'varicocelectomy', 'microsurgical', 'laparoscopic',
          'embolization', 'sclerotherapy', 'surgical repair',
          'ligation', 'venography', 'interventional'
        ];
        
        varicoceleTreatments.forEach(treatment => {
          if (text.includes(treatment) && !treatments.surgical.includes(treatment)) {
            treatments.surgical.push(treatment);
          }
        });
      }

      // General treatment extraction
      const surgicalKeywords = ['surgery', 'surgical', 'operation', 'procedure', 'resection', 'excision'];
      const medicalKeywords = ['medication', 'drug', 'therapy', 'treatment', 'pharmacological', 'medical'];
      const otherKeywords = ['management', 'approach', 'intervention', 'conservative', 'supportive'];
      
      surgicalKeywords.forEach(keyword => {
        if (text.includes(keyword) && !treatments.surgical.includes(keyword)) {
          treatments.surgical.push(keyword);
        }
      });
      
      medicalKeywords.forEach(keyword => {
        if (text.includes(keyword) && !treatments.medical.includes(keyword)) {
          treatments.medical.push(keyword);
        }
      });
      
      otherKeywords.forEach(keyword => {
        if (text.includes(keyword) && !treatments.other.includes(keyword)) {
          treatments.other.push(keyword);
        }
      });

      // Extract specific drug names (capitalized words that might be drugs)
      const words = text.split(/\s+/);
      words.forEach((word, index) => {
        if (word.length > 3 && word[0] === word[0].toUpperCase() && 
            !word.includes('-') && !word.includes('_')) {
          // Check if it might be a drug (often followed by "therapy" or "inhibitor")
          const nextWord = words[index + 1] || '';
          if (nextWord.includes('therapy') || nextWord.includes('inhibitor') || 
              nextWord.includes('antibody') || nextWord.includes('agent')) {
            if (!treatments.specificDrugs.includes(word)) {
              treatments.specificDrugs.push(word);
            }
          }
        }
      });
    });

    // Clean up arrays
    treatments.surgical = treatments.surgical.slice(0, 3);
    treatments.medical = treatments.medical.slice(0, 3);
    treatments.other = treatments.other.slice(0, 2);
    treatments.specificDrugs = treatments.specificDrugs.slice(0, 2);

    return treatments;
  }

  /**
   * Extract research highlights from papers
   * @param {Array} papers - Research papers
   * @param {string} disease - Disease
   * @returns {Object} Research highlights
   */
  extractResearchHighlights(papers, disease) {
    const diseaseLower = disease.toLowerCase();
    const highlights = {
      keyFindings: [],
      recentAdvances: [],
      clinicalImplications: [],
      researchGaps: []
    };

    const samplePapers = papers.slice(0, 3);

    samplePapers.forEach((paper, index) => {
      const title = paper.title || '';
      const abstract = paper.abstract || '';
      
      // Extract key findings from abstract
      const abstractLower = abstract.toLowerCase();
      const sentences = abstract.split(/[.!?]+/);
      
      // Look for sentences indicating findings
      const findingIndicators = [
        'found that', 'demonstrated', 'showed', 'indicated',
        'suggested', 'revealed', 'concluded', 'evidence',
        'results show', 'study demonstrates', 'research indicates',
        'our study', 'we found', 'analysis revealed', 'data suggest',
        'accounts for', 'shows improved', 'compared to', 'improves outcomes'
      ];
      
      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        // Check if sentence contains disease or is a meaningful finding
        const hasDisease = sentenceLower.includes(diseaseLower);
        const hasFindingIndicator = findingIndicators.some(indicator => sentenceLower.includes(indicator));
        
        if ((hasDisease || hasFindingIndicator) && sentence.length > 20 && sentence.length < 250) {
          const cleanSentence = sentence.trim();
          // Clean up the sentence
          let cleaned = cleanSentence
            .replace(/\[\d+\]/g, '') // Remove citations
            .replace(/\([^)]+\)/g, '') // Remove parentheses content
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
          
          // Check if this looks like a meaningful finding
          if (cleaned.length > 25 && !highlights.keyFindings.includes(cleaned)) {
            // Capitalize first letter
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            highlights.keyFindings.push(cleaned);
            break;
          }
        }
      }

      // Check for recent advances (based on year and keywords)
      const currentYear = new Date().getFullYear();
      if (paper.year && paper.year >= currentYear - 2) {
        const advanceKeywords = ['novel', 'new', 'recent', 'advance', 'innovation', 'breakthrough', 'emerging', 'promising'];
        for (const keyword of advanceKeywords) {
          if (abstractLower.includes(keyword) || title.toLowerCase().includes(keyword)) {
            // Extract a more specific advance description
            const advanceSentences = abstract.split(/[.!?]+/);
            for (const sentence of advanceSentences) {
              if (sentence.toLowerCase().includes(keyword) && sentence.length > 20) {
                const cleanSentence = sentence.trim();
                const advance = `Recent research (${paper.year}): ${cleanSentence.substring(0, 120)}...`;
                if (!highlights.recentAdvances.includes(advance)) {
                  highlights.recentAdvances.push(advance);
                  break;
                }
              }
            }
          }
        }
      }

      // Extract clinical implications
      const implicationKeywords = [
        'clinical implication', 'practice guideline', 'treatment recommendation', 
        'management strategy', 'clinical practice', 'patient care', 'therapeutic',
        'should be considered', 'recommended for', 'indicated for'
      ];
      
      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        if (sentenceLower.includes(diseaseLower)) {
          for (const keyword of implicationKeywords) {
            if (sentenceLower.includes(keyword) && sentence.length > 20) {
              const cleanSentence = sentence.trim();
              const implication = cleanSentence.substring(0, 150);
              if (!highlights.clinicalImplications.includes(implication)) {
                highlights.clinicalImplications.push(implication);
                break;
              }
            }
          }
        }
      }
    });

    // If no key findings extracted, create meaningful summaries from abstracts
    if (highlights.keyFindings.length === 0 && papers.length > 0) {
      papers.slice(0, 2).forEach(paper => {
        const title = paper.title || '';
        const abstract = paper.abstract || '';
        
        if (title.toLowerCase().includes(diseaseLower) || abstract.toLowerCase().includes(diseaseLower)) {
          // Create a summary from the abstract
          const abstractSentences = abstract.split(/[.!?]+/);
          for (const sentence of abstractSentences) {
            if (sentence.toLowerCase().includes(diseaseLower) && sentence.length > 30 && sentence.length < 150) {
              const cleanSentence = sentence.trim();
              const finding = cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1);
              if (!highlights.keyFindings.includes(finding)) {
                highlights.keyFindings.push(finding);
                break;
              }
            }
          }
          
          // If still no finding, use a summary based on the title
          if (highlights.keyFindings.length === 0) {
            const finding = `Research focuses on ${title.substring(0, 80)}...`;
            highlights.keyFindings.push(finding);
          }
        }
      });
    }

    // Limit arrays
    highlights.keyFindings = highlights.keyFindings.slice(0, 2);
    highlights.recentAdvances = highlights.recentAdvances.slice(0, 2);
    highlights.clinicalImplications = highlights.clinicalImplications.slice(0, 1);

    return highlights;
  }

  /**
   * Create disease-specific overview
   * @param {string} disease - Condition
   * @param {Object} specificInfo - Specific disease information
   * @param {Object} treatmentInfo - Treatment information
   * @param {Object} researchHighlights - Research highlights
   * @param {number} paperCount - Number of papers
   * @returns {string} Disease-specific overview
   */
  createDiseaseSpecificOverview(disease, specificInfo, treatmentInfo, researchHighlights, paperCount) {
    const diseaseCapitalized = disease.charAt(0).toUpperCase() + disease.slice(1);
    let overview = '';

    // Paragraph 1: What the condition is
    overview += `${diseaseCapitalized} `;
    
    if (specificInfo.definition) {
      overview += specificInfo.definition + ' ';
    } else {
      // Create a basic definition based on extracted features
      if (specificInfo.keyFeatures.length > 0) {
        const featureDescriptions = specificInfo.keyFeatures.slice(0, 2).map(f => 
          typeof f === 'object' ? f.description : f
        );
        overview += `is characterized by ${featureDescriptions.join(' and ')}. `;
      } else {
        overview += `is a medical condition that requires clinical evaluation. `;
      }
    }

    // Add key biological/clinical features
    if (specificInfo.keyFeatures.length > 0) {
      const featureDescriptions = specificInfo.keyFeatures.slice(0, 3).map(f => 
        typeof f === 'object' ? f.description : f
      );
      overview += `Key clinical features include ${featureDescriptions.join(', ')}. `;
    }

    // Add subtypes if available
    if (specificInfo.subtypes.length > 0) {
      overview += `Common clinical subtypes include ${specificInfo.subtypes.join(' and ')}. `;
    }

    // Paragraph 2: Treatment approaches (SPECIFIC)
    overview += `\n\nCurrent treatment approaches for ${disease} typically involve `;
    
    const allTreatments = [
      ...treatmentInfo.surgical,
      ...treatmentInfo.medical,
      ...treatmentInfo.other
    ];
    
    if (allTreatments.length > 0) {
      // Use disease-specific treatment descriptions
      if (disease.toLowerCase().includes('cancer')) {
        overview += `${allTreatments.slice(0, 3).join(', ')}. `;
        if (treatmentInfo.specificDrugs.length > 0) {
          overview += `Specific therapeutic agents such as ${treatmentInfo.specificDrugs.join(' and ')} are frequently utilized. `;
        }
      } else if (disease.toLowerCase().includes('varicocele')) {
        overview += `${treatmentInfo.surgical.slice(0, 2).join(' and ')} procedures. `;
      } else {
        overview += `${allTreatments.slice(0, 3).join(', ')}. `;
      }
    } else {
      overview += `various medical and surgical interventions tailored to individual patient presentation. `;
    }

    // Paragraph 3: What research says (GROUNDED in actual papers)
    overview += `\n\nRecent research evidence from ${paperCount} studies indicates: `;
    
    if (researchHighlights.keyFindings.length > 0) {
      // Use the first key finding
      const firstFinding = researchHighlights.keyFindings[0];
      overview += firstFinding.charAt(0).toLowerCase() + firstFinding.slice(1) + ' ';
      
      // Add second finding if available
      if (researchHighlights.keyFindings.length > 1) {
        const secondFinding = researchHighlights.keyFindings[1];
        overview += `Furthermore, ${secondFinding.charAt(0).toLowerCase() + secondFinding.slice(1)} `;
      }
    } else if (specificInfo.mechanisms.length > 0) {
      overview += specificInfo.mechanisms[0].toLowerCase() + ' ';
    } else if (specificInfo.riskFactors.length > 0) {
      overview += `identified risk factors include ${specificInfo.riskFactors.join(', ')}. `;
    } else {
      // Try to extract something from the papers
      if (paperCount > 0) {
        overview += `current studies focus on optimizing ${disease} management strategies and therapeutic outcomes. `;
      } else {
        overview += `available clinical evidence suggests comprehensive medical assessment is warranted. `;
      }
    }

    // Add recent advances if available
    if (researchHighlights.recentAdvances.length > 0) {
      overview += researchHighlights.recentAdvances[0] + ' ';
    }
    
    // Add clinical implications if available
    if (researchHighlights.clinicalImplications.length > 0) {
      overview += researchHighlights.clinicalImplications[0] + ' ';
    }

    // Handle low data case - only trigger for very limited data
    if (paperCount < 2 || (specificInfo.keyFeatures.length === 0 && allTreatments.length === 0)) {
      overview = `Limited high-quality research is available for ${disease}. Based on ${paperCount} studies, available evidence suggests `;
      if (specificInfo.keyFeatures.length > 0) {
        const featureDescriptions = specificInfo.keyFeatures.slice(0, 2).map(f => 
          typeof f === 'object' ? f.description : f
        );
        overview += `it is characterized by ${featureDescriptions.join(' and ')}. `;
      } else {
        overview += `it is a condition requiring thorough medical evaluation. `;
      }
      if (allTreatments.length > 0) {
        overview += `Reported therapeutic approaches include ${allTreatments.slice(0, 2).join(' and ')}.`;
      }
    }

    // Ensure we don't have generic filler
    overview = overview.replace(/consult healthcare provider/gi, '');
    overview = overview.replace(/medical condition that affects patients/gi, 'medical condition');
    overview = overview.replace(/requires personalized assessment/gi, 'requires clinical evaluation');
    overview = overview.replace(/affects patients/gi, 'affects individuals');
    
    // Clean up and ensure proper length
    overview = overview.trim();
    if (overview.length < 150) {
      const featureDescriptions = specificInfo.keyFeatures.slice(0, 2).map(f => 
        typeof f === 'object' ? f.description : f
      );
      overview = `Based on analysis of ${paperCount} research papers, ${disease} is characterized by ${featureDescriptions.join(' and ') || 'specific clinical features'}. Current therapeutic approaches include ${allTreatments.slice(0, 2).join(' and ') || 'various evidence-based interventions'}. Recent studies provide insights into optimal management strategies and clinical outcomes.`;
    }

    return overview;
  }

}

module.exports = new OverviewGenerator();