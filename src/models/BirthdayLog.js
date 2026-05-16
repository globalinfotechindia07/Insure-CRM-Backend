// models/BirthdayLog.js
const mongoose = require('mongoose');

const birthdayLogSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Types.ObjectId, ref: 'Administrative', required: true },
  employeeName: { type: String, required: true },
  email: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  year: { type: Number, required: true },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  errorMessage: { type: String },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
}, { timestamps: true });

// Compound index to ensure we don't send duplicate birthday emails in the same year
birthdayLogSchema.index({ employeeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('BirthdayLog', birthdayLogSchema);