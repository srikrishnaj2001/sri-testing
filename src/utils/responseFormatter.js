/**
 * Response formatter utility for consistent API responses
 */

/**
 * Format successful response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Formatted response
 */
const formatSuccessResponse = (data = null, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} errorCode - Error code
 * @param {any} errors - Detailed errors
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Formatted error response
 */
const formatErrorResponse = (message = 'An error occurred', errorCode = 'UNKNOWN_ERROR', errors = null, statusCode = 500) => {
  return {
    success: false,
    message,
    error_code: errorCode,
    errors,
    status_code: statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format paginated response
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination metadata
 * @param {string} message - Success message
 * @returns {Object} - Formatted paginated response
 */
const formatPaginatedResponse = (data = [], pagination = {}, message = 'Data retrieved successfully') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      current_page: pagination.page || 1,
      per_page: pagination.limit || 20,
      total: pagination.total || 0,
      total_pages: pagination.totalPages || 0,
      has_next: pagination.hasNext || false,
      has_prev: pagination.hasPrev || false,
      from: pagination.from || 0,
      to: pagination.to || 0
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Format validation error response
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message
 * @returns {Object} - Formatted validation error response
 */
const formatValidationErrorResponse = (errors = {}, message = 'Validation failed') => {
  return {
    success: false,
    message,
    error_code: 'VALIDATION_ERROR',
    errors,
    status_code: 422,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format not found response
 * @param {string} resource - Resource name
 * @param {string} message - Custom message
 * @returns {Object} - Formatted not found response
 */
const formatNotFoundResponse = (resource = 'Resource', message = null) => {
  return {
    success: false,
    message: message || `${resource} not found`,
    error_code: 'NOT_FOUND',
    status_code: 404,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format unauthorized response
 * @param {string} message - Error message
 * @returns {Object} - Formatted unauthorized response
 */
const formatUnauthorizedResponse = (message = 'Unauthorized access') => {
  return {
    success: false,
    message,
    error_code: 'UNAUTHORIZED',
    status_code: 401,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format forbidden response
 * @param {string} message - Error message
 * @returns {Object} - Formatted forbidden response
 */
const formatForbiddenResponse = (message = 'Access forbidden') => {
  return {
    success: false,
    message,
    error_code: 'FORBIDDEN',
    status_code: 403,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format generic response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Formatted response
 */
const formatResponse = (success = true, message = '', data = null, meta = {}) => {
  return {
    success,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
  formatPaginatedResponse,
  formatValidationErrorResponse,
  formatNotFoundResponse,
  formatUnauthorizedResponse,
  formatForbiddenResponse,
  formatResponse
}; 