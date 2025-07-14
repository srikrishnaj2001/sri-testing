const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificationController');
const { clerkMiddleware } = require('../../config/clerk');
const { adminMiddleware } = require('../../middleware/adminMiddleware');

// User notification routes
router.get('/', clerkMiddleware, notificationController.getUserNotifications);
router.get('/unread-count', clerkMiddleware, notificationController.getUnreadCount);
router.get('/types', clerkMiddleware, notificationController.getNotificationTypes);
router.put('/fcm-token', clerkMiddleware, notificationController.updateFcmToken);
router.put('/:id/read', clerkMiddleware, notificationController.markAsRead);
router.put('/mark-all-read', clerkMiddleware, notificationController.markAllAsRead);
router.delete('/:id', clerkMiddleware, notificationController.deleteNotification);

// Admin notification routes
router.post('/send', clerkMiddleware, adminMiddleware, notificationController.sendNotification);
router.post('/send-bulk', clerkMiddleware, adminMiddleware, notificationController.sendBulkNotifications);
router.post('/test', clerkMiddleware, adminMiddleware, notificationController.testNotification);
router.get('/stats', clerkMiddleware, adminMiddleware, notificationController.getNotificationStats);

module.exports = router; 