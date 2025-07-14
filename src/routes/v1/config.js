const express = require('express');
const router = express.Router();
const configController = require('../../controllers/configController');

// Public routes (no authentication required)

// Get app configuration
router.get('/', configController.getAppConfig);

// Get business hours
router.get('/business-hours', configController.getBusinessHours);

// Get all branches
router.get('/branches', configController.getBranches);

// Get branches by location
router.get('/branches/location', configController.getBranchesByLocation);

// Get single branch by ID
router.get('/branches/:id', configController.getBranch);

// Check delivery availability
router.get('/delivery/availability', configController.checkDeliveryAvailability);

// Get delivery zones
router.get('/delivery/zones', configController.getDeliveryZones);

// Get payment methods
router.get('/payment-methods', configController.getPaymentMethods);

module.exports = router; 