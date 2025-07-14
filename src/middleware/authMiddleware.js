const db = require('../models');
const { generateErrorResponse } = require('../utils/responseHelper');
const { USER_TYPES } = require('../config/clerk');

const { Branch } = db;

/**
 * Middleware to check and add branch information to request
 * Similar to Laravel's BranchAdder middleware
 */
const branchAdder = async (req, res, next) => {
  try {
    const branchId = req.headers['branch-id'] || req.body.branch_id || req.query.branch_id;
    
    if (!branchId) {
      return generateErrorResponse(res, 400, 'Branch ID is required');
    }

    // Find branch
    const branch = await Branch.findOne({
      where: { 
        id: branchId,
        status: 1 // Active branches only
      }
    });

    if (!branch) {
      return generateErrorResponse(res, 401, 'Branch not found or inactive', [{
        code: 'auth-001',
        message: 'Branch not match.'
      }]);
    }

    // Add branch to request
    req.branch = branch;
    req.branchId = branchId;
    
    next();
  } catch (error) {
    console.error('Branch adder error:', error);
    return generateErrorResponse(res, 500, 'Branch validation failed');
  }
};

/**
 * Middleware to check if branch is active
 * Similar to Laravel's BranchStatusCheck middleware
 */
const branchStatusCheck = async (req, res, next) => {
  try {
    const branchId = req.branchId || req.headers['branch-id'];
    
    if (!branchId) {
      return generateErrorResponse(res, 400, 'Branch ID is required');
    }

    const branch = await Branch.findOne({
      where: { id: branchId }
    });

    if (!branch) {
      return generateErrorResponse(res, 404, 'Branch not found');
    }

    if (branch.status !== 1) {
      return generateErrorResponse(res, 403, 'Branch is currently inactive');
    }

    req.branch = branch;
    next();
  } catch (error) {
    console.error('Branch status check error:', error);
    return generateErrorResponse(res, 500, 'Branch status check failed');
  }
};

/**
 * Middleware to check if user is active
 * Similar to Laravel's ApiActiveCustomer middleware
 */
const checkActiveCustomer = async (req, res, next) => {
  try {
    if (!req.user) {
      return generateErrorResponse(res, 401, 'Authentication required');
    }

    const user = await db.User.findByPk(req.user.id);
    
    if (!user) {
      return generateErrorResponse(res, 404, 'User not found');
    }

    if (!user.is_active) {
      return generateErrorResponse(res, 403, 'Your account has been deactivated');
    }

    // Check if user is temporarily blocked
    if (user.is_temp_blocked && user.temp_block_time && new Date() < user.temp_block_time) {
      return generateErrorResponse(res, 423, 'Account temporarily blocked');
    }

    next();
  } catch (error) {
    console.error('Active customer check error:', error);
    return generateErrorResponse(res, 500, 'User status check failed');
  }
};

/**
 * Middleware to check if delivery man is active
 * Similar to Laravel's ApiActiveDeliveryMan middleware
 */
const checkActiveDeliveryMan = async (req, res, next) => {
  try {
    if (!req.user) {
      return generateErrorResponse(res, 401, 'Authentication required');
    }

    if (req.user.type !== USER_TYPES.DELIVERY_MAN) {
      return generateErrorResponse(res, 403, 'Access denied: Delivery man only');
    }

    const user = await db.User.findByPk(req.user.id);
    
    if (!user) {
      return generateErrorResponse(res, 404, 'Delivery man not found');
    }

    if (!user.is_active) {
      return generateErrorResponse(res, 403, 'Your delivery man account has been deactivated');
    }

    // Additional delivery man specific checks could be added here
    // e.g., check if delivery man is currently available for orders

    next();
  } catch (error) {
    console.error('Active delivery man check error:', error);
    return generateErrorResponse(res, 500, 'Delivery man status check failed');
  }
};

/**
 * Middleware to check maintenance mode
 * Similar to Laravel's MaintenanceModeMiddleware
 */
