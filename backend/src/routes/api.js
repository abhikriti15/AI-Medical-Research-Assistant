const express = require('express');
const queryController = require('../controllers/queryController');
const sessionController = require('../controllers/sessionController');
const { validateQuery } = require('../middleware/validateInput');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Query endpoints
router.post('/query', rateLimiter, validateQuery, queryController.handleQuery);
router.get('/sessions/:sessionId', sessionController.getSession);
router.get('/sessions/:sessionId/history', sessionController.getHistory);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;