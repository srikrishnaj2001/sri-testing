/**
 * Generate successful API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @returns {Object} Express response
 */
const generateResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message,
    status_code: statusCode
  };

  if (data !== null && data !== undefined) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      // Spread object data into response
      Object.assign(response, data);
    } else {
      // For arrays or primitive types, use 'data' key
      response.data = data;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Generate error API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {*} errors - Error details (optional)
 * @returns {Object} Express response
 */
const generateErrorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message,
    status_code: statusCode
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Generate paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
const generatePaginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  const response = {
    success: true,
    message,
    status_code: 200,
    data,
    pagination: {
      current_page: pagination.page || 1,
      per_page: pagination.limit || 10,
      total: pagination.total || 0,
      total_pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      has_next: pagination.hasNext || false,
      has_prev: pagination.hasPrev || false
    }
  };

  return res.status(200).json(response);
};

/**
 * Generate response for resource creation
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
const generateCreatedResponse = (res, data, message = 'Resource created successfully') => {
  return generateResponse(res, 201, message, data);
};

/**
 * Generate response for successful operation without data
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @returns {Object} Express response
 */
const generateSuccessResponse = (res, message = 'Operation completed successfully') => {
  return generateResponse(res, 200, message);
};

/**
 * Generate not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @returns {Object} Express response
 */
const generateNotFoundResponse = (res, message = 'Resource not found') => {
  return generateErrorResponse(res, 404, message);
};

/**
 * Generate unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @returns {Object} Express response
 */
const generateUnauthorizedResponse = (res, message = 'Unauthorized access') => {
  return generateErrorResponse(res, 401, message);
};

/**
 * Generate forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @returns {Object} Express response
 */
const generateForbiddenResponse = (res, message = 'Access forbidden') => {
  return generateErrorResponse(res, 403, message);
};

/**
 * Generate validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Validation errors
 * @param {string} message - Error message
 * @returns {Object} Express response
 */
const generateValidationErrorResponse = (res, errors, message = 'Validation failed') => {
  return generateErrorResponse(res, 400, message, errors);
};

/**
 * Generate conflict response
 * @param {Object} res - Express response object
 * @param {string} message - Conflict message
 * @returns {Object} Express response
 */
const generateConflictResponse = (res, message = 'Resource already exists') => {
  return generateErrorResponse(res, 409, message);
};

/**
 * Generate too many requests response
 * @param {Object} res - Express response object
 * @param {string} message - Rate limit message
 * @returns {Object} Express response
 */
const generateRateLimitResponse = (res, message = 'Too many requests, please try again later') => {
  return generateErrorResponse(res, 429, message);
};

/**
 * Generate service unavailable response
 * @param {Object} res - Express response object
 * @param {string} message - Service unavailable message
 * @returns {Object} Express response
 */
const generateServiceUnavailableResponse = (res, message = 'Service temporarily unavailable') => {
  return generateErrorResponse(res, 503, message);
};

module.exports = {
  generateResponse,
  generateErrorResponse,
  generatePaginatedResponse,
  generateCreatedResponse,
  generateSuccessResponse,
  generateNotFoundResponse,
  generateUnauthorizedResponse,
  generateForbiddenResponse,
  generateValidationErrorResponse,
  generateConflictResponse,
  generateRateLimitResponse,
  generateServiceUnavailableResponse
}; 