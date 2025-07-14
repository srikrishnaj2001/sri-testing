const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationReceiver = sequelize.define('NotificationReceiver', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    notification_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Reference to notification ID'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'User who received the notification'
    },
    user_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'customer',
      allowNull: false,
      comment: 'Type of user: customer, delivery_man, admin, kitchen'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether user has read this notification'
    },
    is_delivered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether notification was successfully delivered'
    },
    delivery_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'How notification was delivered: app, email, sms, push'
    },
    delivery_status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Delivery status of the notification'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if delivery failed'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON metadata for tracking delivery details'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was sent to user'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was delivered to user'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was read by user'
    }
  }, {
    tableName: 'notification_receivers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['notification_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['user_type']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['is_delivered']
      },
      {
        fields: ['delivery_status']
      },
      {
        fields: ['delivery_method']
      },
      {
        fields: ['sent_at']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Define associations
  NotificationReceiver.associate = function(models) {
    NotificationReceiver.belongsTo(models.Notification, {
      foreignKey: 'notification_id',
      as: 'notification',
      onDelete: 'CASCADE'
    });
    
    NotificationReceiver.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return NotificationReceiver;
}; 