const maintenanceModeCheck = async (req, res, next) => {
  try {
    // Check if maintenance mode is enabled
    // This would typically be stored in a configuration table or environment variable
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    if (maintenanceMode) {
      // Allow admin and super admin to access during maintenance
      if (req.user && [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN].includes(req.user.type)) {
        return next();
      }
      
      return generateErrorResponse(res, 503, 'Application is under maintenance', {
        maintenance_mode: true,
        message: 'We are currently performing maintenance. Please try again later.'
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance mode check error:', error);
    return generateErrorResponse(res, 500, 'Maintenance mode check failed');
  }
};

/**
 * Middleware to check app activation status
 * Similar to Laravel's AppActivation middleware
 */
const appActivationCheck = async (req, res, next) => {
  try {
    // Check if app is activated (license verification)
    // This would typically involve license key validation
    const appActivated = process.env.APP_ACTIVATED !== 'false';
    
    if (!appActivated) {
      return generateErrorResponse(res, 403, 'Application not activated', {
        activation_required: true,
        message: 'Please activate the application to continue.'
      });
    }

    next();
  } catch (error) {
    console.error('App activation check error:', error);
    return generateErrorResponse(res, 500, 'App activation check failed');
  }
};

/**
 * Middleware to check if installation is complete
 * Similar to Laravel's InstallationMiddleware
 */
const installationCheck = async (req, res, next) => {
  try {
    // Check if installation is complete
    const installationComplete = process.env.INSTALLATION_COMPLETE === 'true';
    
    if (!installationComplete) {
      return generateErrorResponse(res, 503, 'Installation not complete', {
        installation_required: true,
        message: 'Please complete the installation process.'
      });
    }

    next();
  } catch (error) {
    console.error('Installation check error:', error);
    return generateErrorResponse(res, 500, 'Installation check failed');
  }
};

/**
 * Middleware to check module permissions
 * Similar to Laravel's ModulePermissionMiddleware
 */
const modulePermissionCheck = (module) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return generateErrorResponse(res, 401, 'Authentication required');
      }

      // Check if user has permission to access this module
      // This would typically be based on user roles and module configurations
      const userType = req.user.type;
      
      // Define module permissions
      const modulePermissions = {
        pos: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN, USER_TYPES.KITCHEN],
        delivery: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN, USER_TYPES.DELIVERY_MAN],
        reports: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN],
        settings: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN],
        users: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN],
        products: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN, USER_TYPES.KITCHEN]
      };

      const allowedUserTypes = modulePermissions[module] || [];
      
      if (!allowedUserTypes.includes(userType)) {
        return generateErrorResponse(res, 403, `Access denied: ${module} module not available for your user type`);
      }

      next();
    } catch (error) {
      console.error('Module permission check error:', error);
      return generateErrorResponse(res, 500, 'Module permission check failed');
    }
  };
};

/**
 * Middleware to validate API version
 */
const apiVersionCheck = (req, res, next) => {
  const apiVersion = req.headers['api-version'] || req.query.api_version;
  const supportedVersions = ['v1', '1.0', '1.1'];
  
  if (apiVersion && !supportedVersions.includes(apiVersion)) {
    return generateErrorResponse(res, 400, 'Unsupported API version');
  }
  
  req.apiVersion = apiVersion || 'v1';
  next();
};

/**
 * Middleware to log API requests
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Middleware to check device type
 */
const deviceTypeCheck = (req, res, next) => {
  const deviceType = req.headers['device-type'] || req.query.device_type;
  const userAgent = req.headers['user-agent'] || '';
  
  // Detect device type from user agent if not provided
  let detectedDeviceType = 'web';
  if (userAgent.includes('Mobile')) {
    detectedDeviceType = 'mobile';
  } else if (userAgent.includes('Tablet')) {
    detectedDeviceType = 'tablet';
  }
  
  req.deviceType = deviceType || detectedDeviceType;
  next();
};

module.exports = {
  branchAdder,
  branchStatusCheck,
  checkActiveCustomer,
  checkActiveDeliveryMan,
  maintenanceModeCheck,
  appActivationCheck,
  installationCheck,
  modulePermissionCheck,
  apiVersionCheck,
  requestLogger,
  deviceTypeCheck
}; 