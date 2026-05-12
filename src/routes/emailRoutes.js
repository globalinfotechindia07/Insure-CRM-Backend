const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Temporary in-memory storage (no database required)
let emailConfig = null;

// ==================== EMAIL CONFIGURATION ====================

// POST: Save email configuration
router.post('/config', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, mailFrom } = req.body;
    
    // Validate required fields
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !mailFrom) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: smtpHost, smtpPort, smtpUser, smtpPass, mailFrom' 
      });
    }
    
    // Save config in memory
    emailConfig = {
      smtpHost,
      smtpPort,
      smtpSecure: smtpSecure === true || smtpSecure === 'true',
      smtpUser,
      smtpPass,
      mailFrom,
      updatedAt: new Date()
    };
    
    console.log('Email configuration saved:', { ...emailConfig, smtpPass: '******' });
    
    res.status(200).json({ 
      success: true, 
      message: 'Email configuration saved successfully',
      data: {
        smtpHost,
        smtpPort,
        smtpUser,
        mailFrom
      }
    });
  } catch (error) {
    console.error('Error saving email config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Get active email configuration
router.get('/config', async (req, res) => {
  try {
    if (!emailConfig) {
      return res.status(404).json({ success: false, error: 'No email configuration found' });
    }
    
    // Don't send password in response
    const { smtpPass, ...configWithoutPassword } = emailConfig;
    res.json({ success: true, data: configWithoutPassword });
  } catch (error) {
    console.error('Error getting email config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST: Send test email
router.post('/test', async (req, res) => {
  try {
    const { to, config } = req.body;
    
    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email is required' });
    }
    
    if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
      return res.status(400).json({ success: false, error: 'Complete email configuration is required' });
    }
    
    console.log('Sending test email to:', to);
    console.log('Using SMTP host:', config.smtpHost);
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: parseInt(config.smtpPort),
      secure: config.smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    // Send email
    const mailOptions = {
      from: config.mailFrom,
      to: to,
      subject: 'Test Email - Birthday Notification System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: white;">✨ Test Email Successful! ✨</h2>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Your email configuration is working correctly!</p>
            <hr style="margin: 20px 0;">
            <p><strong>Configuration Details:</strong></p>
            <ul style="background: white; padding: 15px; border-radius: 5px;">
              <li>SMTP Host: ${config.smtpHost}</li>
              <li>SMTP Port: ${config.smtpPort}</li>
              <li>From Email: ${config.mailFrom}</li>
            </ul>
            <p style="color: #4CAF50; font-weight: bold;">✅ Birthday notification system is ready to send wishes! 🎂</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully! Check your inbox.',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Test email error details:', error);
    
    // Better error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and password. For Gmail, use App Password.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Connection failed. Please check SMTP host and port.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Please check if SMTP server is accessible.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error.code
    });
  }
});

// GET: Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Email routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;