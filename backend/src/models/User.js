const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  username: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
  preferences: {
    resultLimit: { type: Number, default: 6 },
    minYear: { type: Number, default: 2018 },
    focusAreas: [String],
    theme: { type: String, default: 'light' },
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  apiQuotaUsed: { type: Number, default: 0 },
  apiQuotaLimit: { type: Number, default: 100 },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);