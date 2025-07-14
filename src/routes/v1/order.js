const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../../config/clerk');
const orderController = require('../../controllers/orderController');

// ===================
// ORDER MANAGEMENT ROUTES
// ===================

// Place a new order
router.post('/', requireAuth, orderController.placeOrder);

// Get customer orders (with filtering and pagination)
router.get('/', requireAuth, orderController.getCustomerOrders);

// Get order statistics
router.get('/stats', requireAuth, orderController.getOrderStats);

// Get order by ID
router.get('/:orderId', requireAuth, orderController.getOrderById);

// Cancel order
router.patch('/:orderId/cancel', requireAuth, orderController.cancelOrder);

// Track order
router.get('/:orderId/track', requireAuth, orderController.trackOrder);

// Reorder (place same order again)
router.post('/:orderId/reorder', requireAuth, orderController.reorder);

// Rate and review order
router.post('/:orderId/rate', requireAuth, orderController.rateOrder);

module.exports = router; 