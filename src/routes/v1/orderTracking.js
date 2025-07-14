const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../config/clerk');
const orderTrackingController = require('../../controllers/orderTrackingController');

// ===================
// ORDER TRACKING ROUTES
// ===================

// Update order status (admin/restaurant staff)
router.patch('/:orderId/status', requireAuth, orderTrackingController.updateOrderStatus);

// Assign delivery man to order
router.patch('/:orderId/assign', requireAuth, orderTrackingController.assignDeliveryMan);

// Get real-time order tracking
router.get('/:orderId/realtime', requireAuth, orderTrackingController.getRealTimeTracking);

// Update delivery location (for delivery man)
router.patch('/:orderId/location', requireAuth, orderTrackingController.updateDeliveryLocation);

// Get orders by status
router.get('/status/:status', requireAuth, orderTrackingController.getOrdersByStatus);

module.exports = router; 