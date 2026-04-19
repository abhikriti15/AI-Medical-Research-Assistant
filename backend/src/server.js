require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { validateOllama } = require('./config/ollama');
const logger = require('./config/logger');
const requestLogger = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'http://localhost:3000,http://localhost:3001,http://localhost:5173'
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Middleware
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);

// Initialize services
const initializeServices = async () => {
  try {
    // Database
    await connectDB();
    
    // Redis
    await connectRedis();
    
    // Ollama
    const ollamaReady = await validateOllama();
    if (!ollamaReady) {
      logger.warn('Ollama service not available - LLM features may be limited');
    }
    
    logger.info('All services initialized');
  } catch (error) {
    logger.error('Service initialization error:', error.message);
  }
};

let servicesInitializationPromise;

const ensureServicesInitialized = () => {
  if (!servicesInitializationPromise) {
    servicesInitializationPromise = initializeServices();
  }
  return servicesInitializationPromise;
};

// Ensure dependencies are ready before handling API requests in serverless mode.
app.use(async (req, res, next) => {
  await ensureServicesInitialized();
  next();
});

// Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await ensureServicesInitialized();
    
    app.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the HTTP listener only for direct local runs.
if (require.main === module) {
  startServer();
} else {
  // Warm initialization for serverless cold starts.
  ensureServicesInitialized();
}

module.exports = app;

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});