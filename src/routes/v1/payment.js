const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../../config/clerk');
const paymentController = require('../../controllers/paymentController');

// ===================
// PAYMENT ROUTES
// ===================

// Order payment routes
router.post('/orders/:orderId/initiate', requireAuth, paymentController.initiateOrderPayment);
router.post('/orders/verify', requireAuth, paymentController.verifyPayment);

// Wallet payment routes
router.post('/wallet/topup', requireAuth, paymentController.initiateWalletTopup);
router.post('/wallet/verify', requireAuth, paymentController.verifyWalletTopup);

// Refund routes
router.post('/refunds/:paymentId', requireAuth, paymentController.processRefund);

// Payment history and details
router.get('/history', requireAuth, paymentController.getPaymentHistory);
router.get('/:paymentId', requireAuth, paymentController.getPaymentDetails);

// Webhook endpoint (no authentication required)
router.post('/webhook', paymentController.handleWebhook);

// ===================
// UTILITY ROUTES
// ===================

// Get payment methods
router.get('/methods', optionalAuth, (req, res) => {
  const { getPaymentMethods } = require('../../config/razorpay');
  
  const methods = getPaymentMethods();
  const walletMethod = {
    name: 'wallet',
    display_name: 'Wallet',
    description: 'Pay using your wallet balance',
    logo: 'wallet.png'
  };
  
  const codMethod = {
    name: 'cash_on_delivery',
    display_name: 'Cash on Delivery',
    description: 'Pay when your order is delivered',
    logo: 'cod.png'
  };
  
  res.status(200).json({
    success: true,
    message: 'Payment methods retrieved successfully',
    data: {
      methods: [walletMethod, codMethod, ...methods]
    }
  });
});

// Calculate payment fees
router.post('/calculate-fees', optionalAuth, (req, res) => {
  const { calculateFees } = require('../../config/razorpay');
  const { amount, method = 'card' } = req.body;
  
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: 'Amount is required'
    });
  }
  
  const feeCalculation = calculateFees(amount, method);
  
  res.status(200).json({
    success: true,
    message: 'Fee calculation completed',
    data: feeCalculation
  });
});

// Validate payment amount
router.post('/validate-amount', optionalAuth, (req, res) => {
  const { validateAmount } = require('../../config/razorpay');
  const { amount } = req.body;
  
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: 'Amount is required'
    });
  }
  
  const validation = validateAmount(amount);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.error
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Amount is valid',
    data: {
      amount: validation.amount,
      formatted: require('../../config/razorpay').formatAmount(validation.amount)
    }
  });
});

module.exports = router; 