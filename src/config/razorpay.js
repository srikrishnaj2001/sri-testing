const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay configuration
const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret',
  currency: process.env.RAZORPAY_CURRENCY || 'INR',
  webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret'
};

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: razorpayConfig.key_id,
  key_secret: razorpayConfig.key_secret
});

/**
 * Create Razorpay order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Razorpay order
 */
const createOrder = async (orderData) => {
  try {
    const options = {
      amount: Math.round(parseFloat(orderData.amount) * 100), // Convert to paise
      currency: orderData.currency || razorpayConfig.currency,
      receipt: orderData.receipt || `order_${Date.now()}`,
      payment_capture: 1, // Auto capture
      notes: orderData.notes || {}
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      order
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentData - Payment verification data
 * @returns {boolean} Is signature valid
 */
const verifyPaymentSignature = (paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayConfig.key_secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error('Payment signature verification error:', error);
    return false;
  }
};

/**
 * Verify Razorpay webhook signature
 * @param {string} rawBody - Raw webhook body
 * @param {string} signature - Webhook signature
 * @returns {boolean} Is webhook signature valid
 */
const verifyWebhookSignature = (rawBody, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', razorpayConfig.webhook_secret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Capture payment (for authorized payments)
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to capture in paise
 * @returns {Promise<Object>} Capture result
 */
const capturePayment = async (paymentId, amount) => {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount);
    return {
      success: true,
      payment
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {Object} refundData - Refund data
 * @returns {Promise<Object>} Refund result
 */
const createRefund = async (paymentId, refundData) => {
  try {
    const options = {
      amount: Math.round(parseFloat(refundData.amount) * 100), // Convert to paise
      speed: refundData.speed || 'normal', // normal, optimum
      notes: refundData.notes || {},
      receipt: refundData.receipt || `refund_${Date.now()}`
    };

    const refund = await razorpay.payments.refund(paymentId, options);
    return {
      success: true,
      refund
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fetch refund details
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<Object>} Refund details
 */
const fetchRefund = async (paymentId, refundId) => {
  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return {
      success: true,
      refund
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get payment methods
 * @returns {Array} Available payment methods
 */
const getPaymentMethods = () => {
  return [
    {
      name: 'card',
      display_name: 'Credit/Debit Card',
      description: 'Pay using your credit or debit card',
      logo: 'card.png'
    },
    {
      name: 'netbanking',
      display_name: 'Net Banking',
      description: 'Pay using your bank account',
      logo: 'netbanking.png'
    },
    {
      name: 'wallet',
      display_name: 'Wallet',
      description: 'Pay using digital wallets',
      logo: 'wallet.png'
    },
    {
      name: 'upi',
      display_name: 'UPI',
      description: 'Pay using UPI',
      logo: 'upi.png'
    },
    {
      name: 'emi',
      display_name: 'EMI',
      description: 'Pay in easy installments',
      logo: 'emi.png'
    }
  ];
};

/**
 * Calculate payment fees
 * @param {number} amount - Payment amount
 * @param {string} method - Payment method
 * @returns {Object} Fee calculation
 */
const calculateFees = (amount, method = 'card') => {
  const feeStructure = {
    card: 0.02, // 2%
    netbanking: 0.015, // 1.5%
    wallet: 0.01, // 1%
    upi: 0.005, // 0.5%
    emi: 0.025 // 2.5%
  };

  const feeRate = feeStructure[method] || feeStructure.card;
  const fees = parseFloat(amount) * feeRate;
  const gst = fees * 0.18; // 18% GST on fees
  const totalFees = fees + gst;

  return {
    amount: parseFloat(amount),
    fees: parseFloat(fees.toFixed(2)),
    gst: parseFloat(gst.toFixed(2)),
    total_fees: parseFloat(totalFees.toFixed(2)),
    net_amount: parseFloat((amount - totalFees).toFixed(2))
  };
};

/**
 * Format amount for display
 * @param {number} amount - Amount in rupees
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
const formatAmount = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  });

  return formatter.format(amount);
};

/**
 * Convert amount to paise
 * @param {number} amount - Amount in rupees
 * @returns {number} Amount in paise
 */
const convertToPaise = (amount) => {
  return Math.round(parseFloat(amount) * 100);
};

/**
 * Convert amount to rupees
 * @param {number} amount - Amount in paise
 * @returns {number} Amount in rupees
 */
const convertToRupees = (amount) => {
  return parseFloat(amount) / 100;
};

/**
 * Validate payment amount
 * @param {number} amount - Payment amount
 * @returns {Object} Validation result
 */
const validateAmount = (amount) => {
  const minAmount = 1; // Minimum ₹1
  const maxAmount = 500000; // Maximum ₹5,00,000

  if (!amount || isNaN(amount)) {
    return {
      valid: false,
      error: 'Invalid amount'
    };
  }

  const numAmount = parseFloat(amount);

  if (numAmount < minAmount) {
    return {
      valid: false,
      error: `Minimum amount is ${formatAmount(minAmount)}`
    };
  }

  if (numAmount > maxAmount) {
    return {
      valid: false,
      error: `Maximum amount is ${formatAmount(maxAmount)}`
    };
  }

  return {
    valid: true,
    amount: numAmount
  };
};

/**
 * Get payment status from Razorpay status
 * @param {string} razorpayStatus - Razorpay payment status
 * @returns {string} Our payment status
 */
const mapPaymentStatus = (razorpayStatus) => {
  const statusMap = {
    'created': 'pending',
    'authorized': 'processing',
    'captured': 'completed',
    'refunded': 'refunded',
    'failed': 'failed'
  };

  return statusMap[razorpayStatus] || 'pending';
};

module.exports = {
  razorpay,
  razorpayConfig,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPayment,
  capturePayment,
  createRefund,
  fetchRefund,
  getPaymentMethods,
  calculateFees,
  formatAmount,
  convertToPaise,
  convertToRupees,
  validateAmount,
  mapPaymentStatus
}; 