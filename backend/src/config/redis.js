const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const isRedisReady = () => Boolean(redisClient && redisClient.isOpen && redisClient.isReady);

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis max retries exceeded');
          }
          return retries * 50;
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    // Avoid retaining a closed client reference that triggers repeated "client is closed" errors.
    redisClient = null;
    logger.warn(`Redis connection failed: ${error.message}`);
    logger.warn('Continuing without Redis caching');
    return null;
  }
};

const getRedisClient = () => redisClient;

const setCache = async (key, value, ttl = 86400) => {
  try {
    if (!isRedisReady()) return false;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn(`Cache set skipped for key ${key}: ${error.message}`);
    return false;
  }
};

const getCache = async (key) => {
  try {
    if (!isRedisReady()) return null;
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn(`Cache get skipped for key ${key}: ${error.message}`);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    if (!isRedisReady()) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.warn(`Cache delete skipped for key ${key}: ${error.message}`);
    return false;
  }
};

const clearCache = async (pattern) => {
  try {
    if (!isRedisReady()) return false;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.warn(`Cache clear skipped for pattern ${pattern}: ${error.message}`);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearCache,
};
