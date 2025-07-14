const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    order_number: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      comment: 'Unique order identifier'
    },
    customer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Customer who placed the order'
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Branch processing the order'
    },
    delivery_man_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Assigned delivery man'
    },
    order_status: {
      type: DataTypes.ENUM([
        'pending',
        'confirmed', 
        'preparing',
        'ready_for_pickup',
        'picked_up',
        'on_the_way',
        'delivered',
        'cancelled',
        'returned'
      ]),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Current order status'
    },
    payment_status: {
      type: DataTypes.ENUM(['pending', 'paid', 'failed', 'refunded']),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Payment status'
    },
    payment_method: {
      type: DataTypes.ENUM(['cash_on_delivery', 'credit_card', 'paypal', 'stripe', 'razorpay', 'wallet']),
      allowNull: false,
      comment: 'Payment method used'
    },
    transaction_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Payment gateway transaction ID'
    },
    order_amount: {
      type: DataTypes.DECIMAL(24, 3),
      allowNull: false,
      comment: 'Total order amount before tax and fees'
    },
    tax_amount: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Tax amount'
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Delivery charge'
    },
    total_tax_amount: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Total tax amount'
    },
    delivery_charge: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Delivery charge'
    },
    coupon_discount_amount: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Discount from coupon'
    },
    coupon_discount_title: {
      type: DataTypes.STRING(191),
      allowNull: true,
      comment: 'Applied coupon title'
    },
    coupon_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Applied coupon code'
    },
    order_type: {
      type: DataTypes.ENUM(['take_away', 'delivery', 'dine_in']),
      defaultValue: 'delivery',
      allowNull: false,
      comment: 'Type of order'
    },
    checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Order checked by restaurant'
    },
    kitchen_prepared_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When kitchen finished preparing'
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Scheduled delivery date'
    },
    delivery_time: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Scheduled delivery time'
    },
    order_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Customer notes for the order'
    },
    delivery_address: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Delivery address details'
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated preparation time in minutes'
    },
    table_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Table ID for dine-in orders'
    },
    number_of_people: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of people for dine-in'
    },
    extra_discount: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Additional discount given'
    },
    delivery_address_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Customer address ID used for delivery'
    },
    scheduled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Is this a scheduled order'
    },
    schedule_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to prepare/deliver scheduled order'
    },
    callback: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Callback URL for payment'
    },
    otp: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'OTP for order verification'
    },
    pending: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was placed'
    },
    accepted: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was accepted'
    },
    confirmed: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was confirmed'
    },
    processing: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order processing started'
    },
    handover: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was handed over to delivery'
    },
    picked_up: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was picked up'
    },
    delivered: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was delivered'
    },
    canceled: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When order was cancelled'
    },
    delivery_man_earning: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Earnings for delivery man'
    },
    tax_status: {
      type: DataTypes.ENUM(['included', 'excluded']),
      defaultValue: 'included',
      allowNull: false,
      comment: 'Tax calculation method'
    },
    free_delivery_amount: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'Free delivery threshold amount'
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for order cancellation'
    },
    cancelled_by: {
      type: DataTypes.ENUM(['customer', 'admin', 'restaurant', 'delivery_man']),
      allowNull: true,
      comment: 'Who cancelled the order'
    },
    customer_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Customer information snapshot'
    },
    items: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Order items with details'
    },
    tracking_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Order tracking information'
    },
    delivery_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special delivery instructions'
    },
    estimated_delivery_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Estimated delivery time'
    },
    actual_delivery_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Actual delivery time'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'Customer rating for the order'
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Customer review for the order'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['order_number']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['delivery_man_id']
      },
      {
        fields: ['branch_id']
      },
      {
        fields: ['order_status']
      },
      {
        fields: ['payment_status']
      },
      {
        fields: ['order_type']
      },
      {
        fields: ['scheduled']
      },
      {
        fields: ['delivery_date']
      }
    ],
    scopes: {
      // Active orders
      active: {
        where: {
          order_status: {
            [sequelize.Sequelize.Op.notIn]: ['delivered', 'cancelled', 'returned']
          }
        }
      },
      // Pending orders
      pending: {
        where: {
          order_status: 'pending'
        }
      },
      // Delivered orders
      delivered: {
        where: {
          order_status: 'delivered'
        }
      },
      // Cancelled orders
      cancelled: {
        where: {
          order_status: 'cancelled'
        }
      },
      // Today's orders
      today: {
        where: {
          created_at: {
            [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }
    },
    hooks: {
      beforeCreate: async (order) => {
        // Generate order number if not provided
        if (!order.order_number) {
          const timestamp = Date.now().toString().slice(-6);
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          order.order_number = `ORD-${timestamp}${random}`;
        }
        
        // Set pending timestamp
        order.pending = new Date();
      },
      
      beforeUpdate: async (order) => {
        // Update status timestamps when status changes
        if (order.changed('order_status')) {
          const now = new Date();
          const status = order.order_status;
          
          switch (status) {
            case 'confirmed':
              order.confirmed = now;
              break;
            case 'preparing':
            case 'processing':
              order.processing = now;
              break;
            case 'ready_for_pickup':
              order.handover = now;
              break;
            case 'picked_up':
              order.picked_up = now;
              break;
            case 'delivered':
              order.delivered = now;
              order.actual_delivery_time = now;
              break;
            case 'cancelled':
              order.canceled = now;
              break;
          }
        }
      }
    }
  });

  // Instance methods
  Order.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed fields
    values.order_items = this.getOrderItems();
    values.customer_details = this.getCustomerDetails();
    values.delivery_details = this.getDeliveryDetails();
    values.status_timeline = this.getStatusTimeline();
    values.total_amount = this.getTotalAmount();
    
    return values;
  };

  // Get order items with details
  Order.prototype.getOrderItems = function() {
    return this.items || [];
  };

  // Get customer details
  Order.prototype.getCustomerDetails = function() {
    return this.customer_info || {};
  };

  // Get delivery details
  Order.prototype.getDeliveryDetails = function() {
    return {
      address: this.delivery_address,
      instructions: this.delivery_instructions,
      estimated_time: this.estimated_delivery_time,
      actual_time: this.actual_delivery_time,
      delivery_man_id: this.delivery_man_id
    };
  };

  // Get status timeline
  Order.prototype.getStatusTimeline = function() {
    const timeline = [];
    
    if (this.pending) timeline.push({ status: 'pending', timestamp: this.pending });
    if (this.accepted) timeline.push({ status: 'accepted', timestamp: this.accepted });
    if (this.confirmed) timeline.push({ status: 'confirmed', timestamp: this.confirmed });
    if (this.processing) timeline.push({ status: 'processing', timestamp: this.processing });
    if (this.handover) timeline.push({ status: 'handover', timestamp: this.handover });
    if (this.picked_up) timeline.push({ status: 'picked_up', timestamp: this.picked_up });
    if (this.delivered) timeline.push({ status: 'delivered', timestamp: this.delivered });
    if (this.canceled) timeline.push({ status: 'cancelled', timestamp: this.canceled });
    
    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  // Calculate total amount
  Order.prototype.getTotalAmount = function() {
    return parseFloat(this.order_amount) + 
           parseFloat(this.tax_amount) + 
           parseFloat(this.delivery_charge) - 
           parseFloat(this.coupon_discount_amount) - 
           parseFloat(this.extra_discount);
  };

  // Check if order can be cancelled
  Order.prototype.canBeCancelled = function() {
    const cancellableStatuses = ['pending', 'confirmed', 'preparing'];
    return cancellableStatuses.includes(this.order_status);
  };

  // Check if order is active
  Order.prototype.isActive = function() {
    const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way'];
    return activeStatuses.includes(this.order_status);
  };

  // Update order status with timestamp
  Order.prototype.updateStatus = async function(newStatus, updatedBy = null) {
    await this.update({
      order_status: newStatus,
      updated_by: updatedBy
    });
  };

  // Model associations
  Order.associate = function(models) {
    // Order belongs to customer
    if (models.User) {
      Order.belongsTo(models.User, {
        foreignKey: 'customer_id',
        as: 'customer'
      });

      // Order belongs to delivery man
      Order.belongsTo(models.User, {
        foreignKey: 'delivery_man_id',
        as: 'deliveryMan'
      });
    }

    // Order belongs to branch
    if (models.Branch) {
      Order.belongsTo(models.Branch, {
        foreignKey: 'branch_id',
        as: 'branch'
      });
    }

    // Order has many payments
    if (models.Payment) {
      Order.hasMany(models.Payment, {
        foreignKey: 'order_id',
        as: 'payments'
      });
    }
  };

  return Order;
}; 