const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      comment: 'Unique transaction identifier'
    },
    order_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Related order ID (null for wallet top-ups)'
    },
    customer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Customer making the payment'
    },
    payment_method: {
      type: DataTypes.ENUM([
        'razorpay',
        'stripe', 
        'paypal',
        'wallet',
        'cash_on_delivery',
        'bank_transfer',
        'card'
      ]),
      allowNull: false,
      comment: 'Payment method used'
    },
    payment_type: {
      type: DataTypes.ENUM([
        'order_payment',
        'wallet_topup',
        'refund',
        'delivery_fee',
        'tip',
        'subscription'
      ]),
      defaultValue: 'order_payment',
      allowNull: false,
      comment: 'Type of payment'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Payment amount'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
      allowNull: false,
      comment: 'Currency code'
    },
    status: {
      type: DataTypes.ENUM([
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded'
      ]),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Payment status'
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Razorpay payment ID'
    },
    razorpay_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Razorpay order ID'
    },
    razorpay_signature: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Razorpay signature for verification'
    },
    gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Complete gateway response data'
    },
    payment_details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional payment details'
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for payment failure'
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Amount refunded'
    },
    refund_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for refund'
    },
    refund_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Gateway refund ID'
    },
    fees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Payment gateway fees'
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Tax amount'
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Net amount after fees and tax'
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When payment was completed'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Payment expiry time'
    },
    callback_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Callback URL for payment completion'
    },
    webhook_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Webhook data received from gateway'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of retry attempts'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Customer IP address'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Customer user agent'
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Device information'
    },
    is_international: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Is international payment'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When payment was processed'
    },
    settled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When payment was settled'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['transaction_id']
      },
      {
        fields: ['order_id']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['payment_method']
      },
      {
        fields: ['payment_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['razorpay_payment_id']
      },
      {
        fields: ['razorpay_order_id']
      },
      {
        fields: ['payment_date']
      },
      {
        fields: ['created_at']
      }
    ],
    scopes: {
      // Completed payments
      completed: {
        where: {
          status: 'completed'
        }
      },
      // Pending payments
      pending: {
        where: {
          status: 'pending'
        }
      },
      // Failed payments
      failed: {
        where: {
          status: 'failed'
        }
      },
      // Order payments
      orderPayments: {
        where: {
          payment_type: 'order_payment'
        }
      },
      // Wallet top-ups
      walletTopups: {
        where: {
          payment_type: 'wallet_topup'
        }
      },
      // Refunds
      refunds: {
        where: {
          payment_type: 'refund'
        }
      },
      // Today's payments
      today: {
        where: {
          created_at: {
            [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      },
      // This month's payments
      thisMonth: {
        where: {
          created_at: {
            [sequelize.Sequelize.Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }
    },
    hooks: {
      beforeCreate: async (payment) => {
        // Generate transaction ID if not provided
        if (!payment.transaction_id) {
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          payment.transaction_id = `TXN_${timestamp}_${random}`;
        }
        
        // Calculate net amount
        payment.net_amount = parseFloat(payment.amount) - parseFloat(payment.fees || 0) - parseFloat(payment.tax || 0);
        
        // Set expiry time (30 minutes from now)
        if (!payment.expires_at) {
          payment.expires_at = new Date(Date.now() + 30 * 60 * 1000);
        }
      },
      
      beforeUpdate: async (payment) => {
        // Update payment date when status changes to completed
        if (payment.changed('status') && payment.status === 'completed') {
          payment.payment_date = new Date();
          payment.processed_at = new Date();
        }
        
        // Update net amount if amount or fees change
        if (payment.changed('amount') || payment.changed('fees') || payment.changed('tax')) {
          payment.net_amount = parseFloat(payment.amount) - parseFloat(payment.fees || 0) - parseFloat(payment.tax || 0);
        }
      }
    }
  });

  // Instance methods
  Payment.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed fields
    values.is_completed = this.isCompleted();
    values.is_pending = this.isPending();
    values.is_failed = this.isFailed();
    values.can_refund = this.canRefund();
    values.refund_available = this.getRefundableAmount();
    values.is_expired = this.isExpired();
    values.time_remaining = this.getTimeRemaining();
    
    return values;
  };

  // Check if payment is completed
  Payment.prototype.isCompleted = function() {
    return this.status === 'completed';
  };

  // Check if payment is pending
  Payment.prototype.isPending = function() {
    return this.status === 'pending';
  };

  // Check if payment is failed
  Payment.prototype.isFailed = function() {
    return this.status === 'failed';
  };

  // Check if payment can be refunded
  Payment.prototype.canRefund = function() {
    return this.status === 'completed' && 
           parseFloat(this.amount) > parseFloat(this.refund_amount);
  };

  // Get refundable amount
  Payment.prototype.getRefundableAmount = function() {
    return parseFloat(this.amount) - parseFloat(this.refund_amount);
  };

  // Check if payment is expired
  Payment.prototype.isExpired = function() {
    if (!this.expires_at) return false;
    return new Date() > new Date(this.expires_at);
  };

  // Get time remaining for payment
  Payment.prototype.getTimeRemaining = function() {
    if (!this.expires_at || this.isCompleted()) return 0;
    
    const now = new Date();
    const expiry = new Date(this.expires_at);
    const diff = expiry - now;
    
    return Math.max(0, Math.ceil(diff / (1000 * 60))); // Minutes remaining
  };

  // Mark payment as completed
  Payment.prototype.markCompleted = async function(gatewayData = {}) {
    await this.update({
      status: 'completed',
      payment_date: new Date(),
      processed_at: new Date(),
      gateway_response: gatewayData
    });
  };

  // Mark payment as failed
  Payment.prototype.markFailed = async function(reason = null, gatewayData = {}) {
    await this.update({
      status: 'failed',
      failure_reason: reason,
      gateway_response: gatewayData
    });
  };

  // Process refund
  Payment.prototype.processRefund = async function(refundAmount, reason = null, refundId = null) {
    const newRefundAmount = parseFloat(this.refund_amount) + parseFloat(refundAmount);
    const isFullRefund = newRefundAmount >= parseFloat(this.amount);
    
    await this.update({
      refund_amount: newRefundAmount,
      refund_reason: reason,
      refund_id: refundId,
      status: isFullRefund ? 'refunded' : 'partially_refunded'
    });
  };

  // Get payment summary
  Payment.prototype.getSummary = function() {
    return {
      transaction_id: this.transaction_id,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      payment_method: this.payment_method,
      payment_type: this.payment_type,
      created_at: this.created_at,
      completed_at: this.payment_date
    };
  };

  // Model associations
  Payment.associate = function(models) {
    // Payment belongs to customer
    if (models.User) {
      Payment.belongsTo(models.User, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }

    // Payment belongs to order
    if (models.Order) {
      Payment.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });
    }
  };

  return Payment;
}; 