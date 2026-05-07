const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentTransaction = require('../../models/PaymentTransaction.model');

// Create Order - Dynamic keys from frontend
const createOrder = async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'INR', 
      receipt,
      razorpayKeyId,
      razorpayKeySecret,
      customerDetails,
      notes = {}
    } = req.body;

    // Validation
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    if (!razorpayKeyId || !razorpayKeySecret) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay API keys are required'
      });
    }

    // Initialize Razorpay with dynamic keys
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });

    // Create order options (amount in paise = multiply by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes,
      payment_capture: 1
    };

    // Create order in Razorpay
    const order = await razorpay.orders.create(options);

    // Save to database
    const transaction = new PaymentTransaction({
      razorpayOrderId: order.id,
      amount: amount,
      currency: currency,
      receipt: order.receipt,
      status: 'pending',
      customerDetails: customerDetails,
      notes: notes
    });

    await transaction.save();

    // Send response
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: transaction._id
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    } = req.body;

    if (!razorpayKeySecret) {
      return res.status(400).json({
        success: false,
        message: 'Secret key required for verification'
      });
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Compare signatures
    if (generatedSignature === razorpay_signature) {
      // Update transaction in database
      await PaymentTransaction.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          status: 'success'
        }
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      // Update as failed
      await PaymentTransaction.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );

      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Get Order Status
const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const transaction = await PaymentTransaction.findOne({ 
      razorpayOrderId: orderId 
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      status: transaction.status,
      data: transaction
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status'
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getOrderStatus
};