const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TableOrder = sequelize.define('TableOrder', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    table_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Table ID for this order session'
    },
    branch_table_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Unique token for table session'
    },
    branch_table_token_is_expired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether the table token has expired'
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Branch where this table order is placed'
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Staff member who created this session'
    },
    session_start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the table session started'
    },
    session_end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the table session ended'
    },
    total_people: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of people at the table'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special notes or instructions for this table session'
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      defaultValue: 'active',
      allowNull: false,
      comment: 'Current status of the table session'
    }
  }, {
    tableName: 'table_orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['table_id']
      },
      {
        fields: ['branch_table_token'],
        unique: true
      },
      {
        fields: ['branch_id']
      },
      {
        fields: ['branch_table_token_is_expired']
      },
      {
        fields: ['status']
      },
      {
        fields: ['session_start_time']
      }
    ]
  });

  // Define associations
  TableOrder.associate = function(models) {
    TableOrder.belongsTo(models.Table, {
      foreignKey: 'table_id',
      as: 'table',
      onDelete: 'CASCADE'
    });
    
    TableOrder.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch',
      onDelete: 'CASCADE'
    });
    
    TableOrder.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL'
    });
    
    TableOrder.hasMany(models.Order, {
      foreignKey: 'table_order_id',
      as: 'orders'
    });
  };

  return TableOrder;
}; 