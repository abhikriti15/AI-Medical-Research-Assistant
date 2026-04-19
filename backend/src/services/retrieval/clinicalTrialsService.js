const axios = require('axios');
const logger = require('../../config/logger');
const { getCache, setCache } = require('../../config/redis');
const apiRetry = require('../../utils/apiRetry');

const CLINICAL_TRIALS_URL = 'https://clinicaltrials.gov/api/v2/studies';

class ClinicalTrialsService {
  async searchTrials(disease, limit = 100) {
    try {
      if (!disease || !String(disease).trim()) {
        return [];
      }

      const cacheKey = `trials:${disease}:${limit}`;
      const cached = await getCache(cacheKey);
      
      if (cached) {
        logger.info(`ClinicalTrials cache hit for disease: ${disease}`);
        return cached;
      }

      // Use query string format for ClinicalTrials API v2
      const params = {
        query: {
          condition: [disease],
          status: ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION'],
        },
        pageSize: Math.min(limit, 100),
      };

      const response = await apiRetry.withRetry(
        () => axios.post(CLINICAL_TRIALS_URL, params, { timeout: 15000 }),
        3,
        1000
      );

      const trials = (response.data.studies || [])
        .map(study => {
          try {
            const protocolSection = study.protocolSection || {};
            const identificationModule = protocolSection.identificationModule || {};
            const statusModule = protocolSection.statusModule || {};
            const designModule = protocolSection.designModule || {};
            const contactsLocationsModule = protocolSection.contactsLocationsModule || {};

            return {
              id: identificationModule.nctId,
              title: identificationModule.officialTitle || identificationModule.briefTitle || 'Untitled Trial',
              description: identificationModule.briefSummary || identificationModule.detailedDescription || '',
              status: statusModule.overallStatus || 'UNKNOWN',
              phase: designModule.phases?.[0] || 'N/A',
              enrollmentCount: designModule.enrollmentInfo?.count || 0,
              startDate: statusModule.startDateStruct?.date,
              completionDate: statusModule.completionDateStruct?.date,
              locations: (contactsLocationsModule.locations || []).map(loc => ({
                facility: loc.facility || '',
                city: loc.city || '',
                state: loc.state || '',
                country: loc.country || '',
              })),
              url: `https://clinicaltrials.gov/ct2/show/${identificationModule.nctId}`,
              source: 'ClinicalTrials.gov',
            };
          } catch (e) {
            logger.warn(`Error parsing trial: ${e.message}`);
            return null;
          }
        })
        .filter(Boolean);

      await setCache(cacheKey, trials, 86400);
      logger.info(`ClinicalTrials retrieved ${trials.length} trials for disease: ${disease}`);
      
      return trials;
    } catch (error) {
      logger.error(`ClinicalTrials search error: ${error.message}`);
      return [];
    }
  }
}

module.exports = new ClinicalTrialsService();
