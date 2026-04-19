const logger = require('../config/logger');

class APIRetry {
  async withRetry(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
          logger.warn(
            `API call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms: ${error.message}`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`API call failed after ${maxRetries} attempts: ${lastError.message}`);
    throw lastError;
  }
}

module.exports = new APIRetry();
