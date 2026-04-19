const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  sessionId: {
    type: String,
    unique: true,
    required: true,
  },
  messages: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
      },
      content: String,
      timestamp: { type: Date, default: Date.now },
      metadata: {
        disease: String,
        queryType: String,
        expandedQuery: String,
        responseTime: Number, // milliseconds
      },
    },
  ],
  context: {
    currentDisease: String,
    previousQueries: [String],
    location: String,
  },
  results: [
    {
      query: String,
      paperIds: [mongoose.Schema.Types.ObjectId],
      trialIds: [mongoose.Schema.Types.ObjectId],
      rankedAt: Date,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);