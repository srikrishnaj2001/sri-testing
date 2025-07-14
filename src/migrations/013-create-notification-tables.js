'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Notification title'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notification description/message'
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Notification image filename'
      },
      status: {
        type: Sequelize.TINYINT,
        defaultValue: 1,
        allowNull: false,
        comment: '1 = active, 0 = inactive'
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'User ID for targeted notifications, null for general notifications'
      },
      type: {
        type: Sequelize.STRING(50),
        defaultValue: 'general',
        allowNull: false,
        comment: 'Notification type: general, order, promotion, maintenance, etc.'
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON data for additional notification information'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether user has read this notification'
      },
      delivery_method: {
        type: Sequelize.STRING(50),
        defaultValue: 'app',
        allowNull: false,
        comment: 'Delivery method: app, email, sms, push'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to send notification (null for immediate)'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was actually sent'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was read by user'
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

    // Create fcm_notifications table
    await queryInterface.createTable('fcm_notifications', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      fcm_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Firebase Cloud Messaging token'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Push notification title'
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Push notification body/message'
      },
      data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON data payload for the notification'
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Image URL for rich notification'
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Target user ID'
      },
      type: {
        type: Sequelize.STRING(50),
        defaultValue: 'general',
        allowNull: false,
        comment: 'Notification type: order, chat, promotion, etc.'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'FCM notification delivery status'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if delivery failed'
      },
      fcm_message_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'FCM message ID returned by Firebase'
      },
      click_action: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Action to perform when notification is clicked'
      },
      priority: {
        type: Sequelize.ENUM('normal', 'high'),
        defaultValue: 'normal',
        allowNull: false,
        comment: 'Notification priority'
      },
      sound: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Custom sound file name'
      },
      badge: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Badge count for iOS'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to send notification (null for immediate)'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was sent to FCM'
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was delivered to device'
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

    // Create notification_receivers table
    await queryInterface.createTable('notification_receivers', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      notification_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'Reference to notification ID'
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        comment: 'User who received the notification'
      },
      user_type: {
        type: Sequelize.STRING(50),
        defaultValue: 'customer',
        allowNull: false,
        comment: 'Type of user: customer, delivery_man, admin, kitchen'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether user has read this notification'
      },
      is_delivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether notification was successfully delivered'
      },
      delivery_method: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'How notification was delivered: app, email, sms, push'
      },
      delivery_status: {
        type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Delivery status of the notification'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if delivery failed'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON metadata for tracking delivery details'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was sent to user'
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was delivered to user'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When notification was read by user'
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

    // Create email_notifications table
    await queryInterface.createTable('email_notifications', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      to_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Recipient email address'
      },
      to_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Recipient name'
      },
      from_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Sender email address'
      },
      from_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Sender name'
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email subject'
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Email body content'
      },
      html_body: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'HTML email body content'
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Target user ID'
      },
      type: {
        type: Sequelize.STRING(50),
        defaultValue: 'general',
        allowNull: false,
        comment: 'Email type: welcome, order_confirmation, password_reset, etc.'
      },
      template: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Email template name used'
      },
      template_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON data used in email template'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'bounced'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Email delivery status'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if delivery failed'
      },
      message_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Email service message ID'
      },
      attachments: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of attachment file paths'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high'),
        defaultValue: 'normal',
        allowNull: false,
        comment: 'Email priority'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When to send email (null for immediate)'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email was sent'
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email was delivered'
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email was opened by recipient'
      },
      clicked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When email links were clicked'
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

    // Add indexes for notifications
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notifications', ['is_read']);
    await queryInterface.addIndex('notifications', ['scheduled_at']);
    await queryInterface.addIndex('notifications', ['sent_at']);
    await queryInterface.addIndex('notifications', ['created_at']);

    // Add indexes for fcm_notifications
    await queryInterface.addIndex('fcm_notifications', ['user_id']);
    await queryInterface.addIndex('fcm_notifications', ['fcm_token']);
    await queryInterface.addIndex('fcm_notifications', ['type']);
    await queryInterface.addIndex('fcm_notifications', ['status']);
    await queryInterface.addIndex('fcm_notifications', ['priority']);
    await queryInterface.addIndex('fcm_notifications', ['scheduled_at']);
    await queryInterface.addIndex('fcm_notifications', ['sent_at']);
    await queryInterface.addIndex('fcm_notifications', ['created_at']);

    // Add indexes for notification_receivers
    await queryInterface.addIndex('notification_receivers', ['notification_id']);
    await queryInterface.addIndex('notification_receivers', ['user_id']);
    await queryInterface.addIndex('notification_receivers', ['user_type']);
    await queryInterface.addIndex('notification_receivers', ['is_read']);
    await queryInterface.addIndex('notification_receivers', ['is_delivered']);
    await queryInterface.addIndex('notification_receivers', ['delivery_status']);
    await queryInterface.addIndex('notification_receivers', ['delivery_method']);
    await queryInterface.addIndex('notification_receivers', ['sent_at']);
    await queryInterface.addIndex('notification_receivers', ['created_at']);

    // Add indexes for email_notifications
    await queryInterface.addIndex('email_notifications', ['to_email']);
    await queryInterface.addIndex('email_notifications', ['user_id']);
    await queryInterface.addIndex('email_notifications', ['type']);
    await queryInterface.addIndex('email_notifications', ['template']);
    await queryInterface.addIndex('email_notifications', ['status']);
    await queryInterface.addIndex('email_notifications', ['priority']);
    await queryInterface.addIndex('email_notifications', ['scheduled_at']);
    await queryInterface.addIndex('email_notifications', ['sent_at']);
    await queryInterface.addIndex('email_notifications', ['created_at']);

    // Add foreign key constraints
    await queryInterface.addConstraint('notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'notifications_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('fcm_notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fcm_notifications_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('notification_receivers', {
      fields: ['notification_id'],
      type: 'foreign key',
      name: 'notification_receivers_notification_id_fkey',
      references: {
        table: 'notifications',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('notification_receivers', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'notification_receivers_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('email_notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'email_notifications_user_id_fkey',
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('notifications', 'notifications_user_id_fkey');
    await queryInterface.removeConstraint('fcm_notifications', 'fcm_notifications_user_id_fkey');
    await queryInterface.removeConstraint('notification_receivers', 'notification_receivers_notification_id_fkey');
    await queryInterface.removeConstraint('notification_receivers', 'notification_receivers_user_id_fkey');
    await queryInterface.removeConstraint('email_notifications', 'email_notifications_user_id_fkey');

    // Drop tables
    await queryInterface.dropTable('email_notifications');
    await queryInterface.dropTable('notification_receivers');
    await queryInterface.dropTable('fcm_notifications');
    await queryInterface.dropTable('notifications');
  }
}; 