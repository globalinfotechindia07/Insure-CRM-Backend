const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/Payment/payment.controller');

// Routes
router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);
router.get('/order-status/:orderId', paymentController.getOrderStatus);

module.exports = router;