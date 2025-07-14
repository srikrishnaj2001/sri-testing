const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    f_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'First name'
    },
    l_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Last name'
    },
    phone: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        isNumeric: false // Allow + and other phone characters
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    image: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Profile image filename'
    },
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100]
      }
    },
    remember_token: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cm_firebase_token: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Firebase token for push notifications'
    },
    temporary_token: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Temporary token for password reset'
    },
    point: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: 'Loyalty points'
    },
    is_active: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      allowNull: false,
      comment: '1 = active, 0 = inactive'
    },
    user_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: 'null for customer, kitchen for kitchen user, admin for admin'
    },
    refer_code: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Referral code for this user'
    },
    refer_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'ID of user who referred this user'
    },
    login_medium: {
      type: DataTypes.STRING(15),
      allowNull: true,
      comment: 'Login method: email, phone, social'
    },
    language_code: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
      allowNull: false,
      comment: 'User preferred language'
    },
    wallet_balance: {
      type: DataTypes.DECIMAL(24, 3),
      defaultValue: 0,
      allowNull: false,
      comment: 'User wallet balance'
    },
    login_hit_count: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
      allowNull: false,
      comment: 'Failed login attempts count'
    },
    is_temp_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Temporary block status for security'
    },
    temp_block_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When temporary block expires'
    },
    // Delivery man specific fields
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether delivery man is available for deliveries'
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether delivery man is currently online'
    },
    last_active_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time delivery man was active'
    },
    current_location: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Current GPS location of delivery man'
    },
    last_location_update: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When location was last updated'
    },
    delivery_status: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Delivery status details'
    },
    vehicle_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Vehicle information for delivery man'
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Uploaded documents for delivery man'
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Branch ID for delivery man/kitchen staff'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['phone']
      },
      {
        fields: ['email']
      },
      {
        fields: ['user_type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['refer_code']
      }
    ],
    scopes: {
      // Active users only
      active: {
        where: {
          is_active: 1
        }
      },
      // Filter by user type
      customers: {
        where: {
          user_type: null // null means customer
        }
      },
      kitchen: {
        where: {
          user_type: 'kitchen'
        }
      },
      // Phone verified users
      phoneVerified: {
        where: {
          is_phone_verified: true
        }
      },
      // Email verified users
      emailVerified: {
        where: {
          email_verified_at: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    },
    hooks: {
      // Hash password before creating user
      beforeCreate: async (user) => {
        if (user.password) {
          const bcrypt = require('bcryptjs');
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      // Hash password before updating user
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const bcrypt = require('bcryptjs');
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      }
    }
  });

  // Instance methods
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    // Remove sensitive fields from JSON output
    delete values.password;
    delete values.remember_token;
    delete values.email_verification_token;
    delete values.temporary_token;
    return values;
  };

  // Verify password method
  User.prototype.verifyPassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
  };

  // Get full name
  User.prototype.getFullName = function() {
    return `${this.f_name || ''} ${this.l_name || ''}`.trim() || null;
  };

  // Get image full path
  User.prototype.getImageFullPath = function() {
    if (!this.image) {
      return '/uploads/default/user-avatar.png';
    }
    
    const path = this.user_type === 'kitchen' ? 'kitchen' : 'profile';
    return `/uploads/${path}/${this.image}`;
  };

  // Check if user is customer
  User.prototype.isCustomer = function() {
    return this.user_type === null || this.user_type === 'customer';
  };

  // Check if user is kitchen staff
  User.prototype.isKitchen = function() {
    return this.user_type === 'kitchen';
  };

  // Check if user is admin
  User.prototype.isAdmin = function() {
    return this.user_type === 'admin';
  };

  // Check if user is delivery man
  User.prototype.isDeliveryMan = function() {
    return this.user_type === 'delivery_man';
  };

  // Delivery man specific methods
  User.prototype.getTotalDeliveries = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would query actual delivery orders
    return Math.floor(Math.random() * 100) + 50;
  };

  User.prototype.getCompletedDeliveries = async function(fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would query completed delivery orders
    const total = await this.getTotalDeliveries(fromDate);
    return Math.floor(total * 0.9); // 90% completion rate
  };

  User.prototype.getCancelledDeliveries = async function(fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would query cancelled delivery orders
    const total = await this.getTotalDeliveries(fromDate);
    return Math.floor(total * 0.05); // 5% cancellation rate
  };

  User.prototype.getTotalEarnings = async function(fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate from delivery orders
    const deliveries = await this.getCompletedDeliveries(fromDate);
    return deliveries * 15; // Average $15 per delivery
  };

  User.prototype.getAverageRating = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate from delivery ratings
    return (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0 rating
  };

  User.prototype.getDeliveryStatus = function() {
    if (!this.isDeliveryMan()) return null;
    
    // Get from delivery_status field or default
    if (this.delivery_status && typeof this.delivery_status === 'object') {
      return this.delivery_status.status || 'offline';
    }
    return this.is_online ? 'available' : 'offline';
  };

  User.prototype.isAvailableForDelivery = function() {
    if (!this.isDeliveryMan()) return false;
    
    return this.is_available === true && this.is_online === true;
  };

  User.prototype.isOnline = function() {
    return this.is_online === true;
  };

  User.prototype.getCurrentLocation = function() {
    if (this.current_location && typeof this.current_location === 'object') {
      return this.current_location;
    }
    return null;
  };

  User.prototype.getVehicleInfo = function() {
    if (this.vehicle_info && typeof this.vehicle_info === 'object') {
      return this.vehicle_info;
    }
    return {
      type: 'motorcycle',
      model: 'Unknown',
      license_plate: 'N/A'
    };
  };

  User.prototype.getAverageDeliveryTime = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate from delivery times
    return Math.floor(Math.random() * 20) + 25; // 25-45 minutes average
  };

  User.prototype.getTotalDistance = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate from delivery routes
    const deliveries = await this.getCompletedDeliveries(_fromDate);
    return deliveries * 8; // Average 8km per delivery
  };

  User.prototype.getFuelCost = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate fuel costs
    const distance = await this.getTotalDistance(_fromDate);
    return distance * 0.15; // $0.15 per km
  };

  User.prototype.getOnTimeDeliveryRate = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate on-time delivery percentage
    return (Math.random() * 20 + 75).toFixed(1); // 75-95% on-time rate
  };

  User.prototype.getEarningsHistory = async function(_period = 'month', options = {}) {
    if (!this.isDeliveryMan()) return { earnings: [], total: 0 };
    
    const page = options.page || 1;
    const limit = options.limit || 20;
    
    // Mock implementation - would query actual earnings history
    const mockEarnings = [];
    for (let i = 0; i < limit; i++) {
      mockEarnings.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        amount: Math.floor(Math.random() * 100) + 50,
        deliveries: Math.floor(Math.random() * 10) + 1,
        tips: Math.floor(Math.random() * 20)
      });
    }
    
    return {
      earnings: mockEarnings,
      total: mockEarnings.length,
      page,
      limit,
      total_earnings: mockEarnings.reduce((sum, e) => sum + e.amount, 0)
    };
  };

  User.prototype.getDeliverySuccessRate = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    const total = await this.getTotalDeliveries(_fromDate);
    const completed = await this.getCompletedDeliveries(_fromDate);
    
    return total > 0 ? (completed / total * 100).toFixed(1) : 0;
  };

  User.prototype.getCustomerSatisfactionScore = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would calculate from customer feedback
    return (Math.random() * 1 + 4).toFixed(1); // 4.0 to 5.0 satisfaction
  };

  User.prototype.getFuelEfficiency = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    const distance = await this.getTotalDistance(_fromDate);
    const fuelCost = await this.getFuelCost(_fromDate);
    
    return distance > 0 ? (distance / (fuelCost / 0.15)).toFixed(1) : 0; // km per liter
  };

  User.prototype.getEarningsPerDelivery = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    const earnings = await this.getTotalEarnings(_fromDate);
    const deliveries = await this.getCompletedDeliveries(_fromDate);
    
    return deliveries > 0 ? (earnings / deliveries).toFixed(2) : 0;
  };

  User.prototype.getActiveDaysCount = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    // Mock implementation - would count active days
    const days = _fromDate ? Math.floor((Date.now() - _fromDate.getTime()) / (24 * 60 * 60 * 1000)) : 30;
    return Math.min(days, Math.floor(Math.random() * days) + 1);
  };

  User.prototype.getPeakHoursPerformance = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return {};
    
    // Mock implementation - would analyze performance during peak hours
    return {
      lunch_rush: (Math.random() * 1 + 4).toFixed(1),
      dinner_rush: (Math.random() * 1 + 4).toFixed(1),
      weekend_performance: (Math.random() * 1 + 4).toFixed(1)
    };
  };

  User.prototype.getCancellationRate = async function(_fromDate = null) {
    if (!this.isDeliveryMan()) return 0;
    
    const total = await this.getTotalDeliveries(_fromDate);
    const cancelled = await this.getCancelledDeliveries(_fromDate);
    
    return total > 0 ? (cancelled / total * 100).toFixed(1) : 0;
  };

  User.prototype.getDocuments = function() {
    if (this.documents && typeof this.documents === 'object') {
      return this.documents;
    }
    return {};
  };

  // Customer specific methods
  User.prototype.getTotalOrders = async function() {
    if (!this.isCustomer()) return 0;
    
    // Mock implementation - would query actual orders
    return Math.floor(Math.random() * 50) + 10;
  };

  User.prototype.getLoyaltyPoints = function() {
    return this.point || 0;
  };

  User.prototype.getWalletBalance = function() {
    return this.wallet_balance || 0;
  };

  // Wallet management methods
  User.prototype.addToWallet = async function(amount, type = 'credit', referenceId = null) {
    const currentBalance = this.getWalletBalance();
    const newBalance = currentBalance + parseFloat(amount);
    
    await this.update({
      wallet_balance: newBalance
    });
    
    // Note: In a real implementation, you would also create a wallet transaction record
    // For now, we'll just update the balance
    
    return {
      previous_balance: currentBalance,
      amount: parseFloat(amount),
      new_balance: newBalance,
      type,
      reference_id: referenceId,
      timestamp: new Date()
    };
  };

  User.prototype.deductFromWallet = async function(amount, type = 'debit', referenceId = null) {
    const currentBalance = this.getWalletBalance();
    const deductAmount = parseFloat(amount);
    
    if (currentBalance < deductAmount) {
      throw new Error('Insufficient wallet balance');
    }
    
    const newBalance = currentBalance - deductAmount;
    
    await this.update({
      wallet_balance: newBalance
    });
    
    // Note: In a real implementation, you would also create a wallet transaction record
    
    return {
      previous_balance: currentBalance,
      amount: deductAmount,
      new_balance: newBalance,
      type,
      reference_id: referenceId,
      timestamp: new Date()
    };
  };

  User.prototype.canAfford = function(amount) {
    return this.getWalletBalance() >= parseFloat(amount);
  };

  User.prototype.getWalletTransactionHistory = async function(limit = 20, page = 1) {
    // Mock implementation - would query actual wallet transactions
    const transactions = [];
    const offset = (page - 1) * limit;
    
    for (let i = 0; i < limit; i++) {
      const isCredit = Math.random() > 0.5;
      transactions.push({
        id: offset + i + 1,
        type: isCredit ? 'credit' : 'debit',
        amount: Math.floor(Math.random() * 1000) + 100,
        description: isCredit ? 'Wallet top-up' : 'Order payment',
        reference_id: `TXN_${Date.now()}_${i}`,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        status: 'completed'
      });
    }
    
    return {
      transactions,
      total: transactions.length,
      page,
      limit,
      current_balance: this.getWalletBalance()
    };
  };

  User.prototype.getWalletStats = async function(fromDate = null) {
    const toDate = new Date();
    const startDate = fromDate || new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Mock implementation - would calculate from actual transaction data
    const totalCredits = Math.floor(Math.random() * 5000) + 1000;
    const totalDebits = Math.floor(Math.random() * 4000) + 800;
    const transactionCount = Math.floor(Math.random() * 50) + 10;
    
    return {
      period: {
        from: startDate,
        to: toDate
      },
      total_credits: totalCredits,
      total_debits: totalDebits,
      net_change: totalCredits - totalDebits,
      transaction_count: transactionCount,
      average_transaction: transactionCount > 0 ? ((totalCredits + totalDebits) / transactionCount).toFixed(2) : 0,
      current_balance: this.getWalletBalance()
    };
  };

  // Static methods
  User.findByPhone = function(phone) {
    return this.findOne({ where: { phone } });
  };

  User.findByEmail = function(email) {
    return this.findOne({ where: { email } });
  };

  User.findActiveByPhone = function(phone) {
    return this.scope('active').findOne({ where: { phone } });
  };

  // Model associations (will be defined in the associations function)
  User.associate = function(models) {
    // User belongs to branch (for delivery men, kitchen staff, etc.)
    if (models.Branch) {
      User.belongsTo(models.Branch, {
        foreignKey: 'branch_id',
        as: 'branch'
      });
    }

    // Self-referential relationship for referrals
    User.belongsTo(User, {
      foreignKey: 'refer_by',
      as: 'referrer'
    });

    User.hasMany(User, {
      foreignKey: 'refer_by',
      as: 'referrals'
    });

    // User has many payments
    if (models.Payment) {
      User.hasMany(models.Payment, {
        foreignKey: 'customer_id',
        as: 'payments'
      });
    }

    // User has many orders as customer
    if (models.Order) {
      User.hasMany(models.Order, {
        foreignKey: 'customer_id',
        as: 'orders'
      });

      // User has many orders as delivery man
      User.hasMany(models.Order, {
        foreignKey: 'delivery_man_id',
        as: 'deliveryOrders'
      });
    }

    // Future associations (commented out until models are created)
    
    // // User has many addresses
    // if (models.CustomerAddress) {
    //   User.hasMany(models.CustomerAddress, {
    //     foreignKey: 'user_id',
    //     as: 'addresses'
    //   });
    // }

    // // User has many wishlist items
    // if (models.Wishlist) {
    //   User.hasMany(models.Wishlist, {
    //     foreignKey: 'user_id',
    //     as: 'wishlist'
    //   });
    // }

    // // User has many wallet transactions
    // if (models.WalletTransaction) {
    //   User.hasMany(models.WalletTransaction, {
    //     foreignKey: 'user_id',
    //     as: 'walletTransactions'
    //   });
    // }

    // // User has many point transitions
    // if (models.PointTransition) {
    //   User.hasMany(models.PointTransition, {
    //     foreignKey: 'user_id',
    //     as: 'pointTransitions'
    //   });
    // }

    // // User has many reviews
    // if (models.Review) {
    //   User.hasMany(models.Review, {
    //     foreignKey: 'user_id',
    //     as: 'reviews'
    //   });
    // }

    // // User has one chef branch (for kitchen users)
    // if (models.ChefBranch) {
    //   User.hasOne(models.ChefBranch, {
    //     foreignKey: 'user_id',
    //     as: 'chefBranch'
    //   });
    // }
  };

  return User;
}; 