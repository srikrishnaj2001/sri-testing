const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPayment,
  createRefund,
  calculateFees,
  formatAmount,
  validateAmount,
  mapPaymentStatus,
  convertToRupees
} = require('../config/razorpay');

const { Payment, Order, User } = db;

class PaymentController {
  // Initiate payment for order
  async initiateOrderPayment(req, res) {
    try {
      const { orderId } = req.params;
      const { payment_method, callback_url } = req.body;
      const { userId } = req.user;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Find order
      const order = await Order.findOne({
        where: { 
          id: orderId,
          customer_id: userId
        },
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
          }
        ]
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      // Check if order is already paid
      if (order.payment_status === 'paid') {
        return generateErrorResponse(res, 400, 'Order is already paid');
      }

      // Validate payment amount
      const amountValidation = validateAmount(order.getTotalAmount());
      if (!amountValidation.valid) {
        return generateErrorResponse(res, 400, amountValidation.error);
      }

      const paymentAmount = amountValidation.amount;

      // Handle different payment methods
      let paymentResult;
      
      if (payment_method === 'wallet') {
        paymentResult = await this.processWalletPayment(order, userId);
      } else if (payment_method === 'cash_on_delivery') {
        paymentResult = await this.processCODPayment(order, userId);
      } else {
        paymentResult = await this.processGatewayPayment(order, payment_method, callback_url);
      }

      if (!paymentResult.success) {
        return generateErrorResponse(res, 400, paymentResult.error);
      }

      return generateResponse(res, 200, 'Payment initiated successfully', {
        payment: paymentResult.payment,
        order_id: orderId,
        amount: paymentAmount,
        currency: 'INR'
      });

    } catch (error) {
      console.error('Initiate order payment error:', error);
      return generateErrorResponse(res, 500, 'Failed to initiate payment', error.message);
    }
  }

