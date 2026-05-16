const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');

// Email Config
router.post('/config', emailController.saveConfig);
router.get('/config', emailController.getConfig);

// Birthday Messages
router.post('/message', emailController.saveMessage);
router.get('/messages', emailController.getMessages);
router.get('/message/:id', emailController.getMessageById);
router.put('/message/:id', emailController.updateMessage);
router.delete('/message/:id', emailController.deleteMessage);

// Send Birthday
router.post('/send-birthday', emailController.sendBirthdayEmail);

// Logs
router.get('/logs', emailController.getLogs);
router.get('/stats', emailController.getLogStats);

// Test
router.post('/test', emailController.sendTestEmail);
router.get('/test', emailController.testRoute);

router.post('/trigger-birthday/:employeeId', emailController.manualTriggerBirthday);

module.exports = router;