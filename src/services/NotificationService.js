const { Notification, NotificationReceiver, User } = require('../models');
const FirebaseService = require('./FirebaseService');
const EmailService = require('./EmailService');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Send notification to user(s)
   */
  async sendNotification(options) {
    try {
      const {
        title,
        message,
        type = 'general',
        user_id = null,
        user_type = 'customer',
        delivery_methods = ['app'],
        data = {},
        image = null,
        scheduled_at = null,
        priority = 'normal'
      } = options;

      // Create notification record
      const notification = await Notification.create({
        title,
        description: message,
        type,
        user_id,
        data: JSON.stringify(data),
        image,
        scheduled_at,
        status: 1,
        delivery_method: delivery_methods.join(',')
      });

      // If scheduled for later, don't send immediately
      if (scheduled_at && new Date(scheduled_at) > new Date()) {
        return { success: true, notification, scheduled: true };
      }

      // Send notifications based on delivery methods
      const results = [];
      
      if (user_id) {
        // Send to specific user
        const user = await User.findByPk(user_id);
        if (user) {
          const sendResult = await this.sendNotificationToUser(
            user, 
            notification, 
            delivery_methods, 
            { priority, data }
          );
          results.push(sendResult);
        }
      } else {
        // Send to all users of specific type
        const users = await this.getUsersByType(user_type);
        for (const user of users) {
          const sendResult = await this.sendNotificationToUser(
            user, 
            notification, 
            delivery_methods, 
            { priority, data }
          );
          results.push(sendResult);
        }
      }

      // Update notification as sent
      await notification.update({
        sent_at: new Date()
      });

      return { success: true, notification, results };
    } catch (error) {
      console.error('Notification send error:', error);
      throw error;
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(user, notification, delivery_methods, options = {}) {
    const results = [];

    for (const method of delivery_methods) {
      try {
        let result;
        
        switch (method) {
          case 'push':
            result = await this.sendPushNotification(user, notification, options);
            break;
          case 'email':
            result = await this.sendEmailNotification(user, notification, options);
            break;
          case 'sms':
            result = await this.sendSmsNotification(user, notification, options);
            break;
          case 'app':
            result = await this.sendAppNotification(user, notification, options);
            break;
          default:
            result = { success: false, error: `Unknown delivery method: ${method}` };
        }

        // Log notification receiver
        await NotificationReceiver.create({
          notification_id: notification.id,
          user_id: user.id,
          user_type: user.user_type || 'customer',
          delivery_method: method,
          delivery_status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
          sent_at: result.success ? new Date() : null,
          metadata: JSON.stringify(result)
        });

        results.push({ method, ...result });
      } catch (error) {
        console.error(`Error sending ${method} notification:`, error);
        results.push({ method, success: false, error: error.message });
      }
    }

    return { user_id: user.id, results };
  }

  /**
   * Send push notification via Firebase
   */
  async sendPushNotification(user, notification, options = {}) {
    if (!user.cm_firebase_token) {
      return { success: false, error: 'User has no FCM token' };
    }

    try {
      const result = await FirebaseService.sendNotification(
        user.cm_firebase_token,
        notification.title,
        notification.description,
        JSON.parse(notification.data || '{}'),
        {
          image: notification.image,
          user_id: user.id,
          type: notification.type,
          priority: options.priority || 'normal'
        }
      );

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(user, notification, options = {}) {
    if (!user.email) {
      return { success: false, error: 'User has no email address' };
    }

    try {
      const result = await EmailService.sendEmail(
        user.email,
        notification.title,
        notification.description,
        {
          user_id: user.id,
          type: notification.type,
          toName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
          priority: options.priority || 'normal'
        }
      );

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification (placeholder)
   */
  async sendSmsNotification(user, notification, options = {}) {
    // SMS service implementation would go here
    return { success: false, error: 'SMS service not implemented' };
  }

  /**
   * Send app notification (in-app notification)
   */
  async sendAppNotification(user, notification, options = {}) {
    // App notification is handled by creating the notification record
    // and marking it as delivered to the user
    return { success: true, method: 'app' };
  }

  /**
   * Get users by type
   */
  async getUsersByType(userType) {
    const whereClause = userType === 'customer' 
      ? { user_type: { [Op.or]: [null, 'customer'] } }
      : { user_type: userType };

    return await User.findAll({
      where: {
        ...whereClause,
        is_active: 1
      },
      attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'user_type', 'cm_firebase_token']
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { user_id: null } // General notifications
        ],
        status: 1
      },
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'f_name', 'l_name'],
          required: false
        }
      ]
    });

    return {
      notifications: notifications.rows,
      total: notifications.count,
      page,
      limit,
      totalPages: Math.ceil(notifications.count / limit)
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Update notification if it's user-specific
    if (notification.user_id === userId) {
      await notification.update({
        is_read: true,
        read_at: new Date()
      });
    }

    // Update notification receiver record
    await NotificationReceiver.update(
      {
        is_read: true,
        read_at: new Date(),
        delivery_status: 'read'
      },
      {
        where: {
          notification_id: notificationId,
          user_id: userId
        }
      }
    );

    return { success: true };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        [Op.or]: [
          { user_id: userId },
          { user_id: null }
        ],
        is_read: false,
        status: 1
      }
    });

    return count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Only allow deletion if it's user-specific notification
    if (notification.user_id !== userId) {
      throw new Error('Cannot delete general notifications');
    }

    await notification.destroy();
    return { success: true };
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(order, type, additionalData = {}) {
    const templates = {
      order_placed: {
        title: 'Order Placed Successfully',
        message: `Your order #${order.id} has been placed successfully.`,
        type: 'order'
      },
      order_confirmed: {
        title: 'Order Confirmed',
        message: `Your order #${order.id} has been confirmed and is being prepared.`,
        type: 'order'
      },
      order_ready: {
        title: 'Order Ready',
        message: `Your order #${order.id} is ready for pickup/delivery.`,
        type: 'order'
      },
      order_delivered: {
        title: 'Order Delivered',
        message: `Your order #${order.id} has been delivered successfully.`,
        type: 'order'
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown order notification type: ${type}`);
    }

    return await this.sendNotification({
      title: template.title,
      message: template.message,
      type: template.type,
      user_id: order.user_id,
      delivery_methods: ['app', 'push', 'email'],
      data: {
        order_id: order.id,
        order_status: order.order_status,
        ...additionalData
      }
    });
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(userIds, title, message, options = {}) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendNotification({
          title,
          message,
          user_id: userId,
          ...options
        });
        results.push({ user_id: userId, success: true, result });
      } catch (error) {
        results.push({ user_id: userId, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new NotificationService(); 