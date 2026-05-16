const EmailConfig = require('../models/EmailConfig');
const BirthdayLog = require('../models/BirthdayLog');
const BirthdayMessage = require('../models/BirthdayMessage');
const emailService = require('../services/emailService');
const birthdayCron = require('../cron/birthdayCron');

// ==================== EMAIL CONFIG ====================

exports.saveConfig = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, mailFrom } = req.body;
    
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !mailFrom) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }
    
    await EmailConfig.updateMany({}, { isActive: false });
    
    const config = new EmailConfig({ smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, mailFrom, isActive: true });
    await config.save();
    
    const { smtpPass: _, ...configData } = config.toObject();
    res.json({ success: true, message: 'Configuration saved', data: configData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const config = await EmailConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!config) return res.status(404).json({ success: false, error: 'No config found' });
    
    const { smtpPass, ...configData } = config.toObject();
    res.json({ success: true, data: configData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BIRTHDAY MESSAGES ====================

exports.saveMessage = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, error: 'Title and message required' });
    
    const newMessage = new BirthdayMessage({ title, message, type, createdBy: req.user?._id });
    await newMessage.save();
    res.json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await BirthdayMessage.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const message = await BirthdayMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const message = await BirthdayMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    await BirthdayMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SEND BIRTHDAY EMAIL ====================

exports.sendBirthdayEmail = async (req, res) => {
  try {
    const { employeeId, employeeName, employeeEmail, dateOfBirth, messageId } = req.body;
    const year = new Date().getFullYear();
    
    if (!employeeId || !employeeName || !employeeEmail || !dateOfBirth) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Check if already sent
    const existing = await BirthdayLog.findOne({ employeeId, year });
    if (existing?.emailSent) {
      return res.status(400).json({ success: false, error: 'Birthday email already sent this year' });
    }
    
    // Get message template
    let messageContent = 'Wishing you a fantastic birthday! 🎂🎉';
    let messageTitle = 'Happy Birthday!';
    
    if (messageId) {
      const msg = await BirthdayMessage.findById(messageId);
      if (msg) {
        messageTitle = msg.title;
        messageContent = msg.message;
      }
    }
    
    // Send email
    const result = await emailService.sendEmail(employeeEmail, `🎂 ${messageTitle}`, `<h2>${messageContent}</h2><p>Have a wonderful day!</p>`);
    
    if (!result.success) throw new Error(result.error);
    
    // Save log
    const log = new BirthdayLog({
      employeeId, employeeName, employeeEmail, dateOfBirth, year,
      messageTitle, messageContent, emailSent: true, emailSentAt: new Date(), status: 'sent'
    });
    await log.save();
    
    res.json({ success: true, message: 'Birthday email sent successfully!', logId: log._id });
  } catch (error) {
    // Save failed log
    await BirthdayLog.create({
      ...req.body, year: new Date().getFullYear(),
      emailSent: false, errorMessage: error.message, status: 'failed'
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== BIRTHDAY LOGS ====================

exports.getLogs = async (req, res) => {
  try {
    const { year, status, employeeId } = req.query;
    const filter = {};
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    
    const logs = await BirthdayLog.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getLogStats = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const total = await BirthdayLog.countDocuments({ year });
    const sent = await BirthdayLog.countDocuments({ year, status: 'sent' });
    const failed = await BirthdayLog.countDocuments({ year, status: 'failed' });
    
    res.json({ success: true, data: { year, total, sent, failed, successRate: total ? ((sent / total) * 100).toFixed(2) : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEST ====================

exports.sendTestEmail = async (req, res) => {
  try {
    const { to, config } = req.body;
    if (!to || !config) return res.status(400).json({ success: false, error: 'Missing required fields' });
    
    const result = await emailService.sendTestEmail(to, config);
    res.json({ success: true, message: 'Test email sent!', messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.testRoute = (req, res) => {
  res.json({ success: true, message: 'Email API working!', timestamp: new Date().toISOString() });
};


exports.manualTriggerBirthday = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log(`🎯 Manual trigger for employee: ${employeeId}`);
    
    const result = await birthdayCron.manualTrigger(employeeId);
    
    res.json({ success: true, message: 'Birthday email triggered!', result });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
