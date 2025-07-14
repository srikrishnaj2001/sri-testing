const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Product name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Product description'
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Product image filename or array of images'
    },
    price: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Base price of the product'
    },
    variations: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of product variations (size, color, etc.)'
    },
    add_ons: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'JSON array of add-on IDs'
    },
    tax: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Tax amount or percentage'
    },
    available_time_starts: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Product availability start time'
    },
    available_time_ends: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Product availability end time'
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      allowNull: false,
      comment: '1 = active, 0 = inactive'
    },
    attributes: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'JSON array of product attributes'
    },
    category_ids: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'JSON array of category IDs with positions'
    },
    choice_options: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of choice options for variations'
    },
    discount: {
      type: DataTypes.DECIMAL(8, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Discount amount or percentage'
    },
    discount_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'percent',
      allowNull: false,
      comment: 'percent or amount'
    },
    tax_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'percent',
      allowNull: false,
      comment: 'percent or amount'
    },
    set_menu: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
      allowNull: false,
      comment: '1 = is set menu, 0 = regular product'
    },
    branch_id: {
      type: DataTypes.BIGINT,
      defaultValue: 1,
      allowNull: false,
      comment: 'Branch ID that owns this product'
    },
    colors: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of available colors'
    },
    popularity_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of times this product was ordered'
    },
    product_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'veg, non_veg'
    },
    is_recommended: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
      allowNull: false,
      comment: '1 = recommended, 0 = not recommended'
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['branch_id']
      },
      {
        fields: ['product_type']
      },
      {
        fields: ['is_recommended']
      },
      {
        fields: ['popularity_count']
      },
      {
        fields: ['price']
      },
      {
        fields: ['discount']
      },
      {
        fields: ['name']
      },
      {
        fields: ['available_time_starts', 'available_time_ends']
      }
    ],
    scopes: {
      // Active products only
      active: {
        where: {
          status: 1
        }
      },
      // Vegetarian products
      veg: {
        where: {
          product_type: 'veg'
        }
      },
      // Non-vegetarian products
      nonVeg: {
        where: {
          product_type: 'non_veg'
        }
      },
      // Recommended products
      recommended: {
        where: {
          is_recommended: 1
        }
      },
      // Popular products (ordered by popularity)
      popular: {
        order: [['popularity_count', 'DESC']]
      },
      // Products with discount
      discounted: {
        where: {
          discount: {
            [sequelize.Sequelize.Op.gt]: 0
          }
        }
      },
      // Available products (considering time)
      available: {
        where: {
          [sequelize.Sequelize.Op.or]: [
            {
              available_time_starts: null,
              available_time_ends: null
            },
            {
              [sequelize.Sequelize.Op.and]: [
                sequelize.where(
                  sequelize.fn('TIME', sequelize.fn('NOW')),
                  { [sequelize.Sequelize.Op.gte]: sequelize.col('available_time_starts') }
                ),
                sequelize.where(
                  sequelize.fn('TIME', sequelize.fn('NOW')),
                  { [sequelize.Sequelize.Op.lte]: sequelize.col('available_time_ends') }
                )
              ]
            }
          ]
        }
      }
    }
  });

  // Instance methods
  Product.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Parse JSON fields
    values.variations = this.getVariations();
    values.add_ons = this.getAddOns();
    values.attributes = this.getAttributes();
    values.category_ids = this.getCategoryIds();
    values.choice_options = this.getChoiceOptions();
    values.colors = this.getColors();
    
    // Add computed fields
    values.image_full_path = this.getImageFullPath();
    values.discounted_price = this.getDiscountedPrice();
    values.tax_amount = this.getTaxAmount();
    values.final_price = this.getFinalPrice();
    values.is_available = this.isAvailable();
    values.average_rating = this.averageRating || 0;
    values.reviews_count = this.reviewsCount || 0;
    
    return values;
  };

  // Parse JSON fields
  Product.prototype.getVariations = function() {
    try {
      return this.variations ? JSON.parse(this.variations) : [];
    } catch (e) {
      return [];
    }
  };

  Product.prototype.getAddOns = function() {
    try {
      return this.add_ons ? JSON.parse(this.add_ons) : [];
    } catch (e) {
      return [];
    }
  };

  Product.prototype.getAttributes = function() {
    try {
      return this.attributes ? JSON.parse(this.attributes) : [];
    } catch (e) {
      return [];
    }
  };

  Product.prototype.getCategoryIds = function() {
    try {
      return this.category_ids ? JSON.parse(this.category_ids) : [];
    } catch (e) {
      return [];
    }
  };

  Product.prototype.getChoiceOptions = function() {
    try {
      return this.choice_options ? JSON.parse(this.choice_options) : [];
    } catch (e) {
      return [];
    }
  };

  Product.prototype.getColors = function() {
    try {
      return this.colors ? JSON.parse(this.colors) : [];
    } catch (e) {
      return [];
    }
  };

  // Price calculations
  Product.prototype.getDiscountedPrice = function() {
    if (this.discount <= 0) return this.price;
    
    if (this.discount_type === 'percent') {
      return this.price - (this.price * this.discount / 100);
    } else {
      return Math.max(0, this.price - this.discount);
    }
  };

  Product.prototype.getTaxAmount = function() {
    const basePrice = this.getDiscountedPrice();
    
    if (this.tax_type === 'percent') {
      return basePrice * this.tax / 100;
    } else {
      return this.tax;
    }
  };

  Product.prototype.getFinalPrice = function() {
    return this.getDiscountedPrice() + this.getTaxAmount();
  };

  // Availability check
  Product.prototype.isAvailable = function() {
    if (!this.status) return false;
    
    // If no time restrictions, always available
    if (!this.available_time_starts || !this.available_time_ends) {
      return true;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.available_time_starts.split(':');
    const endTime = this.available_time_ends.split(':');
    
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    
    return currentTime >= startMinutes && currentTime <= endMinutes;
  };

  // Image handling
  Product.prototype.getImageFullPath = function() {
    if (!this.image) {
      return '/uploads/default/product-placeholder.png';
    }
    
    // Handle array of images
    if (this.image.startsWith('[')) {
      try {
        const images = JSON.parse(this.image);
        return images.length > 0 ? `/uploads/product/${images[0]}` : '/uploads/default/product-placeholder.png';
      } catch (e) {
        return '/uploads/default/product-placeholder.png';
      }
    }
    
    return `/uploads/product/${this.image}`;
  };

  Product.prototype.getAllImages = function() {
    if (!this.image) return [];
    
    if (this.image.startsWith('[')) {
      try {
        const images = JSON.parse(this.image);
        return images.map(img => `/uploads/product/${img}`);
      } catch (e) {
        return [];
      }
    }
    
    return [`/uploads/product/${this.image}`];
  };

  // Product type helpers
  Product.prototype.isVeg = function() {
    return this.product_type === 'veg';
  };

  Product.prototype.isNonVeg = function() {
    return this.product_type === 'non_veg';
  };

  Product.prototype.isSetMenu = function() {
    return this.set_menu === 1;
  };

  Product.prototype.isRecommended = function() {
    return this.is_recommended === 1;
  };

  // Category helpers
  Product.prototype.belongsToCategory = function(categoryId) {
    const categoryIds = this.getCategoryIds();
    return categoryIds.some(cat => cat.id == categoryId);
  };

  // Static methods
  Product.findActive = function(options = {}) {
    return this.scope('active').findAll(options);
  };

  Product.findAvailable = function(options = {}) {
    return this.scope(['active', 'available']).findAll(options);
  };

  Product.findByBranch = function(branchId, options = {}) {
    return this.scope('active').findAll({
      where: { branch_id: branchId },
      ...options
    });
  };

  Product.findByCategory = function(categoryId, options = {}) {
    return this.scope('active').findAll({
      where: {
        category_ids: {
          [sequelize.Sequelize.Op.like]: `%"id":"${categoryId}"%`
        }
      },
      ...options
    });
  };

  Product.findRecommended = function(options = {}) {
    return this.scope(['active', 'recommended']).findAll(options);
  };

  Product.findPopular = function(limit = 10, options = {}) {
    return this.scope(['active', 'popular']).findAll({
      limit,
      ...options
    });
  };

  Product.findDiscounted = function(options = {}) {
    return this.scope(['active', 'discounted']).findAll(options);
  };

  Product.search = function(query, options = {}) {
    return this.scope('active').findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            name: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          {
            description: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          }
        ]
      },
      ...options
    });
  };

  Product.findByType = function(type, options = {}) {
    return this.scope(['active', type]).findAll(options);
  };

  // Model associations
  Product.associate = function(models) {
    // Product belongs to branch
    if (models.Branch) {
      Product.belongsTo(models.Branch, {
        foreignKey: 'branch_id',
        as: 'branch'
      });
    }

    // Product belongs to category (through category_ids JSON field)
    if (models.Category) {
      // Note: This is a virtual association since category_ids is a JSON field
      // Actual category retrieval is handled by getCategoryIds() method
    }

    // Future associations (commented out until models are created)
    
    // // Product has many reviews
    // if (models.Review) {
    //   Product.hasMany(models.Review, {
    //     foreignKey: 'product_id',
    //     as: 'reviews'
    //   });
    // }

    // // Product has many wishlist items
    // if (models.Wishlist) {
    //   Product.hasMany(models.Wishlist, {
    //     foreignKey: 'product_id',
    //     as: 'wishlists'
    //   });
    // }

    // // Product has many order details
    // if (models.OrderDetail) {
    //   Product.hasMany(models.OrderDetail, {
    //     foreignKey: 'product_id',
    //     as: 'orderDetails'
    //   });
    // }

    // // Product has many branch products (branch-specific pricing)
    // if (models.ProductByBranch) {
    //   Product.hasMany(models.ProductByBranch, {
    //     foreignKey: 'product_id',
    //     as: 'branchProducts'
    //   });
    // }

    // // Product belongs to many tags
    // if (models.Tag) {
    //   Product.belongsToMany(models.Tag, {
    //     through: 'product_tag',
    //     foreignKey: 'product_id',
    //     otherKey: 'tag_id',
    //     as: 'tags'
    //   });
    // }

    // // Product belongs to many cuisines
    // if (models.Cuisine) {
    //   Product.belongsToMany(models.Cuisine, {
    //     through: 'cuisine_product',
    //     foreignKey: 'product_id',
    //     otherKey: 'cuisine_id',
    //     as: 'cuisines'
    //   });
    // }

    // // Product has many translations
    // if (models.Translation) {
    //   Product.hasMany(models.Translation, {
    //     foreignKey: 'translationable_id',
    //     as: 'translations',
    //     scope: {
    //       translationable_type: 'Product'
    //     }
    //   });
    // }
  };

  return Product;
}; 