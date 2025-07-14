const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PosSession = sequelize.define('PosSession', {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      comment: 'Session ID for the POS cart'
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Branch where this session is active'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Staff user managing this session'
    },
    customer_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Selected customer for the order (null for walk-in)'
    },
    table_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Selected table for dine-in orders'
    },
    cart_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON data containing cart items'
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Applied tax percentage'
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Applied discount percentage'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Fixed discount amount'
    },
    order_type: {
      type: DataTypes.ENUM('take_away', 'dine_in', 'delivery'),
      defaultValue: 'take_away',
      allowNull: false,
      comment: 'Type of order'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special instructions or notes'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Cart subtotal amount'
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
      comment: 'Final total amount after tax and discount'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When this session expires'
    }
  }, {
    tableName: 'pos_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['branch_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['table_id']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Define associations
  PosSession.associate = function(models) {
    PosSession.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch',
      onDelete: 'CASCADE'
    });
    
    PosSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'staff',
      onDelete: 'SET NULL'
    });
    
    PosSession.belongsTo(models.User, {
      foreignKey: 'customer_id',
      as: 'customer',
      onDelete: 'SET NULL'
    });
    
    PosSession.belongsTo(models.Table, {
      foreignKey: 'table_id',
      as: 'table',
      onDelete: 'SET NULL'
    });
  };

  return PosSession;
}; 