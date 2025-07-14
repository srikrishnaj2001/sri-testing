const { User } = require('../models');
const { generateErrorResponse } = require('../utils/responses');
const { translateWithRequest } = require('../utils/translation');

/**
 * Middleware to check if user has admin privileges
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.unauthorized'));
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return generateErrorResponse(res, 401, translateWithRequest(req, 'messages.user_not_found'));
    }

    // Check if user is admin
    if (user.user_type !== 'admin') {
      return generateErrorResponse(res, 403, translateWithRequest(req, 'messages.admin_access_required'));
    }

    // Check if user is active
    if (!user.is_active) {
      return generateErrorResponse(res, 403, translateWithRequest(req, 'messages.account_disabled'));
    }

    // Add user to request for further use
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

module.exports = { adminMiddleware }; 