  // Process wallet payment
  async processWalletPayment(order, userId) {
    try {
      const customer = await User.findByPk(userId);
      const totalAmount = order.getTotalAmount();

      // Check wallet balance
      const walletBalance = await customer.getWalletBalance();
      if (walletBalance < totalAmount) {
        return {
          success: false,
          error: 'Insufficient wallet balance'
        };
      }

      // Create payment record
      const payment = await Payment.create({
        order_id: order.id,
        customer_id: userId,
        payment_method: 'wallet',
        payment_type: 'order_payment',
        amount: totalAmount,
        currency: 'INR',
        status: 'completed',
        payment_date: new Date(),
        notes: 'Payment via wallet'
      });

      // Deduct from wallet
      await customer.deductFromWallet(totalAmount, 'order_payment', order.id);

      // Update order payment status
      await order.update({
        payment_status: 'paid',
        transaction_reference: payment.transaction_id
      });

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
  }

  // Process cash on delivery payment
  async processCODPayment(order, userId) {
    try {
      const totalAmount = order.getTotalAmount();

      // Create payment record
      const payment = await Payment.create({
        order_id: order.id,
        customer_id: userId,
        payment_method: 'cash_on_delivery',
        payment_type: 'order_payment',
        amount: totalAmount,
        currency: 'INR',
        status: 'pending',
        notes: 'Cash on delivery payment'
      });

      // Update order payment status
      await order.update({
        payment_status: 'pending',
        transaction_reference: payment.transaction_id
      });

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
  }

  // Process gateway payment (Razorpay)
  async processGatewayPayment(order, paymentMethod, callbackUrl) {
    try {
      const totalAmount = order.getTotalAmount();
      const customer = order.customer;

      // Create Razorpay order
      const razorpayOrderData = {
        amount: totalAmount,
        currency: 'INR',
        receipt: `order_${order.id}_${Date.now()}`,
        notes: {
          order_id: order.id,
          customer_id: customer.id,
          customer_name: customer.getFullName(),
          customer_email: customer.email,
          customer_phone: customer.phone
        }
      };

      const razorpayResult = await createOrder(razorpayOrderData);
      
      if (!razorpayResult.success) {
        return {
          success: false,
          error: razorpayResult.error
        };
      }

      // Create payment record
      const payment = await Payment.create({
        order_id: order.id,
        customer_id: customer.id,
        payment_method: paymentMethod,
        payment_type: 'order_payment',
        amount: totalAmount,
        currency: 'INR',
        status: 'pending',
        razorpay_order_id: razorpayResult.order.id,
        callback_url: callbackUrl,
        notes: `Payment via ${paymentMethod}`
      });

      return {
        success: true,
        payment: {
          ...payment.toJSON(),
          razorpay_order_id: razorpayResult.order.id,
          razorpay_key_id: process.env.RAZORPAY_KEY_ID,
          customer_name: customer.getFullName(),
          customer_email: customer.email,
          customer_phone: customer.phone
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment
  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const { userId } = req.user;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return generateErrorResponse(res, 400, 'Missing payment verification data');
      }

      // Find payment record
      const payment = await Payment.findOne({
        where: {
          razorpay_order_id,
          customer_id: userId
        },
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      if (!payment) {
        return generateErrorResponse(res, 404, 'Payment record not found');
      }

      // Verify signature
      const isValidSignature = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!isValidSignature) {
        await payment.markFailed('Invalid payment signature');
        return generateErrorResponse(res, 400, 'Payment verification failed');
      }

      // Fetch payment details from Razorpay
      const paymentDetails = await fetchPayment(razorpay_payment_id);
      
      if (!paymentDetails.success) {
        await payment.markFailed('Failed to fetch payment details');
        return generateErrorResponse(res, 400, 'Payment verification failed');
      }

      // Update payment record
      await payment.update({
        status: 'completed',
        razorpay_payment_id,
        razorpay_signature,
        payment_date: new Date(),
        processed_at: new Date(),
        gateway_response: paymentDetails.payment
      });

      // Update order payment status
      if (payment.order) {
        await payment.order.update({
          payment_status: 'paid',
          transaction_reference: razorpay_payment_id
        });
      }

      return generateResponse(res, 200, 'Payment verified successfully', {
        payment: payment.getSummary(),
        order_id: payment.order_id,
        transaction_id: payment.transaction_id
      });

    } catch (error) {
      console.error('Verify payment error:', error);
      return generateErrorResponse(res, 500, 'Payment verification failed', error.message);
    }
  }

  // Initiate wallet top-up
  async initiateWalletTopup(req, res) {
    try {
      const { amount, payment_method = 'razorpay', callback_url } = req.body;
      const { userId } = req.user;

      // Validate amount
      const amountValidation = validateAmount(amount);
      if (!amountValidation.valid) {
        return generateErrorResponse(res, 400, amountValidation.error);
      }

      const topupAmount = amountValidation.amount;

      // Get customer details
      const customer = await User.findByPk(userId, {
        attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Create Razorpay order
      const razorpayOrderData = {
        amount: topupAmount,
        currency: 'INR',
        receipt: `wallet_topup_${userId}_${Date.now()}`,
        notes: {
          customer_id: userId,
          customer_name: customer.getFullName(),
          customer_email: customer.email,
          customer_phone: customer.phone,
          purpose: 'wallet_topup'
        }
      };

      const razorpayResult = await createOrder(razorpayOrderData);
      
      if (!razorpayResult.success) {
        return generateErrorResponse(res, 400, razorpayResult.error);
      }

      // Create payment record
      const payment = await Payment.create({
        customer_id: userId,
        payment_method,
        payment_type: 'wallet_topup',
        amount: topupAmount,
        currency: 'INR',
        status: 'pending',
        razorpay_order_id: razorpayResult.order.id,
        callback_url,
        notes: `Wallet top-up of ${formatAmount(topupAmount)}`
      });

      return generateResponse(res, 200, 'Wallet top-up initiated successfully', {
        payment: {
          ...payment.toJSON(),
          razorpay_order_id: razorpayResult.order.id,
          razorpay_key_id: process.env.RAZORPAY_KEY_ID,
          customer_name: customer.getFullName(),
          customer_email: customer.email,
          customer_phone: customer.phone
        },
        amount: topupAmount,
        currency: 'INR'
      });

    } catch (error) {
      console.error('Initiate wallet topup error:', error);
      return generateErrorResponse(res, 500, 'Failed to initiate wallet top-up', error.message);
    }
  }

  // Verify wallet top-up
  async verifyWalletTopup(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const { userId } = req.user;

      // Find payment record
      const payment = await Payment.findOne({
        where: {
          razorpay_order_id,
          customer_id: userId,
          payment_type: 'wallet_topup'
        }
      });

      if (!payment) {
        return generateErrorResponse(res, 404, 'Payment record not found');
      }

      // Verify signature
      const isValidSignature = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!isValidSignature) {
        await payment.markFailed('Invalid payment signature');
        return generateErrorResponse(res, 400, 'Payment verification failed');
      }

      // Update payment record
      await payment.update({
        status: 'completed',
        razorpay_payment_id,
        razorpay_signature,
        payment_date: new Date(),
        processed_at: new Date()
      });

      // Add to wallet
      const customer = await User.findByPk(userId);
      await customer.addToWallet(payment.amount, 'wallet_topup', payment.id);

      return generateResponse(res, 200, 'Wallet top-up verified successfully', {
        payment: payment.getSummary(),
        wallet_balance: await customer.getWalletBalance(),
        transaction_id: payment.transaction_id
      });

    } catch (error) {
      console.error('Verify wallet topup error:', error);
      return generateErrorResponse(res, 500, 'Wallet top-up verification failed', error.message);
    }
  }

  // Process refund
  async processRefund(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const { userId, userType } = req.user;

      if (!paymentId) {
        return generateErrorResponse(res, 400, 'Payment ID is required');
      }

      // Find payment
      const payment = await Payment.findByPk(paymentId, {
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      if (!payment) {
        return generateErrorResponse(res, 404, 'Payment not found');
      }

      // Check authorization (only admin or payment owner)
      if (userType !== 'admin' && payment.customer_id !== userId) {
        return generateErrorResponse(res, 403, 'Unauthorized to process refund');
      }

      // Check if payment can be refunded
      if (!payment.canRefund()) {
        return generateErrorResponse(res, 400, 'Payment cannot be refunded');
      }

      const refundAmount = amount || payment.getRefundableAmount();

      // Validate refund amount
      const amountValidation = validateAmount(refundAmount);
      if (!amountValidation.valid) {
        return generateErrorResponse(res, 400, amountValidation.error);
      }

      // Process refund with Razorpay
      let refundResult;
      
      if (payment.payment_method === 'wallet') {
        // For wallet payments, add money back to wallet
        const customer = await User.findByPk(payment.customer_id);
        await customer.addToWallet(refundAmount, 'refund', payment.id);
        
        refundResult = {
          success: true,
          refund: {
            id: `wallet_refund_${Date.now()}`,
            amount: refundAmount,
            status: 'processed'
          }
        };
      } else if (payment.razorpay_payment_id) {
        refundResult = await createRefund(payment.razorpay_payment_id, {
          amount: refundAmount,
          notes: { reason },
          receipt: `refund_${payment.id}_${Date.now()}`
        });
      } else {
        return generateErrorResponse(res, 400, 'Cannot process refund for this payment method');
      }

      if (!refundResult.success) {
        return generateErrorResponse(res, 400, refundResult.error);
      }

      // Update payment record
      await payment.processRefund(refundAmount, reason, refundResult.refund.id);

      // Update order status if full refund
      if (payment.order && payment.status === 'refunded') {
        await payment.order.update({
          payment_status: 'refunded',
          order_status: 'cancelled'
        });
      }

      return generateResponse(res, 200, 'Refund processed successfully', {
        refund: {
          payment_id: payment.id,
          refund_id: refundResult.refund.id,
          amount: refundAmount,
          reason,
          status: 'processed'
        }
      });

    } catch (error) {
      console.error('Process refund error:', error);
      return generateErrorResponse(res, 500, 'Failed to process refund', error.message);
    }
  }

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const { userId } = req.user;
      const { 
        page = 1, 
        limit = 20, 
        payment_type,
        status,
        payment_method,
        date_from,
        date_to 
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {
        customer_id: userId
      };
      
      if (payment_type) {
        whereConditions.payment_type = payment_type;
      }
      
      if (status) {
        whereConditions.status = status;
      }
      
      if (payment_method) {
        whereConditions.payment_method = payment_method;
      }
      
      if (date_from || date_to) {
        whereConditions.created_at = {};
        if (date_from) {
          whereConditions.created_at[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          whereConditions.created_at[Op.lte] = new Date(date_to);
        }
      }

      // Get payments
      const { count, rows: payments } = await Payment.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Order,
            as: 'order',
            attributes: ['id', 'order_number', 'order_status'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      return generateResponse(res, 200, 'Payment history retrieved successfully', {
        payments,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit),
          has_next: page * limit < count,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve payment history', error.message);
    }
  }

  // Get payment details
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;
      const { userId, userType } = req.user;

      if (!paymentId) {
        return generateErrorResponse(res, 400, 'Payment ID is required');
      }

      // Build where conditions
      const whereConditions = { id: paymentId };
      
      // If not admin, only show own payments
      if (userType !== 'admin') {
        whereConditions.customer_id = userId;
      }

      const payment = await Payment.findOne({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
          },
          {
            model: Order,
            as: 'order',
            attributes: ['id', 'order_number', 'order_status', 'order_type'],
            required: false
          }
        ]
      });

      if (!payment) {
        return generateErrorResponse(res, 404, 'Payment not found');
      }

      return generateResponse(res, 200, 'Payment details retrieved successfully', {
        payment
      });

    } catch (error) {
      console.error('Get payment details error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve payment details', error.message);
    }
  }

  // Handle payment webhook
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const body = req.body;

      // Verify webhook signature
      const isValidSignature = verifyWebhookSignature(JSON.stringify(body), signature);
      
      if (!isValidSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const { event, payload } = body;

      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload.payment.entity);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(payload.refund.entity);
          break;
        default:
          console.log('Unhandled webhook event:', event);
      }

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error('Webhook handling error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  // Handle payment captured webhook
  async handlePaymentCaptured(paymentData) {
    try {
      const payment = await Payment.findOne({
        where: { razorpay_payment_id: paymentData.id }
      });

      if (payment) {
        await payment.update({
          status: 'completed',
          payment_date: new Date(),
          processed_at: new Date(),
          webhook_data: paymentData
        });
      }
    } catch (error) {
      console.error('Handle payment captured error:', error);
    }
  }

  // Handle payment failed webhook
  async handlePaymentFailed(paymentData) {
    try {
      const payment = await Payment.findOne({
        where: { razorpay_payment_id: paymentData.id }
      });

      if (payment) {
        await payment.update({
          status: 'failed',
          failure_reason: paymentData.error_description,
          webhook_data: paymentData
        });
      }
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  // Handle refund processed webhook
  async handleRefundProcessed(refundData) {
    try {
      const payment = await Payment.findOne({
        where: { razorpay_payment_id: refundData.payment_id }
      });

      if (payment) {
        const refundAmount = convertToRupees(refundData.amount);
        await payment.processRefund(refundAmount, 'Refund processed', refundData.id);
      }
    } catch (error) {
      console.error('Handle refund processed error:', error);
    }
  }
}

module.exports = new PaymentController(); 