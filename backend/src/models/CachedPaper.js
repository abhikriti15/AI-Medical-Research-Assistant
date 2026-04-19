const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  externalId: {
    type: String,
    required: true,
    unique: true,
  },
  source: {
    type: String,
    enum: ['PubMed', 'OpenAlex'],
    required: true,
  },
  title: String,
  abstract: String,
  authors: [String],
  year: Number,
  doi: String,
  url: String,
  journalName: String,
  citationCount: Number,
  embedding: [Number],
  relevanceScores: {
    semantic: Number,
    keyword: Number,
    credibility: Number,
    final: Number,
  },
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

paperSchema.index({ externalId: 1 });
paperSchema.index({ source: 1 });
paperSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
paperSchema.index({ 'relevanceScores.final': -1 });

module.exports = mongoose.model('CachedPaper', paperSchema);