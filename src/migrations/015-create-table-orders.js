'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('table_orders', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      table_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Table ID for this order session'
      },
      branch_table_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Unique token for table session'
      },
      branch_table_token_is_expired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether the table token has expired'
      },
      branch_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Branch where this table order is placed'
      },
      created_by: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Staff member who created this session'
      },
      session_start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'When the table session started'
      },
      session_end_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the table session ended'
      },
      total_people: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of people at the table'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Special notes or instructions for this table session'
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active',
        allowNull: false,
        comment: 'Current status of the table session'
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
    await queryInterface.addIndex('table_orders', ['table_id']);
    await queryInterface.addIndex('table_orders', ['branch_table_token'], {
      unique: true
    });
    await queryInterface.addIndex('table_orders', ['branch_id']);
    await queryInterface.addIndex('table_orders', ['branch_table_token_is_expired']);
    await queryInterface.addIndex('table_orders', ['status']);
    await queryInterface.addIndex('table_orders', ['session_start_time']);

    // Add foreign key constraints
    await queryInterface.addConstraint('table_orders', {
      fields: ['table_id'],
      type: 'foreign key',
      name: 'fk_table_orders_table_id',
      references: {
        table: 'tables',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('table_orders', {
      fields: ['branch_id'],
      type: 'foreign key',
      name: 'fk_table_orders_branch_id',
      references: {
        table: 'branches',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('table_orders', {
      fields: ['created_by'],
      type: 'foreign key',
      name: 'fk_table_orders_created_by',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('table_orders');
  }
}; 