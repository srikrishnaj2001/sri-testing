const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { 
  requireAuth, 
  requireCustomer, 
  requireDeliveryMan, 
  requireAdmin, 
  requireKitchen,
  optionalAuth 
} = require('../../config/clerk');
const { 
  validateRequest, 
  registrationSchema, 
  loginSchema, 
  profileUpdateSchema, 
  passwordChangeSchema, 
  phoneVerificationSchema 
} = require('../../utils/validation');

// ========================
// PUBLIC ROUTES (No Auth)
// ========================

// Customer Authentication
router.post('/customer/register', 
  validateRequest(registrationSchema),
  authController.registerCustomer
);

router.post('/customer/login', 
  validateRequest(loginSchema),
  authController.loginCustomer
);

// Delivery Man Authentication
router.post('/delivery-man/login', 
  validateRequest(loginSchema),
  authController.loginDeliveryMan
);

// Admin Authentication
router.post('/admin/login', 
  validateRequest(loginSchema),
  authController.loginAdmin
);

// Kitchen Staff Authentication
router.post('/kitchen/login', 
  validateRequest(loginSchema),
  authController.loginKitchen
);

// ========================
// AUTHENTICATED ROUTES
// ========================

// Universal routes (any authenticated user)
router.post('/logout', optionalAuth, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Profile management (any authenticated user)
router.get('/profile', requireAuth([]), authController.getProfile);
router.put('/profile', requireAuth([]), validateRequest(profileUpdateSchema), authController.updateProfile);
router.post('/change-password', requireAuth([]), validateRequest(passwordChangeSchema), authController.changePassword);

// Phone verification (any authenticated user)
router.post('/verify-phone', requireAuth([]), validateRequest(phoneVerificationSchema), authController.verifyPhone);

// ========================
// CUSTOMER SPECIFIC ROUTES
// ========================

// Customer profile routes
router.get('/customer/profile', requireCustomer(), authController.getProfile);
router.put('/customer/profile', requireCustomer(), validateRequest(profileUpdateSchema), authController.updateProfile);
router.post('/customer/change-password', requireCustomer(), validateRequest(passwordChangeSchema), authController.changePassword);
router.post('/customer/verify-phone', requireCustomer(), validateRequest(phoneVerificationSchema), authController.verifyPhone);

// ========================
// DELIVERY MAN SPECIFIC ROUTES
// ========================

// Delivery man profile routes
router.get('/delivery-man/profile', requireDeliveryMan(), authController.getProfile);
router.put('/delivery-man/profile', requireDeliveryMan(), validateRequest(profileUpdateSchema), authController.updateProfile);
router.post('/delivery-man/change-password', requireDeliveryMan(), validateRequest(passwordChangeSchema), authController.changePassword);

// ========================
// ADMIN SPECIFIC ROUTES
// ========================

// Admin profile routes
router.get('/admin/profile', requireAdmin(), authController.getProfile);
router.put('/admin/profile', requireAdmin(), validateRequest(profileUpdateSchema), authController.updateProfile);
router.post('/admin/change-password', requireAdmin(), validateRequest(passwordChangeSchema), authController.changePassword);

// ========================
// KITCHEN SPECIFIC ROUTES
// ========================

// Kitchen staff profile routes
router.get('/kitchen/profile', requireKitchen(), authController.getProfile);
router.put('/kitchen/profile', requireKitchen(), validateRequest(profileUpdateSchema), authController.updateProfile);
router.post('/kitchen/change-password', requireKitchen(), validateRequest(passwordChangeSchema), authController.changePassword);

// ========================
// UTILITY ROUTES
// ========================

// Check authentication status
router.get('/check', optionalAuth, (req, res) => {
  if (req.user) {
    return res.json({
      success: true,
      message: 'User is authenticated',
      status_code: 200,
      user: req.user,
      authenticated: true
    });
  } else {
    return res.json({
      success: true,
      message: 'No authentication found',
      status_code: 200,
      authenticated: false
    });
  }
});

// Get user roles and permissions
router.get('/permissions', requireAuth([]), (req, res) => {
  const userType = req.user.type;
  const permissions = {
    customer: ['place_order', 'view_own_orders', 'manage_profile', 'manage_addresses'],
    delivery_man: ['view_assigned_orders', 'update_delivery_status', 'view_delivery_history'],
    admin: ['manage_users', 'manage_orders', 'manage_products', 'manage_delivery', 'view_reports', 'manage_settings'],
    kitchen: ['view_orders', 'update_order_status', 'view_products'],
    super_admin: ['*']
  };
  
  const userPermissions = permissions[userType] || [];
  
  return res.json({
    success: true,
    message: 'User permissions retrieved',
    status_code: 200,
    user_type: userType,
    permissions: userPermissions,
    has_all_permissions: userPermissions.includes('*')
  });
});

// Validate token endpoint
router.post('/validate-token', (req, res) => {
  const jwt = require('jsonwebtoken');
  const { clerkConfig } = require('../../config/clerk');
  
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
        status_code: 400
      });
    }
    
    const decoded = jwt.verify(token, clerkConfig.jwtKey);
    
    return res.json({
      success: true,
      message: 'Token is valid',
      status_code: 200,
      valid: true,
      user: {
        id: decoded.sub,
        type: decoded.user_type,
        email: decoded.email,
        exp: decoded.exp,
        iat: decoded.iat
      }
    });
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      status_code: 401,
      valid: false,
      error: error.message
    });
  }
});

// ========================
// SOCIAL AUTH ROUTES (Future)
// ========================

// Placeholder for future social authentication
router.post('/social/google', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Google authentication not yet implemented',
    status_code: 501
  });
});

router.post('/social/facebook', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Facebook authentication not yet implemented',
    status_code: 501
  });
});

// ========================
// PASSWORD RESET ROUTES (Future)
// ========================

// Placeholder for password reset functionality
router.post('/forgot-password', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Password reset functionality not yet implemented',
    status_code: 501
  });
});

router.post('/reset-password', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Password reset functionality not yet implemented',
    status_code: 501
  });
});

// ========================
// ERROR HANDLING
// ========================

// Handle 404 for auth routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Authentication endpoint not found',
    status_code: 404
  });
});

module.exports = router; 