const Joi = require('joi');
const logger = require('../config/logger');

const querySchema = Joi.object({
  query: Joi.string().required().min(3).max(500).trim().messages({
    'string.empty': 'Query cannot be empty',
    'string.min': 'Query must be at least 3 characters',
    'string.max': 'Query cannot exceed 500 characters',
    'any.required': 'Query is required',
  }),
  disease: Joi.string().optional().allow('').max(200).trim(),
  structuredInput: Joi.boolean().optional(),
  sessionId: Joi.string().optional().uuid().allow(null, ''),
  userId: Joi.string().optional().allow(null, ''),
}).unknown(true);

const validateQuery = async (req, res, next) => {
  try {
    logger.info('Validating query:', req.body);
    
    const { error, value } = querySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
        type: d.type,
      }));
      
      logger.warn('Query validation failed:', { details, body: req.body });
      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }

    req.body = value;
    logger.info('Validation passed, proceeding with query');
    next();
  } catch (err) {
    logger.error('Validation middleware error:', err.message);
    res.status(500).json({ error: 'Internal validation error' });
  }
};

const validateSessionId = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({
        error: 'Invalid session ID format',
      });
    }

    next();
  } catch (err) {
    logger.error('Session validation error:', err.message);
    res.status(500).json({ error: 'Internal validation error' });
  }
};

module.exports = {
  validateQuery,
  validateSessionId,
};
