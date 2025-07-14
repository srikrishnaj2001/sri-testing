'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      f_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'First name'
      },
      l_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Last name'
      },
      phone: {
        type: Sequelize.STRING(20),
        unique: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      image: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Profile image filename'
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      remember_token: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cm_firebase_token: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Firebase token for push notifications'
      },
      temporary_token: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Temporary token for password reset'
      },
      point: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
        comment: 'Loyalty points'
      },
      is_active: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        allowNull: false,
        comment: '1 = active, 0 = inactive'
      },
      user_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
        comment: 'null for customer, kitchen for kitchen user, admin for admin'
      },
      refer_code: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Referral code for this user'
      },
      refer_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'ID of user who referred this user'
      },
      login_medium: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: 'Login method: email, phone, social'
      },
      language_code: {
        type: Sequelize.STRING(10),
        defaultValue: 'en',
        allowNull: false,
        comment: 'User preferred language'
      },
      wallet_balance: {
        type: Sequelize.DECIMAL(24, 3),
        defaultValue: 0,
        allowNull: false,
        comment: 'User wallet balance'
      },
      login_hit_count: {
        type: Sequelize.SMALLINT,
        defaultValue: 0,
        allowNull: false,
        comment: 'Failed login attempts count'
      },
      is_temp_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Temporary block status for security'
      },
      temp_block_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When temporary block expires'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create categories table
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Category name'
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Parent category ID for hierarchy'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order position'
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Active status'
      },
      image: {
        type: Sequelize.STRING(100),
        defaultValue: 'def.png',
        allowNull: true,
        comment: 'Category image filename'
      },
      banner_image: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Category banner image filename'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 10,
        allowNull: false,
        comment: 'Priority for sorting'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create branches table
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      restaurant_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: 'Parent restaurant ID (if multi-restaurant system)'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Branch name'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Branch login email'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Branch login password'
      },
      latitude: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Branch latitude coordinate'
      },
      longitude: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Branch longitude coordinate'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Branch physical address'
      },
      status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        allowNull: false,
        comment: '1 = active, 0 = inactive'
      },
      branch_promotion_status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        allowNull: false,
        comment: '1 = promotion active, 0 = promotion inactive'
      },
      coverage: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
        comment: 'Delivery coverage radius in kilometers'
      },
      remember_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Remember token for branch login'
      },
      image: {
        type: Sequelize.STRING(255),
        defaultValue: 'def.png',
        allowNull: false,
        comment: 'Branch logo/image filename'
      },
      phone: {
        type: Sequelize.STRING(25),
        allowNull: true,
        comment: 'Branch contact phone number'
      },
      cover_image: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Branch cover image filename'
      },
      preparation_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Default preparation time in minutes'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Product name'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Product description'
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Product image filename or array of images'
      },
      price: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Base price of the product'
      },
      variations: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of product variations (size, color, etc.)'
      },
      add_ons: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'JSON array of add-on IDs'
      },
      tax: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Tax amount or percentage'
      },
      available_time_starts: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Product availability start time'
      },
      available_time_ends: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Product availability end time'
      },
      status: {
        type: Sequelize.SMALLINT,
        defaultValue: 1,
        allowNull: false,
        comment: '1 = active, 0 = inactive'
      },
      attributes: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'JSON array of product attributes'
      },
      category_ids: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'JSON array of category IDs with positions'
      },
      choice_options: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of choice options for variations'
      },
      discount: {
        type: Sequelize.DECIMAL(8, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Discount amount or percentage'
      },
      discount_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'percent',
        allowNull: false,
        comment: 'percent or amount'
      },
      tax_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'percent',
        allowNull: false,
        comment: 'percent or amount'
      },
      set_menu: {
        type: Sequelize.SMALLINT,
        defaultValue: 0,
        allowNull: false,
        comment: '1 = is set menu, 0 = regular product'
      },
      branch_id: {
        type: Sequelize.BIGINT,
        defaultValue: 1,
        allowNull: false,
        comment: 'Branch ID that owns this product'
      },
      colors: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of available colors'
      },
      popularity_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of times this product was ordered'
      },
      product_type: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'veg, non_veg'
      },
      is_recommended: {
        type: Sequelize.SMALLINT,
        defaultValue: 0,
        allowNull: false,
        comment: '1 = recommended, 0 = not recommended'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['phone'], { unique: true });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['user_type']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['refer_code']);

    await queryInterface.addIndex('categories', ['parent_id']);
    await queryInterface.addIndex('categories', ['status']);
    await queryInterface.addIndex('categories', ['position']);
    await queryInterface.addIndex('categories', ['priority']);

    await queryInterface.addIndex('branches', ['email'], { unique: true });
    await queryInterface.addIndex('branches', ['status']);
    await queryInterface.addIndex('branches', ['phone']);

    await queryInterface.addIndex('products', ['status']);
    await queryInterface.addIndex('products', ['branch_id']);
    await queryInterface.addIndex('products', ['product_type']);
    await queryInterface.addIndex('products', ['is_recommended']);
    await queryInterface.addIndex('products', ['popularity_count']);

    // Add foreign key constraints
    await queryInterface.addConstraint('users', {
      fields: ['refer_by'],
      type: 'foreign key',
      name: 'users_refer_by_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('categories', {
      fields: ['parent_id'],
      type: 'foreign key',
      name: 'categories_parent_id_fkey',
      references: {
        table: 'categories',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('products', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'products_branch_id_fkey',
      references: {
        table: 'branches',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    console.log('✅ Core tables created successfully');
  },

  async down(queryInterface, _Sequelize) {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('branches');
    await queryInterface.dropTable('users');
    
    console.log('✅ Core tables dropped successfully');
  }
};
