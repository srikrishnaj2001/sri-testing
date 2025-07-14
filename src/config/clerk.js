const jwt = require('jsonwebtoken');

// Clerk configuration
const clerkConfig = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  jwtKey: process.env.CLERK_JWT_KEY || 'default-jwt-secret-for-development'
};

// Simple middleware placeholder (Clerk integration will be implemented later)
const clerkMiddleware = (req, res, next) => {
  next();
};

// User types enum (matching Laravel system)
const USER_TYPES = {
  CUSTOMER: 'customer',
  DELIVERY_MAN: 'delivery_man',
  ADMIN: 'admin',
  KITCHEN: 'kitchen',
  SUPER_ADMIN: 'super_admin'
};

// Custom Clerk authentication middleware for different user types
const requireAuth = (userTypes = []) => {
  return async (req, res, next) => {
    try {
      // Get the session token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required'
        });
      }

      const token = authHeader.split(' ')[1];

      // Verify the JWT token
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, clerkConfig.jwtKey);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Extract user information from token
      const userId = decodedToken.sub;
      const userType = decodedToken.user_type;
      const email = decodedToken.email;

      // Check if user type is allowed
      if (userTypes.length > 0 && !userTypes.includes(userType)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // Add user information to request object
      req.user = {
        id: userId,
        type: userType,
        email,
        clerkId: userId
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  };
};

// Middleware for specific user types
const requireCustomer = () => requireAuth([USER_TYPES.CUSTOMER]);
const requireDeliveryMan = () => requireAuth([USER_TYPES.DELIVERY_MAN]);
const requireAdmin = () => requireAuth([USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN]);
const requireKitchen = () => requireAuth([USER_TYPES.KITCHEN]);

// Optional auth middleware (user can be authenticated or not)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decodedToken = jwt.verify(token, clerkConfig.jwtKey);
        req.user = {
          id: decodedToken.sub,
          type: decodedToken.user_type,
          email: decodedToken.email,
          clerkId: decodedToken.sub
        };
      } catch (error) {
        // Token is invalid, but continue without user
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Generate JWT token for user
const generateUserToken = (user, userType) => {
  const payload = {
    sub: user.id,
    user_type: userType,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  return jwt.sign(payload, clerkConfig.jwtKey);
};

// Verify webhook signature from Clerk
const verifyWebhookSignature = (_payload, _signature) => {
  // Implementation for webhook signature verification
  // This would be used for user creation/update webhooks from Clerk
  return true; // Simplified for now
};

// Role-based permission checker
const hasPermission = (userType, requiredPermissions) => {
  const permissions = {
    [USER_TYPES.SUPER_ADMIN]: ['*'], // All permissions
    [USER_TYPES.ADMIN]: [
      'manage_users',
      'manage_orders',
      'manage_products',
      'manage_delivery',
      'view_reports',
      'manage_settings'
    ],
    [USER_TYPES.KITCHEN]: [
      'view_orders',
      'update_order_status',
      'view_products'
    ],
    [USER_TYPES.DELIVERY_MAN]: [
      'view_assigned_orders',
      'update_delivery_status',
      'view_delivery_history'
    ],
    [USER_TYPES.CUSTOMER]: [
      'place_order',
      'view_own_orders',
      'manage_profile',
      'manage_addresses'
    ]
  };

  const userPermissions = permissions[userType] || [];
  
  if (userPermissions.includes('*')) {
    return true;
  }

  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
};

// Middleware to check specific permissions
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user.type, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  clerkConfig,
  clerkMiddleware,
  USER_TYPES,
  requireAuth,
  requireCustomer,
  requireDeliveryMan,
  requireAdmin,
  requireKitchen,
  optionalAuth,
  generateUserToken,
  verifyWebhookSignature,
  hasPermission,
  requirePermission
}; 