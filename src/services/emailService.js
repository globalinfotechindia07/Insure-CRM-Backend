// services/emailService.js
const nodemailer = require('nodemailer');
const EmailConfig = require('../models/EmailConfig');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  async initializeTransporter() {
    const config = await EmailConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!config) {
      throw new Error('No email configuration found');
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: config.smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    return this.transporter;
  }

  async sendBirthdayEmail(employeeEmail, employeeName, dateOfBirth) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const config = await EmailConfig.findOne({ isActive: true });
      if (!config) {
        throw new Error('Email configuration not found');
      }

      const age = this.calculateAge(dateOfBirth);
      const mailOptions = {
        from: config.mailFrom,
        to: employeeEmail,
        subject: `🎂 Happy Birthday ${employeeName}! 🎉`,
        html: this.getBirthdayEmailTemplate(employeeName, age)
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending birthday email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendTestEmail(to, testConfig) {
    try {
      const transporter = nodemailer.createTransport({
        host: testConfig.smtpHost,
        port: parseInt(testConfig.smtpPort),
        secure: testConfig.smtpPort === '465',
        auth: {
          user: testConfig.smtpUser,
          pass: testConfig.smtpPass,
        },
      });

      const mailOptions = {
        from: testConfig.mailFrom,
        to: to,
        subject: 'Test Email - Birthday Notification System',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p>Configuration used:</p>
          <ul>
            <li>SMTP Host: ${testConfig.smtpHost}</li>
            <li>SMTP Port: ${testConfig.smtpPort}</li>
            <li>From: ${testConfig.mailFrom}</li>
          </ul>
          <p>Birthday notification system is ready to send wishes! 🎂</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Test email error:', error);
      return { success: false, error: error.message };
    }
  }

  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  getBirthdayEmailTemplate(name, age) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
          <h1 style="color: #764ba2; margin-bottom: 20px;">🎂 Happy Birthday! 🎉</h1>
          <h2 style="color: #333;">Dear ${name},</h2>
          <p style="font-size: 18px; color: #555; line-height: 1.6;">
            Wishing you a fantastic birthday! May your ${age}th year bring you 
            abundant joy, success, and wonderful memories.
          </p>
          <div style="margin: 30px 0;">
            <div style="font-size: 48px;">🎈🎁🎂</div>
          </div>
          <p style="color: #777; font-style: italic;">
            "Age is merely the number of years the world has been enjoying you!"
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated birthday wish from our HR system.
          </p>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();