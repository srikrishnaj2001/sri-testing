const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FcmNotification = sequelize.define('FcmNotification', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    fcm_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Firebase Cloud Messaging token'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Push notification title'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Push notification body/message'
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON data payload for the notification'
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Image URL for rich notification'
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: 'Target user ID'
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'general',
      allowNull: false,
      comment: 'Notification type: order, chat, promotion, etc.'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'FCM notification delivery status'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if delivery failed'
    },
    fcm_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'FCM message ID returned by Firebase'
    },
    click_action: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Action to perform when notification is clicked'
    },
    priority: {
      type: DataTypes.ENUM('normal', 'high'),
      defaultValue: 'normal',
      allowNull: false,
      comment: 'Notification priority'
    },
    sound: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Custom sound file name'
    },
    badge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Badge count for iOS'
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to send notification (null for immediate)'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was sent to FCM'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When notification was delivered to device'
    }
  }, {
    tableName: 'fcm_notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['fcm_token']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
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
  FcmNotification.associate = function(models) {
    FcmNotification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return FcmNotification;
}; 