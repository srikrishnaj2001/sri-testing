const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailNotification = sequelize.define('EmailNotification', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    to_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Recipient email address'
    },
    to_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Recipient name'
    },
    from_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Sender email address'
    },
    from_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Sender name'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Email subject'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Email body content'
    },
    html_body: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'HTML email body content'
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
      comment: 'Email type: welcome, order_confirmation, password_reset, etc.'
    },
    template: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Email template name used'
    },
    template_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON data used in email template'
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'bounced'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Email delivery status'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if delivery failed'
    },
    message_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email service message ID'
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of attachment file paths'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      defaultValue: 'normal',
      allowNull: false,
      comment: 'Email priority'
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When to send email (null for immediate)'
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When email was sent'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When email was delivered'
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When email was opened by recipient'
    },
    clicked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When email links were clicked'
    }
  }, {
    tableName: 'email_notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['to_email']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['template']
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
  EmailNotification.associate = function(models) {
    EmailNotification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return EmailNotification;
}; 