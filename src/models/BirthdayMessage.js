const mongoose = require('mongoose');

const birthdayMessageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['happy_birthday', 'anniversary'], default: 'happy_birthday' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BirthdayMessage', birthdayMessageSchema);