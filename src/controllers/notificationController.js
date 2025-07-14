const { Notification, NotificationReceiver, User } = require('../models');
const NotificationService = require('../services/NotificationService');
const { generateSuccessResponse, generateErrorResponse } = require('../utils/responses');
const { translateWithRequest } = require('../utils/translation');
const { Op } = require('sequelize');

/**
 * Get user notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    const whereClause = {
      [Op.or]: [
        { user_id: userId },
        { user_id: null } // General notifications
      ],
      status: 1
    };

    if (type) {
      whereClause.type = type;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'f_name', 'l_name'],
          required: false
        }
      ]
    });

    const response = {
      notifications: notifications.rows.map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        image: notification.image,
        type: notification.type,
        data: notification.data ? JSON.parse(notification.data) : null,
        is_read: notification.is_read,
        created_at: notification.created_at,
        updated_at: notification.updated_at
      })),
      total: notifications.count,
      page,
      limit,
      totalPages: Math.ceil(notifications.count / limit)
    };

    return generateSuccessResponse(res, response, translateWithRequest(req, 'messages.data_retrieved'));
  } catch (error) {
    console.error('Get user notifications error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    const count = await NotificationService.getUnreadCount(userId);

    return generateSuccessResponse(res, { count }, translateWithRequest(req, 'messages.data_retrieved'));
  } catch (error) {
    console.error('Get unread count error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    if (!notificationId) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.invalid_request'));
    }

    const result = await NotificationService.markAsRead(notificationId, userId);

    return generateSuccessResponse(res, result, translateWithRequest(req, 'messages.notification_marked_read'));
  } catch (error) {
    console.error('Mark as read error:', error);
    const message = error.message === 'Notification not found' 
      ? translateWithRequest(req, 'messages.notification_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, error.message === 'Notification not found' ? 404 : 500, message);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    // Update all user notifications as read
    await Notification.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          [Op.or]: [
            { user_id: userId },
            { user_id: null }
          ],
          is_read: false,
          status: 1
        }
      }
    );

    // Update all notification receivers for this user
    await NotificationReceiver.update(
      { is_read: true, read_at: new Date(), delivery_status: 'read' },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.all_notifications_marked_read'));
  } catch (error) {
    console.error('Mark all as read error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    if (!notificationId) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.invalid_request'));
    }

    const result = await NotificationService.deleteNotification(notificationId, userId);

    return generateSuccessResponse(res, result, translateWithRequest(req, 'messages.notification_deleted'));
  } catch (error) {
    console.error('Delete notification error:', error);
    const message = error.message === 'Notification not found' 
      ? translateWithRequest(req, 'messages.notification_not_found')
      : error.message === 'Cannot delete general notifications'
      ? translateWithRequest(req, 'messages.cannot_delete_general_notification')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, error.message === 'Notification not found' ? 404 : 403, message);
  }
};

/**
 * Send notification (Admin only)
 */
const sendNotification = async (req, res) => {
  try {
    const { title, message, type = 'general', user_id, user_type = 'customer', delivery_methods = ['app'], data = {}, image, scheduled_at } = req.body;

    // Validate required fields
    if (!title || !message) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.title_message_required'));
    }

    // Validate delivery methods
    const validMethods = ['app', 'push', 'email', 'sms'];
    const invalidMethods = delivery_methods.filter(method => !validMethods.includes(method));
    if (invalidMethods.length > 0) {
      return generateErrorResponse(res, 400, `Invalid delivery methods: ${invalidMethods.join(', ')}`);
    }

    const result = await NotificationService.sendNotification({
      title,
      message,
      type,
      user_id,
      user_type,
      delivery_methods,
      data,
      image,
      scheduled_at
    });

    return generateSuccessResponse(res, result, translateWithRequest(req, 'messages.notification_sent'));
  } catch (error) {
    console.error('Send notification error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Send bulk notifications (Admin only)
 */
const sendBulkNotifications = async (req, res) => {
  try {
    const { title, message, user_ids, type = 'general', delivery_methods = ['app'], data = {}, image } = req.body;

    // Validate required fields
    if (!title || !message || !user_ids || !Array.isArray(user_ids)) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.invalid_bulk_notification_data'));
    }

    const results = await NotificationService.sendBulkNotifications(user_ids, title, message, {
      type,
      delivery_methods,
      data,
      image
    });

    return generateSuccessResponse(res, results, translateWithRequest(req, 'messages.bulk_notifications_sent'));
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Get notification statistics (Admin only)
 */
const getNotificationStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Notification.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        'type',
        'delivery_method',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['type', 'delivery_method'],
      raw: true
    });

    // Get delivery status stats
    const deliveryStats = await NotificationReceiver.findAll({
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        'delivery_status',
        'delivery_method',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['delivery_status', 'delivery_method'],
      raw: true
    });

    return generateSuccessResponse(res, { stats, deliveryStats }, translateWithRequest(req, 'messages.data_retrieved'));
  } catch (error) {
    console.error('Get notification stats error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Update FCM token for user
 */
const updateFcmToken = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { fcm_token } = req.body;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    if (!fcm_token) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.fcm_token_required'));
    }

    await User.update(
      { cm_firebase_token: fcm_token },
      { where: { id: userId } }
    );

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.fcm_token_updated'));
  } catch (error) {
    console.error('Update FCM token error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Get notification types
 */
const getNotificationTypes = async (req, res) => {
  try {
    const types = [
      { value: 'general', label: 'General' },
      { value: 'order', label: 'Order' },
      { value: 'promotion', label: 'Promotion' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'message', label: 'Message' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'payment', label: 'Payment' },
      { value: 'account', label: 'Account' }
    ];

    return generateSuccessResponse(res, { types }, translateWithRequest(req, 'messages.data_retrieved'));
  } catch (error) {
    console.error('Get notification types error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Test notification (Admin only)
 */
const testNotification = async (req, res) => {
  try {
    const { type = 'push', user_id } = req.body;

    if (!user_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.user_id_required'));
    }

    const result = await NotificationService.sendNotification({
      title: 'Test Notification',
      message: 'This is a test notification from the admin panel.',
      type: 'general',
      user_id,
      delivery_methods: [type],
      data: { test: true }
    });

    return generateSuccessResponse(res, result, translateWithRequest(req, 'messages.test_notification_sent'));
  } catch (error) {
    console.error('Test notification error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
  sendBulkNotifications,
  getNotificationStats,
  updateFcmToken,
  getNotificationTypes,
  testNotification
}; 