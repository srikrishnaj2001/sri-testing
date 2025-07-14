'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tables table
    await queryInterface.createTable('tables', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Table number for identification'
      },
      capacity: {
        type: Sequelize.INTEGER,
        defaultValue: 4,
        allowNull: false,
        comment: 'Number of people this table can accommodate'
      },
      branch_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Branch this table belongs to'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether table is available for use'
      },
      is_occupied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether table is currently occupied'
      },
      qr_code: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'QR code for table ordering'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional table description or notes'
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Physical position of table (e.g., window, corner, center)'
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

    // Create pos_sessions table
    await queryInterface.createTable('pos_sessions', {
      id: {
        type: Sequelize.STRING(255),
        primaryKey: true,
        comment: 'Session ID for the POS cart'
      },
      branch_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Branch where this session is active'
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Staff user managing this session'
      },
      customer_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Selected customer for the order (null for walk-in)'
      },
      table_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Selected table for dine-in orders'
      },
      cart_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON data containing cart items'
      },
      tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Applied tax percentage'
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Applied discount percentage'
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Fixed discount amount'
      },
      order_type: {
        type: Sequelize.ENUM('take_away', 'dine_in', 'delivery'),
        defaultValue: 'take_away',
        allowNull: false,
        comment: 'Type of order'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Special instructions or notes'
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Cart subtotal amount'
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false,
        comment: 'Final total amount after tax and discount'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When this session expires'
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

    // Add indexes for tables
    await queryInterface.addIndex('tables', ['branch_id']);
    await queryInterface.addIndex('tables', ['is_active']);
    await queryInterface.addIndex('tables', ['is_occupied']);
    await queryInterface.addIndex('tables', ['number', 'branch_id'], { unique: true });

    // Add indexes for pos_sessions
    await queryInterface.addIndex('pos_sessions', ['branch_id']);
    await queryInterface.addIndex('pos_sessions', ['user_id']);
    await queryInterface.addIndex('pos_sessions', ['customer_id']);
    await queryInterface.addIndex('pos_sessions', ['table_id']);
    await queryInterface.addIndex('pos_sessions', ['expires_at']);
    await queryInterface.addIndex('pos_sessions', ['created_at']);

    // Add foreign key constraints for tables
    await queryInterface.addConstraint('tables', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'tables_branch_id_fkey',
      references: {
        table: 'branches',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add foreign key constraints for pos_sessions
    await queryInterface.addConstraint('pos_sessions', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'pos_sessions_branch_id_fkey',
      references: {
        table: 'branches',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('pos_sessions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'pos_sessions_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('pos_sessions', {
      fields: ['customer_id'],
      type: 'foreign key',
      name: 'pos_sessions_customer_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('pos_sessions', {
      fields: ['table_id'],
      type: 'foreign key',
      name: 'pos_sessions_table_id_fkey',
      references: {
        table: 'tables',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('pos_sessions', 'pos_sessions_table_id_fkey');
    await queryInterface.removeConstraint('pos_sessions', 'pos_sessions_customer_id_fkey');
    await queryInterface.removeConstraint('pos_sessions', 'pos_sessions_user_id_fkey');
    await queryInterface.removeConstraint('pos_sessions', 'pos_sessions_branch_id_fkey');
    await queryInterface.removeConstraint('tables', 'tables_branch_id_fkey');

    // Drop tables
    await queryInterface.dropTable('pos_sessions');
    await queryInterface.dropTable('tables');
  }
}; 