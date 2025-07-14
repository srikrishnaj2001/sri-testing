const express = require('express');
const router = express.Router();
const deliveryManController = require('../../controllers/deliveryManController');
const deliveryOrderController = require('../../controllers/deliveryOrderController');
const { requireAuth } = require('../../config/clerk');
const { upload } = require('../../middleware/upload');

// All delivery routes require delivery man authentication
router.use(requireAuth('delivery_man'));

// Delivery Man Profile routes
router.get('/profile', deliveryManController.getProfile);
router.put('/profile', deliveryManController.updateProfile);
router.get('/profile/stats', deliveryManController.getDeliveryStats);
router.get('/profile/performance', deliveryManController.getPerformanceMetrics);
router.get('/profile/earnings', deliveryManController.getEarnings);

// Availability and Status routes
router.post('/availability', deliveryManController.updateAvailability);
router.post('/location', deliveryManController.updateLocation);
router.post('/status', deliveryManController.updateDeliveryStatus);

// Vehicle Information routes
router.put('/vehicle', deliveryManController.updateVehicleInfo);

// Document Upload routes
router.post('/documents', upload.single('document'), deliveryManController.uploadDocument);

// Order Management routes
router.get('/orders', deliveryOrderController.getAssignedOrders);
router.get('/orders/nearby', deliveryManController.getNearbyDeliveries);
router.get('/orders/history', deliveryOrderController.getDeliveryHistory);
router.get('/orders/:order_id', deliveryOrderController.getOrderDetails);

// Order Status Update routes
router.post('/orders/:order_id/accept', deliveryOrderController.acceptOrder);
router.post('/orders/:order_id/pickup/start', deliveryOrderController.startPickupJourney);
router.post('/orders/:order_id/pickup/arrive', deliveryOrderController.arriveAtPickup);
router.post('/orders/:order_id/pickup/complete', deliveryOrderController.pickupOrder);
router.post('/orders/:order_id/delivery/start', deliveryOrderController.startDeliveryJourney);
router.post('/orders/:order_id/delivery/arrive', deliveryOrderController.arriveAtDelivery);
router.post('/orders/:order_id/delivery/complete', deliveryOrderController.completeDelivery);

// Issue Reporting routes
router.post('/orders/:order_id/issues', deliveryOrderController.reportIssue);

module.exports = router; 