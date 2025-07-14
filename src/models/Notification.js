const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Notification title'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notification description/message'
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Notification image filename'
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      allowNull: false,
      comment: '1 = active, 0 = inactive'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'User ID for targeted notifications, null for general notifications'
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'general',
      allowNull: false,
      comment: 'Notification type: general, order, promotion, maintenance, etc.'
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON data for additional notification information'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether user has read this notification'
    },
    delivery_method: {
      type: DataTypes.STRING(50),
      defaultValue: 'app',
      allowNull: false,
      comment: 'Delivery method: app, email, sms, push'
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to send notification (null for immediate)'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was actually sent'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was read by user'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['scheduled_at']
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
  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return Notification;
}; 