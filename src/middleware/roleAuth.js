/**
 * Role-based authentication middleware
 * Handles specific role permissions and access control
 */

const { formatUnauthorizedResponse, formatForbiddenResponse } = require('../utils/responseFormatter');

/**
 * Role definitions and permissions
 */
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  BRANCH_MANAGER: 'branch_manager',
  DELIVERY_MAN: 'delivery_man',
  CUSTOMER: 'customer',
  STAFF: 'staff'
};

/**
 * Permission definitions
 */
const PERMISSIONS = {
  // User management
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  
  // Order management
  CREATE_ORDER: 'create_order',
  READ_ORDER: 'read_order',
  UPDATE_ORDER: 'update_order',
  DELETE_ORDER: 'delete_order',
  ASSIGN_ORDER: 'assign_order',
  
  // Product management
  CREATE_PRODUCT: 'create_product',
  READ_PRODUCT: 'read_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  
  // Branch management
  CREATE_BRANCH: 'create_branch',
  READ_BRANCH: 'read_branch',
  UPDATE_BRANCH: 'update_branch',
  DELETE_BRANCH: 'delete_branch',
  
  // Reports and analytics
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  
  // Settings
  UPDATE_SETTINGS: 'update_settings',
  
  // Table booking
  CREATE_TABLE_BOOKING: 'create_table_booking',
  READ_TABLE_BOOKING: 'read_table_booking',
  UPDATE_TABLE_BOOKING: 'update_table_booking',
  DELETE_TABLE_BOOKING: 'delete_table_booking'
};

/**
 * Role-permission mapping
 */
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.UPDATE_ORDER,
    PERMISSIONS.DELETE_ORDER,
    PERMISSIONS.ASSIGN_ORDER,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.READ_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.READ_BRANCH,
    PERMISSIONS.UPDATE_BRANCH,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.UPDATE_SETTINGS,
    PERMISSIONS.CREATE_TABLE_BOOKING,
    PERMISSIONS.READ_TABLE_BOOKING,
    PERMISSIONS.UPDATE_TABLE_BOOKING,
    PERMISSIONS.DELETE_TABLE_BOOKING
  ],
  
  [ROLES.BRANCH_MANAGER]: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.UPDATE_ORDER,
    PERMISSIONS.ASSIGN_ORDER,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.READ_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.READ_BRANCH,
    PERMISSIONS.UPDATE_BRANCH,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.CREATE_TABLE_BOOKING,
    PERMISSIONS.READ_TABLE_BOOKING,
    PERMISSIONS.UPDATE_TABLE_BOOKING,
    PERMISSIONS.DELETE_TABLE_BOOKING
  ],
  
  [ROLES.DELIVERY_MAN]: [
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.UPDATE_ORDER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER
  ],
  
  [ROLES.CUSTOMER]: [
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.READ_PRODUCT,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.CREATE_TABLE_BOOKING,
    PERMISSIONS.READ_TABLE_BOOKING,
    PERMISSIONS.UPDATE_TABLE_BOOKING
  ],
  
  [ROLES.STAFF]: [
    PERMISSIONS.READ_ORDER,
    PERMISSIONS.UPDATE_ORDER,
    PERMISSIONS.READ_PRODUCT,
    PERMISSIONS.CREATE_TABLE_BOOKING,
    PERMISSIONS.READ_TABLE_BOOKING,
    PERMISSIONS.UPDATE_TABLE_BOOKING
  ]
};

/**
 * Get user role from user object
 */
const getUserRole = (user, userType) => {
  if (!user || !userType) return null;
  
  // Map user types to roles
  switch (userType) {
    case 'admin':
      return user.role || ROLES.ADMIN;
    case 'delivery_man':
      return ROLES.DELIVERY_MAN;
    case 'customer':
      return ROLES.CUSTOMER;
    default:
      return null;
  }
};

/**
 * Check if user has specific permission
 */
const hasPermission = (user, userType, permission) => {
  const role = getUserRole(user, userType);
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
const hasAnyPermission = (user, userType, permissions) => {
  return permissions.some(permission => hasPermission(user, userType, permission));
};

/**
 * Check if user has all of the specified permissions
 */
const hasAllPermissions = (user, userType, permissions) => {
  return permissions.every(permission => hasPermission(user, userType, permission));
};

/**
 * Middleware to require specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }
    
    if (!hasPermission(req.user, req.userType, permission)) {
      return res.status(403).json(formatForbiddenResponse(`Permission '${permission}' is required`));
    }
    
    next();
  };
};

/**
 * Middleware to require any of the specified permissions
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }
    
    if (!hasAnyPermission(req.user, req.userType, permissions)) {
      return res.status(403).json(formatForbiddenResponse(`One of these permissions is required: ${permissions.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Middleware to require all of the specified permissions
 */
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }
    
    if (!hasAllPermissions(req.user, req.userType, permissions)) {
      return res.status(403).json(formatForbiddenResponse(`All of these permissions are required: ${permissions.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Middleware to require specific role
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }
    
    const userRole = getUserRole(req.user, req.userType);
    if (userRole !== role) {
      return res.status(403).json(formatForbiddenResponse(`Role '${role}' is required`));
    }
    
    next();
  };
};

/**
 * Middleware to require any of the specified roles
 */
const requireAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }
    
    const userRole = getUserRole(req.user, req.userType);
    if (!roles.includes(userRole)) {
      return res.status(403).json(formatForbiddenResponse(`One of these roles is required: ${roles.join(', ')}`));
    }
    
    next();
  };
};

/**
 * Middleware for admin-only routes
 */
const requireAdminRole = requireAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

/**
 * Middleware for manager-level access
 */
const requireManagerRole = requireAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_MANAGER]);

/**
 * Middleware for staff-level access
 */
const requireStaffRole = requireAnyRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_MANAGER, ROLES.STAFF]);

/**
 * Get user permissions
 */
const getUserPermissions = (user, userType) => {
  const role = getUserRole(user, userType);
  if (!role) return [];
  
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can access branch resources
 */
const canAccessBranch = (user, userType, branchId) => {
  const userRole = getUserRole(user, userType);
  
  // Super admin and admin can access all branches
  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(userRole)) {
    return true;
  }
  
  // Branch manager and staff can only access their own branch
  if ([ROLES.BRANCH_MANAGER, ROLES.STAFF].includes(userRole)) {
    return user.branch_id && parseInt(user.branch_id) === parseInt(branchId);
  }
  
  return false;
};

/**
 * Middleware to check branch access
 */
const requireBranchAccess = (branchIdField = 'branch_id') => {
  return (req, res, next) => {
    if (!req.user || !req.userType) {
      return res.status(401).json(formatUnauthorizedResponse('Authentication required'));
    }
    
    const branchId = req.params[branchIdField] || req.body[branchIdField] || req.query[branchIdField];
    
    if (!branchId) {
      return res.status(400).json(formatForbiddenResponse('Branch ID is required'));
    }
    
    if (!canAccessBranch(req.user, req.userType, branchId)) {
      return res.status(403).json(formatForbiddenResponse('You do not have access to this branch'));
    }
    
    next();
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getUserRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  requireAdminRole,
  requireManagerRole,
  requireStaffRole,
  getUserPermissions,
  canAccessBranch,
  requireBranchAccess
}; 