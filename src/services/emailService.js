const nodemailer = require('nodemailer');
const EmailConfig = require('../models/EmailConfig');

class EmailService {
  async getTransporter() {
    const config = await EmailConfig.findOne({ isActive: true });
    if (!config) throw new Error('No email config found');
    
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: config.smtpPort === '465',
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
  }

  async sendEmail(to, subject, html) {
    const transporter = await this.getTransporter();
    const config = await EmailConfig.findOne({ isActive: true });
    return await transporter.sendMail({ from: config.mailFrom, to, subject, html });
  }

  async sendTestEmail(to, testConfig) {
    const transporter = nodemailer.createTransport({
      host: testConfig.smtpHost,
      port: parseInt(testConfig.smtpPort),
      secure: testConfig.smtpPort === '465',
      auth: { user: testConfig.smtpUser, pass: testConfig.smtpPass },
    });
    return await transporter.sendMail({ from: testConfig.mailFrom, to, subject: 'Test Email', html: '<h2>Test Successful!</h2>' });
  }
}

module.exports = new EmailService();