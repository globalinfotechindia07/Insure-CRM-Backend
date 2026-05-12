// cron/birthdayCron.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Administrative = require('../models/Administrative');
const BirthdayLog = require('../models/BirthdayLog');
const emailService = require('../services/emailService');

class BirthdayCronJob {
  constructor() {
    this.isRunning = false;
  }

  // Check birthdays daily at 8:00 AM
  startBirthdayChecker() {
    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('Running birthday check cron job...', new Date().toISOString());
      await this.checkAndSendBirthdayWishes();
    });

    // Also run every hour for testing (optional)
    cron.schedule('0 * * * *', async () => {
      console.log('Hourly birthday check...', new Date().toISOString());
      await this.checkAndSendBirthdayWishes();
    });

    console.log('Birthday cron job started');
  }

  async checkAndSendBirthdayWishes() {
    if (this.isRunning) {
      console.log('Birthday check already running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      const today = new Date();
      const todayDate = today.getDate();
      const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
      const currentYear = today.getFullYear();

      console.log(`Checking birthdays for ${todayDate}/${todayMonth}/${currentYear}`);

      // Find all employees whose birthday matches today
      // Using MongoDB aggregation to filter by day and month
      const employees = await Administrative.aggregate([
        {
          $match: {
            'basicDetails.dateOfBirth': { $exists: true, $ne: null },
            delete: false
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

      console.log(`Found ${employees.length} employees with birthday today`);

      for (const employee of employees) {
        await this.sendBirthdayWish(employee, currentYear);
      }

    } catch (error) {
      console.error('Error in birthday checker:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async sendBirthdayWish(employee, currentYear) {
    try {
      const basicDetails = employee.basicDetails;
      const employeeEmail = basicDetails.email;
      const employeeName = `${basicDetails.firstName} ${basicDetails.lastName || ''}`.trim();
      const dateOfBirth = basicDetails.dateOfBirth;

      if (!employeeEmail) {
        console.log(`No email found for employee: ${employeeName}`);
        return;
      }

      // Check if we already sent birthday email this year
      const existingLog = await BirthdayLog.findOne({
        employeeId: employee._id,
        year: currentYear
      });

      if (existingLog && existingLog.emailSent) {
        console.log(`Birthday email already sent for ${employeeName} in ${currentYear}`);
        return;
      }

      // Send birthday email
      const result = await emailService.sendBirthdayEmail(
        employeeEmail,
        employeeName,
        dateOfBirth
      );

      // Log the attempt
      const logData = {
        employeeId: employee._id,
        employeeName: employeeName,
        email: employeeEmail,
        dateOfBirth: dateOfBirth,
        year: currentYear,
        emailSent: result.success,
        status: result.success ? 'sent' : 'failed',
        emailSentAt: result.success ? new Date() : null,
        errorMessage: result.success ? null : result.error
      };

      if (existingLog) {
        await BirthdayLog.updateOne({ _id: existingLog._id }, logData);
      } else {
        await BirthdayLog.create(logData);
      }

      if (result.success) {
        console.log(`Birthday email sent successfully to ${employeeName} (${employeeEmail})`);
      } else {
        console.error(`Failed to send birthday email to ${employeeName}: ${result.error}`);
      }

    } catch (error) {
      console.error(`Error processing birthday for employee ${employee._id}:`, error);
    }
  }

  // Manual trigger for testing
  async manualBirthdayCheck(employeeId) {
    const employee = await Administrative.findById(employeeId);
    if (!employee || !employee.basicDetails?.dateOfBirth) {
      throw new Error('Employee not found or no date of birth');
    }

    const currentYear = new Date().getFullYear();
    await this.sendBirthdayWish(employee, currentYear);
    return { success: true, message: 'Birthday check triggered' };
  }
}

module.exports = new BirthdayCronJob();