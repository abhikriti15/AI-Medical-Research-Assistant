const axios = require('axios');
const logger = require('./logger');

const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

const ollamaClient = axios.create({
  baseURL: ollamaUrl,
  timeout: 5000, // Reduced from 60000 to fail faster and use fallback
});

const validateOllama = async () => {
  try {
    const response = await ollamaClient.get('/api/tags');
    logger.info('Ollama service is available');
    return true;
  } catch (error) {
    logger.warn(`Ollama service unavailable: ${error.message}`);
    return false;
  }
};

const pullModel = async (modelName) => {
  try {
    logger.info(`Pulling model: ${modelName}`);
    const response = await ollamaClient.post('/api/pull', {
      name: modelName,
      stream: false,
    });
    logger.info(`Model ${modelName} pulled successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to pull model ${modelName}:`, error.message);
    return false;
  }
};

const listModels = async () => {
  try {
    const response = await ollamaClient.get('/api/tags');
    return response.data.models || [];
  } catch (error) {
    logger.error('Failed to list models:', error.message);
    return [];
  }
};

const generateResponse = async (prompt, options = {}) => {
  try {
    const model = process.env.LLM_MODEL || 'mistral';
    
    const response = await ollamaClient.post('/api/generate', {
      model,
      prompt,
      stream: false,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9,
      top_k: options.topK || 40,
      ...options,
    });

    return response.data.response;
  } catch (error) {
    logger.error('LLM generation failed:', error.message);
    logger.error('Ollama connection error - using fallback response');
    throw error;
  }
};

module.exports = {
  ollamaClient,
  validateOllama,
  pullModel,
  listModels,
  generateResponse,
};
