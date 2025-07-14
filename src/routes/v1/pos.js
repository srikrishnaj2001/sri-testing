const express = require('express');
const router = express.Router();
const posController = require('../../controllers/posController');
const { clerkMiddleware } = require('../../config/clerk');
const { adminMiddleware } = require('../../middleware/adminMiddleware');

// POS Authentication middleware - require admin or kitchen staff
const posMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const userType = req.user.user_type;
  if (userType !== 'admin' && userType !== 'kitchen') {
    return res.status(403).json({ success: false, message: 'POS access requires admin or kitchen staff privileges' });
  }
  
  next();
};

// POS Dashboard and Session Management
router.get('/dashboard', clerkMiddleware, posMiddleware, posController.dashboard);
router.post('/session', clerkMiddleware, posMiddleware, posController.createSession);

// Product Management
router.get('/product/:productId/quick-view', clerkMiddleware, posMiddleware, posController.quickView);

// Cart Management
router.post('/cart/add', clerkMiddleware, posMiddleware, posController.addToCart);
router.post('/cart/remove', clerkMiddleware, posMiddleware, posController.removeFromCart);
router.post('/cart/update-quantity', clerkMiddleware, posMiddleware, posController.updateQuantity);
router.get('/cart/:sessionId', clerkMiddleware, posMiddleware, posController.getCart);
router.post('/cart/empty', clerkMiddleware, posMiddleware, posController.emptyCart);

// Tax and Discount Management
router.post('/cart/update-tax', clerkMiddleware, posMiddleware, posController.updateTax);
router.post('/cart/update-discount', clerkMiddleware, posMiddleware, posController.updateDiscount);

// Customer and Table Management
router.get('/customers/search', clerkMiddleware, posMiddleware, posController.searchCustomers);
router.post('/session/set-customer', clerkMiddleware, posMiddleware, posController.setCustomer);
router.post('/session/set-table', clerkMiddleware, posMiddleware, posController.setTable);
router.post('/session/set-order-type', clerkMiddleware, posMiddleware, posController.setOrderType);

// Table Management
router.get('/tables/branch/:branchId', clerkMiddleware, posMiddleware, posController.getTablesByBranch);
router.post('/tables/branch', clerkMiddleware, posMiddleware, posController.getTablesByBranch);

// Order Management
router.post('/order/place', clerkMiddleware, posMiddleware, posController.placeOrder);
router.get('/orders', clerkMiddleware, posMiddleware, posController.getOrders);

module.exports = router; 