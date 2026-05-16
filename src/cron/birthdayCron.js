const cron = require('node-cron');
const mongoose = require('mongoose');
const Administrative = require('../models/Staffs/administrative/administrative.model');
const BirthdayLog = require('../models/BirthdayLog');
const EmailConfig = require('../models/EmailConfig');
const BirthdayMessage = require('../models/BirthdayMessage');
const emailService = require('../services/emailService');

class BirthdayCron {
  constructor() {
    this.isRunning = false;
  }

  start() {
    // Har roz subah 8:00 baje check karega
    cron.schedule('0 8 * * *', async () => {
      console.log('🎂 Running birthday check cron job...', new Date().toISOString());
      await this.checkAndSendBirthdayWishes();
    });

    // Test ke liye har minute (Sirf development mein)
    if (process.env.NODE_ENV !== 'production') {
      cron.schedule('* * * * *', async () => {
        console.log('🎂 [TEST] Running birthday check...', new Date().toISOString());
        await this.checkAndSendBirthdayWishes();
      });
    }

    console.log('✅ Birthday cron job started');
  }

  async checkAndSendBirthdayWishes() {
    if (this.isRunning) {
      console.log('⏳ Birthday check already running, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const today = new Date();
      const todayDate = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      console.log(`📅 Checking birthdays for ${todayDate}/${todayMonth}/${currentYear}`);

      // Aaj birthday wale employees find karo
      const employees = await Administrative.aggregate([
        {
          $match: {
            'basicDetails.dateOfBirth': { $exists: true, $ne: null },
            delete: { $ne: true }
          }
        },
        {
          $addFields: {
            birthDay: { $dayOfMonth: '$basicDetails.dateOfBirth' },
            birthMonth: { $month: '$basicDetails.dateOfBirth' }
          }
        },
        {
          $match: {
            birthDay: todayDate,
            birthMonth: todayMonth
          }
        }
      ]);

      console.log(`🎯 Found ${employees.length} employees with birthday today`);

      if (employees.length === 0) {
        console.log('No birthdays today');
        this.isRunning = false;
        return;
      }

      // Email config check
      const emailConfig = await EmailConfig.findOne({ isActive: true });
      if (!emailConfig) {
        console.log('❌ No active email configuration found');
        this.isRunning = false;
        return;
      }

      // Birthday message template
      const messageTemplate = await BirthdayMessage.findOne({ isActive: true, type: 'birthday' }).sort({ createdAt: -1 });

      for (const employee of employees) {
        await this.sendBirthdayWish(employee, currentYear, messageTemplate);
      }

    } catch (error) {
      console.error('❌ Error in birthday checker:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async sendBirthdayWish(employee, currentYear, messageTemplate) {
    try {
      const basicDetails = employee.basicDetails;
      const employeeEmail = basicDetails.email;
      const employeeName = `${basicDetails.firstName} ${basicDetails.middleName || ''} ${basicDetails.lastName || ''}`.trim();
      const employeeId = employee._id;
      const dateOfBirth = basicDetails.dateOfBirth;

      if (!employeeEmail) {
        console.log(`❌ No email found for employee: ${employeeName}`);
        return;
      }

      // Check if already sent this year
      const existingLog = await BirthdayLog.findOne({ employeeId, year: currentYear });
      if (existingLog?.emailSent) {
        console.log(`⏭️ Birthday email already sent for ${employeeName} in ${currentYear}`);
        return;
      }

      // Message content
      const messageTitle = messageTemplate?.title || 'Happy Birthday!';
      const messageContent = messageTemplate?.message || 'Wishing you a fantastic birthday from the entire team! 🎂🎉';

      console.log(`📧 Sending birthday email to: ${employeeName} (${employeeEmail})`);

      // Send email
      const result = await emailService.sendEmail(
        employeeEmail,
        `🎂 ${messageTitle}`,
        this.getBirthdayEmailTemplate(employeeName, messageContent)
      );

      // Save log
      const logData = {
        employeeId,
        employeeName,
        employeeEmail,
        messageTitle,
        messageContent,
        dateOfBirth,
        year: currentYear,
        emailSent: result.success,
        emailSentAt: result.success ? new Date() : null,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.success ? null : result.error
      };

      if (existingLog) {
        await BirthdayLog.updateOne({ _id: existingLog._id }, logData);
      } else {
        await BirthdayLog.create(logData);
      }

      if (result.success) {
        console.log(`✅ Birthday email sent to ${employeeName}`);
      } else {
        console.log(`❌ Failed to send to ${employeeName}: ${result.error}`);
      }

    } catch (error) {
      console.error(`❌ Error sending birthday to ${employee._id}:`, error.message);
    }
  }

  getBirthdayEmailTemplate(name, message) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
          <h1 style="color: #764ba2;">🎂 Happy Birthday! 🎉</h1>
          <h2 style="color: #333;">Dear ${name},</h2>
          <div style="font-size: 18px; color: #555; line-height: 1.6; margin: 20px 0;">
            ${message}
          </div>
          <div style="margin: 30px 0;">
            <div style="font-size: 48px;">🎈🎁🎂</div>
          </div>
          <hr style="margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated birthday wish from our HR system.</p>
        </div>
      </div>
    `;
  }

  async manualTrigger(employeeId) {
  const employee = await Administrative.findById(employeeId);
  if (!employee) throw new Error('Employee not found');
  
  const currentYear = new Date().getFullYear();
  const messageTemplate = await BirthdayMessage.findOne({ isActive: true, type: 'birthday' });
  
  await this.sendBirthdayWish(employee, currentYear, messageTemplate);
  return { success: true, message: 'Birthday email sent' };
}
}

module.exports = new BirthdayCron();