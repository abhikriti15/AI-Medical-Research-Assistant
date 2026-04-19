const logger = require('../../config/logger');
const { getCache, setCache } = require('../../config/redis');

let transformers = null;

// Lazy load transformers to avoid startup delays
const getTransformers = async () => {
  if (!transformers) {
    try {
      transformers = await import('@xenova/transformers');
      logger.info('Transformers library loaded');
    } catch (error) {
      logger.error('Failed to load transformers:', error.message);
      return null;
    }
  }
  return transformers;
};

class EmbeddingService {
  async getEmbedding(text) {
    try {
      // Check cache first
      const cacheKey = `embedding:${text.substring(0, 100)}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return cached;
      }

      const tf = await getTransformers();
      if (!tf) {
        // Return zero vector if transformers not available
        return new Array(384).fill(0);
      }

      const { pipeline } = tf;
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      const result = await extractor(text, { pooling: 'mean', normalize: true });

      const embedding = Array.from(result.data);
      
      // Cache for 24 hours
      await setCache(cacheKey, embedding, 86400);
      
      return embedding;
    } catch (error) {
      logger.error(`Embedding generation error: ${error.message}`);
      // Return zero vector as fallback
      return new Array(384).fill(0);
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

module.exports = new EmbeddingService();
