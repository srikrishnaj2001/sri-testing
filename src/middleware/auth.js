/**
 * Authentication middleware for protecting routes
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { User, DeliveryMan, Admin } = require('../models');
const { formatUnauthorizedResponse, formatForbiddenResponse } = require('../utils/responseFormatter');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json(formatUnauthorizedResponse('Access token is required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on token type
    let user = null;
    switch (decoded.type) {
      case 'customer':
        user = await User.findByPk(decoded.id);
        break;
      case 'delivery_man':
        user = await DeliveryMan.findByPk(decoded.id);
        break;
      case 'admin':
        user = await Admin.findByPk(decoded.id);
        break;
      default:
        return res.status(401).json(formatUnauthorizedResponse('Invalid token type'));
    }

    if (!user) {
      return res.status(401).json(formatUnauthorizedResponse('User not found'));
    }

    // Check if user is active
    if (user.is_active === false) {
      return res.status(401).json(formatUnauthorizedResponse('Account is inactive'));
    }

    // Attach user to request
    req.user = user;
    req.userType = decoded.type;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(formatUnauthorizedResponse('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json(formatUnauthorizedResponse('Token expired'));
    }
    
    return res.status(401).json(formatUnauthorizedResponse('Authentication failed'));
  }
};

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in query params (for some endpoints)
  return req.query.token || req.body.token || null;
};

/**
 * Middleware to require specific user types
 */
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }

    if (!allowedTypes.includes(req.userType)) {
      return res.status(403).json(formatForbiddenResponse('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Middleware for customer-only routes
 */
const requireCustomer = requireUserType(['customer']);

/**
 * Middleware for delivery man-only routes
 */
const requireDeliveryMan = requireUserType(['delivery_man']);

/**
 * Middleware for admin-only routes
 */
const requireAdmin = requireUserType(['admin']);

/**
 * Middleware for admin or delivery man routes
 */
const requireAdminOrDeliveryMan = requireUserType(['admin', 'delivery_man']);

/**
 * Middleware for any authenticated user
 */
const requireAuth = requireUserType(['customer', 'delivery_man', 'admin']);

/**
 * Optional authentication - authenticate if token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next(); // No token, continue without authentication
    }

    // Try to authenticate, but don't fail if it doesn't work
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = null;
    switch (decoded.type) {
      case 'customer':
        user = await User.findByPk(decoded.id);
        break;
      case 'delivery_man':
        user = await DeliveryMan.findByPk(decoded.id);
        break;
      case 'admin':
        user = await Admin.findByPk(decoded.id);
        break;
    }

    if (user && user.is_active !== false) {
      req.user = user;
      req.userType = decoded.type;
      req.token = token;
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Check if user owns the resource
 */
const requireOwnership = (userIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }

    // Admin can access any resource
    if (req.userType === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (resourceUserId && parseInt(resourceUserId) !== req.user.id) {
      return res.status(403).json(formatForbiddenResponse('You can only access your own resources'));
    }

    next();
  };
};

/**
 * Check if user is in same branch (for branch-specific resources)
 */
const requireSameBranch = (branchIdField = 'branch_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }

    // Admin can access any branch
    if (req.userType === 'admin') {
      return next();
    }

    // Check if user is in the same branch
    const resourceBranchId = req.params[branchIdField] || req.body[branchIdField];
    
    if (resourceBranchId && req.user.branch_id && parseInt(resourceBranchId) !== req.user.branch_id) {
      return res.status(403).json(formatForbiddenResponse('You can only access resources from your branch'));
    }

    next();
  };
};

/**
 * Rate limiting by user
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequestCounts = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    let userRequests = userRequestCounts.get(userId) || [];
    
    // Remove old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded the limit
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    userRequestCounts.set(userId, userRequests);

    next();
  };
};

module.exports = {
  authenticate,
  requireCustomer,
  requireDeliveryMan,
  requireAdmin,
  requireAdminOrDeliveryMan,
  requireAuth,
  optionalAuth,
  requireOwnership,
  requireSameBranch,
  rateLimitByUser,
  requireUserType,
  extractToken
}; 