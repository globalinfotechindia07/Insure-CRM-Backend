// models/EmailConfig.js
const mongoose = require('mongoose');

const emailConfigSchema = new mongoose.Schema({
  smtpHost: { type: String, required: true, default: 'smtp.gmail.com' },
  smtpPort: { type: String, required: true, default: '465' },
  smtpSecure: { type: Boolean, default: true },
  smtpUser: { type: String, required: true },
  smtpPass: { type: String, required: true },
  mailFrom: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmailConfig', emailConfigSchema);