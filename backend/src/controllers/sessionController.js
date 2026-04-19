const Conversation = require('../models/Conversation');
const logger = require('../config/logger');

class SessionController {
	async getSession(req, res) {
		try {
			const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });

			if (!conversation) {
				return res.status(404).json({ error: 'Session not found' });
			}

			return res.json({
				sessionId: conversation.sessionId,
				context: conversation.context,
				createdAt: conversation.createdAt,
				updatedAt: conversation.updatedAt,
			});
		} catch (error) {
			logger.error(`Get session error: ${error.message}`);
			return res.status(500).json({ error: 'Failed to load session' });
		}
	}

	async getHistory(req, res) {
		try {
			const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });

			if (!conversation) {
				return res.status(404).json({ error: 'Session not found' });
			}

			return res.json({
				sessionId: conversation.sessionId,
				messages: conversation.messages,
				results: conversation.results,
			});
		} catch (error) {
			logger.error(`Get session history error: ${error.message}`);
			return res.status(500).json({ error: 'Failed to load session history' });
		}
	}
}

module.exports = new SessionController();
