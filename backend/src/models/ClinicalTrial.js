const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
  nctNumber: {
    type: String,
    required: true,
    unique: true,
  },
  title: String,
  condition: String,
  status: String,
  phase: String,
  recruiterStatus: String,
  eligibility: {
    minAge: String,
    maxAge: String,
    gender: String,
    criteria: [String],
  },
  location: {
    countries: [String],
    sites: [String],
  },
  contact: {
    name: String,
    email: String,
    phone: String,
  },
  startDate: Date,
  estimatedEndDate: Date,
  url: String,
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

trialSchema.index({ nctNumber: 1 });
trialSchema.index({ condition: 1 });
trialSchema.index({ recruiterStatus: 1 });
trialSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ClinicalTrial', trialSchema);