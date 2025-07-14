const express = require('express');
const router = express.Router();
const { 
  TableBookingController,
  createTableSessionValidation,
  placeTableOrderValidation,
  updateNotesValidation,
  paramValidation
} = require('../../controllers/tableBookingController');
const { authenticate } = require('../../middleware/auth');
const { requireAnyRole } = require('../../middleware/roleAuth');

// Public routes (accessible by customers)
router.get('/tables/:branchId', TableBookingController.getAvailableTables);
router.get('/orders/:tableToken', TableBookingController.getTableOrders);
router.post('/orders', placeTableOrderValidation, authenticate, TableBookingController.placeTableOrder);
router.get('/qr/:tableId', TableBookingController.generateTableQR);

// Staff/Admin routes (require authentication and appropriate role)
router.use(authenticate); // All routes below require authentication

// Table session management
router.post('/sessions', 
  createTableSessionValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.createTableSession
);

router.get('/sessions/:sessionId', 
  paramValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.getTableSessionDetails
);

router.put('/sessions/:sessionId/complete', 
  paramValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.completeTableSession
);

router.put('/sessions/:sessionId/cancel', 
  paramValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.cancelTableSession
);

router.get('/sessions/:sessionId/invoice', 
  paramValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.getTableSessionInvoice
);

router.put('/sessions/:sessionId/notes', 
  paramValidation,
  updateNotesValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.updateTableSessionNotes
);

// Running orders and management
router.get('/running-orders/:branchId', 
  paramValidation,
  requireAnyRole(['admin', 'staff']),
  TableBookingController.getRunningTableOrders
);

// Admin-only routes
router.get('/admin/tables/:branchId', 
  paramValidation,
  requireAnyRole(['admin']),
  TableBookingController.getTableListByBranch
);

router.get('/stats/:branchId', 
  paramValidation,
  requireAnyRole(['admin']),
  TableBookingController.getTableBookingStats
);

router.post('/cleanup', 
  requireAnyRole(['admin']),
  TableBookingController.cleanupExpiredSessions
);

module.exports = router; 