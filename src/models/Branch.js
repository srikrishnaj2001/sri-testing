const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Branch = sequelize.define('Branch', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    restaurant_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Parent restaurant ID (if multi-restaurant system)'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Branch name'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      },
      comment: 'Branch login email'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Branch login password'
    },
    latitude: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Branch latitude coordinate'
    },
    longitude: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Branch longitude coordinate'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Branch physical address'
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      allowNull: false,
      comment: '1 = active, 0 = inactive'
    },
    branch_promotion_status: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      allowNull: false,
      comment: '1 = promotion active, 0 = promotion inactive'
    },
    coverage: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: 'Delivery coverage radius in kilometers'
    },
    remember_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Remember token for branch login'
    },
    image: {
      type: DataTypes.STRING(255),
      defaultValue: 'def.png',
      allowNull: false,
      comment: 'Branch logo/image filename'
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      comment: 'Branch contact phone number'
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Branch cover image filename'
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Default preparation time in minutes'
    }
  }, {
    tableName: 'branches',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['status']
      },
      {
        fields: ['branch_promotion_status']
      },
      {
        fields: ['restaurant_id']
      },
      {
        fields: ['latitude', 'longitude']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['name']
      }
    ],
    scopes: {
      // Active branches only
      active: {
        where: {
          status: 1
        }
      },
      // Branches with promotion enabled
      promotionEnabled: {
        where: {
          branch_promotion_status: 1
        }
      },
      // Branches with coordinates
      withCoordinates: {
        where: {
          latitude: {
            [sequelize.Sequelize.Op.ne]: null
          },
          longitude: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    },
    hooks: {
      // Hash password before creating branch
      beforeCreate: async (branch) => {
        if (branch.password) {
          const bcrypt = require('bcryptjs');
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          branch.password = await bcrypt.hash(branch.password, saltRounds);
        }
      },
      // Hash password before updating branch
      beforeUpdate: async (branch) => {
        if (branch.changed('password')) {
          const bcrypt = require('bcryptjs');
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          branch.password = await bcrypt.hash(branch.password, saltRounds);
        }
      }
    }
  });

  // Instance methods
  Branch.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Remove sensitive fields from JSON output
    delete values.password;
    delete values.remember_token;
    
    // Add computed fields
    values.image_full_path = this.getImageFullPath();
    values.cover_image_full_path = this.getCoverImageFullPath();
    values.coordinates = this.getCoordinates();
    values.is_active = this.status === 1;
    values.has_promotion = this.branch_promotion_status === 1;
    
    return values;
  };

  // Verify password method
  Branch.prototype.verifyPassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
  };

  // Get image full path
  Branch.prototype.getImageFullPath = function() {
    if (!this.image || this.image === 'def.png') {
      return '/uploads/default/branch-logo.png';
    }
    return `/uploads/branch/${this.image}`;
  };

  // Get cover image full path
  Branch.prototype.getCoverImageFullPath = function() {
    if (!this.cover_image) {
      return '/uploads/default/branch-cover.png';
    }
    return `/uploads/branch/${this.cover_image}`;
  };

  // Get coordinates as object
  Branch.prototype.getCoordinates = function() {
    if (!this.latitude || !this.longitude) {
      return null;
    }
    return {
      latitude: parseFloat(this.latitude),
      longitude: parseFloat(this.longitude)
    };
  };

  // Check if branch is active
  Branch.prototype.isActive = function() {
    return this.status === 1;
  };

  // Check if branch has promotion enabled
  Branch.prototype.hasPromotion = function() {
    return this.branch_promotion_status === 1;
  };

  // Check if branch has coordinates
  Branch.prototype.hasCoordinates = function() {
    return !!(this.latitude && this.longitude);
  };

  // Calculate distance from a point (in kilometers)
  Branch.prototype.distanceFrom = function(lat, lng) {
    if (!this.hasCoordinates()) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat - parseFloat(this.latitude));
    const dLng = this.toRad(lng - parseFloat(this.longitude));
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(parseFloat(this.latitude))) * Math.cos(this.toRad(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper method to convert degrees to radians
  Branch.prototype.toRad = function(value) {
    return (value * Math.PI) / 180;
  };

  // Check if location is within coverage area
  Branch.prototype.isWithinCoverage = function(lat, lng) {
    const distance = this.distanceFrom(lat, lng);
    return distance !== null && distance <= this.coverage;
  };

  // Get operating hours (if you have time schedule relation)
  Branch.prototype.getOperatingHours = function() {
    // This would be implemented when TimeSchedule model is created
    return null;
  };

  // Check if branch is open now
  Branch.prototype.isOpenNow = function() {
    // This would be implemented when TimeSchedule model is created
    return true; // Default to true for now
  };

  // Check if delivery is available
  Branch.prototype.isDeliveryAvailable = function() {
    return this.isActive() && this.hasCoordinates();
  };

  // Check if pickup is available
  Branch.prototype.isPickupAvailable = function() {
    return this.isActive();
  };

  // Check if delivery is available at a specific location
  Branch.prototype.isDeliveryAvailableAt = function(lat, lng) {
    return this.isDeliveryAvailable() && this.isWithinCoverage(lat, lng);
  };

  // Get coverage area
  Branch.prototype.getCoverageArea = function() {
    return this.coverage || 10; // Default 10km radius
  };

  // Get delivery time
  Branch.prototype.getDeliveryTime = function() {
    return this.preparation_time ? `${this.preparation_time} minutes` : '30-45 minutes';
  };

  // Calculate delivery charge based on distance
  Branch.prototype.getDeliveryCharge = function(distance) {
    if (!distance) return 0;
    
    // Base delivery charge
    const baseCharge = 5;
    
    // Additional charge per km after first 5km
    const additionalCharge = distance > 5 ? (distance - 5) * 1 : 0;
    
    return baseCharge + additionalCharge;
  };

  // Calculate distance from a point (in kilometers) - renamed for consistency
  Branch.prototype.calculateDistance = function(lat, lng) {
    return this.distanceFrom(lat, lng);
  };

  // Static methods
  Branch.findActive = function(options = {}) {
    return this.scope('active').findAll(options);
  };

  Branch.findWithPromotion = function(options = {}) {
    return this.scope(['active', 'promotionEnabled']).findAll(options);
  };

  Branch.findNearby = function(lat, lng, maxDistance = 50, options = {}) {
    return this.scope(['active', 'withCoordinates']).findAll({
      where: sequelize.where(
        sequelize.fn(
          'ST_Distance_Sphere',
          sequelize.fn('POINT', sequelize.col('longitude'), sequelize.col('latitude')),
          sequelize.fn('POINT', lng, lat)
        ),
        { [sequelize.Sequelize.Op.lte]: maxDistance * 1000 } // Convert km to meters
      ),
      ...options
    });
  };

  Branch.findByEmail = function(email) {
    return this.findOne({ where: { email } });
  };

  Branch.findByPhone = function(phone) {
    return this.findOne({ where: { phone } });
  };

  Branch.findMainBranch = function() {
    return this.scope('active').findOne({ where: { id: 1 } });
  };

  Branch.search = function(query, options = {}) {
    return this.scope('active').findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            name: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          {
            address: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          {
            phone: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          }
        ]
      },
      ...options
    });
  };

  // Model associations
  Branch.associate = function(models) {
    // Branch has many products
    if (models.Product) {
      Branch.hasMany(models.Product, {
        foreignKey: 'branch_id',
        as: 'products'
      });
    }

    // Branch has many users (customers, delivery men, etc.)
    if (models.User) {
      Branch.hasMany(models.User, {
        foreignKey: 'branch_id',
        as: 'users'
      });
    }

    // Future associations (commented out until models are created)
    
    // // Branch has many orders
    // if (models.Order) {
    //   Branch.hasMany(models.Order, {
    //     foreignKey: 'branch_id',
    //     as: 'orders'
    //   });
    // }

    // // Branch has many tables
    // if (models.Table) {
    //   Branch.hasMany(models.Table, {
    //     foreignKey: 'branch_id',
    //     as: 'tables'
    //   });
    // }

    // // Branch has many delivery men
    // if (models.DeliveryMan) {
    //   Branch.hasMany(models.DeliveryMan, {
    //     foreignKey: 'branch_id',
    //     as: 'deliveryMen'
    //   });
    // }

    // // Branch has many chef branches (staff assignments)
    // if (models.ChefBranch) {
    //   Branch.hasMany(models.ChefBranch, {
    //     foreignKey: 'branch_id',
    //     as: 'chefBranches'
    //   });
    // }

    // // Branch has many promotions
    // if (models.BranchPromotion) {
    //   Branch.hasMany(models.BranchPromotion, {
    //     foreignKey: 'branch_id',
    //     as: 'promotions'
    //   });
    // }

    // // Branch has many product by branches (branch-specific pricing)
    // if (models.ProductByBranch) {
    //   Branch.hasMany(models.ProductByBranch, {
    //     foreignKey: 'branch_id',
    //     as: 'branchProducts'
    //   });
    // }

    // // Branch has one delivery charge setup
    // if (models.DeliveryChargeSetup) {
    //   Branch.hasOne(models.DeliveryChargeSetup, {
    //     foreignKey: 'branch_id',
    //     as: 'deliveryChargeSetup'
    //   });
    // }

    // // Branch has many delivery charges by area
    // if (models.DeliveryChargeByArea) {
    //   Branch.hasMany(models.DeliveryChargeByArea, {
    //     foreignKey: 'branch_id',
    //     as: 'deliveryChargesByArea'
    //   });
    // }

    // // Branch has many time schedules
    // if (models.TimeSchedule) {
    //   Branch.hasMany(models.TimeSchedule, {
    //     foreignKey: 'branch_id',
    //     as: 'timeSchedules'
    //   });
    // }
  };

  return Branch;
}; 