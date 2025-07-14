/**
 * Response Utilities
 * Standardized response formatting for API endpoints
 */

const { 
  ERROR_CODES, HTTP_STATUS_CODES, API_VERSION, 
  RESPONSE_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES
} = require('./constants');

// Default Response Templates
const DEFAULT_RESPONSES = {
    SUCCESS_200: {
        response_code: 'success_200',
        message: 'Request successful',
        success: true
    },
    SUCCESS_201: {
        response_code: 'success_201',
        message: 'Resource created successfully',
        success: true
    },
    SUCCESS_204: {
        response_code: 'success_204',
        message: 'Resource updated successfully',
        success: true
    },
    ERROR_400: {
        response_code: 'error_400',
        message: 'Bad request - Invalid or missing parameters',
        success: false
    },
    ERROR_401: {
        response_code: 'error_401',
        message: 'Unauthorized - Authentication required',
        success: false
    },
    ERROR_403: {
        response_code: 'error_403',
        message: 'Forbidden - Access denied',
        success: false
    },
    ERROR_404: {
        response_code: 'error_404',
        message: 'Resource not found',
        success: false
    },
    ERROR_409: {
        response_code: 'error_409',
        message: 'Conflict - Resource already exists',
        success: false
    },
    ERROR_422: {
        response_code: 'error_422',
        message: 'Validation failed',
        success: false
    },
    ERROR_429: {
        response_code: 'error_429',
        message: 'Too many requests - Rate limit exceeded',
        success: false
    },
    ERROR_500: {
        response_code: 'error_500',
        message: 'Internal server error',
        success: false
    },
    ERROR_503: {
        response_code: 'error_503',
        message: 'Service unavailable',
        success: false
    }
};

// Gateway Default Responses (matching Laravel structure)
const GATEWAY_RESPONSES = {
    DEFAULT_200: {
        response_code: 'gateways_default_200',
        message: 'successfully loaded'
    },
    DEFAULT_204: {
        response_code: 'gateways_default_204',
        message: 'information not found'
    },
    DEFAULT_400: {
        response_code: 'gateways_default_400',
        message: 'invalid or missing information'
    },
    DEFAULT_404: {
        response_code: 'gateways_default_404',
        message: 'resource not found'
    },
    DEFAULT_UPDATE_200: {
        response_code: 'gateways_default_update_200',
        message: 'successfully updated'
    }
};

/**
 * Create a success response
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @param {number} statusCode - HTTP status code
 * @param {object} meta - Additional metadata
 * @returns {object} Formatted success response
 */
const successResponse = (data = null, message = 'Success', statusCode = 200, meta = {}) => {
    const response = {
        success: true,
        status_code: statusCode,
        message,
        timestamp: new Date().toISOString(),
        ...meta
    };

    if (data !== null) {
        response.data = data;
    }

    return response;
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Custom error code
 * @param {object} errors - Validation errors or additional error details
 * @param {object} meta - Additional metadata
 * @returns {object} Formatted error response
 */
const errorResponse = (message = 'An error occurred', statusCode = 500, errorCode = null, errors = null, meta = {}) => {
    const response = {
        success: false,
        status_code: statusCode,
        message,
        error_code: errorCode || ERROR_CODES.UNKNOWN_ERROR,
        timestamp: new Date().toISOString(),
        ...meta
    };

    if (errors) {
        response.errors = errors;
    }

    return response;
};

/**
 * Create a validation error response
 * @param {object} errors - Validation errors
 * @param {string} message - Error message
 * @returns {object} Formatted validation error response
 */
const validationErrorResponse = (errors, message = 'Validation failed') => {
    return errorResponse(message, 422, ERROR_CODES.VALIDATION_ERROR, errors);
};

/**
 * Create a paginated response
 * @param {Array} data - Array of items
 * @param {number} totalCount - Total number of items
 * @param {number} currentPage - Current page number
 * @param {number} limit - Items per page
 * @param {string} message - Response message
 * @returns {object} Formatted paginated response
 */
const paginatedResponse = (data, totalCount, currentPage, limit, message = 'Data retrieved successfully') => {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return successResponse(data, message, 200, {
        pagination: {
            total_count: totalCount,
            current_page: currentPage,
            total_pages: totalPages,
            limit,
            has_next_page: hasNextPage,
            has_previous_page: hasPreviousPage,
            next_page: hasNextPage ? currentPage + 1 : null,
            previous_page: hasPreviousPage ? currentPage - 1 : null
        }
    });
};

/**
 * Create a response with count information
 * @param {Array} data - Array of items
 * @param {string} message - Response message
 * @returns {object} Formatted response with count
 */
const responseWithCount = (data, message = 'Data retrieved successfully') => {
    return successResponse(data, message, 200, {
        count: Array.isArray(data) ? data.length : 0
    });
};

/**
 * Format validation errors from express-validator
 * @param {object} validationResult - Validation result from express-validator
 * @returns {object} Formatted validation errors
 */
const formatValidationErrors = (validationResult) => {
    if (!validationResult.errors || !Array.isArray(validationResult.errors)) {
        return null;
    }

    const errors = {};
    validationResult.errors.forEach(error => {
        const field = error.path || error.param || 'unknown';
        if (!errors[field]) {
            errors[field] = [];
        }
        errors[field].push(error.msg);
    });

    return errors;
};

/**
 * Create a response for resource creation
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {object} Formatted creation response
 */
const createdResponse = (data, message = 'Resource created successfully') => {
    return successResponse(data, message, 201);
};

/**
 * Create a response for resource update
 * @param {*} data - Updated resource data
 * @param {string} message - Success message
 * @returns {object} Formatted update response
 */
const updatedResponse = (data, message = 'Resource updated successfully') => {
    return successResponse(data, message, 200);
};

/**
 * Create a response for resource deletion
 * @param {string} message - Success message
 * @returns {object} Formatted deletion response
 */
const deletedResponse = (message = 'Resource deleted successfully') => {
    return successResponse(null, message, 200);
};

/**
 * Create a not found response
 * @param {string} message - Not found message
 * @returns {object} Formatted not found response
 */
const notFoundResponse = (message = 'Resource not found') => {
    return errorResponse(message, 404, ERROR_CODES.NOT_FOUND);
};

/**
 * Create an unauthorized response
 * @param {string} message - Unauthorized message
 * @returns {object} Formatted unauthorized response
 */
const unauthorizedResponse = (message = 'Unauthorized access') => {
    return errorResponse(message, 401, ERROR_CODES.AUTHENTICATION_ERROR);
};

/**
 * Create a forbidden response
 * @param {string} message - Forbidden message
 * @returns {object} Formatted forbidden response
 */
const forbiddenResponse = (message = 'Access forbidden') => {
    return errorResponse(message, 403, ERROR_CODES.AUTHORIZATION_ERROR);
};

/**
 * Create a bad request response
 * @param {string} message - Bad request message
 * @param {object} errors - Additional error details
 * @returns {object} Formatted bad request response
 */
const badRequestResponse = (message = 'Bad request', errors = null) => {
    return errorResponse(message, 400, ERROR_CODES.VALIDATION_ERROR, errors);
};

/**
 * Create a conflict response
 * @param {string} message - Conflict message
 * @returns {object} Formatted conflict response
 */
const conflictResponse = (message = 'Resource already exists') => {
    return errorResponse(message, 409, ERROR_CODES.DUPLICATE_ENTRY);
};

/**
 * Create a rate limit exceeded response
 * @param {string} message - Rate limit message
 * @returns {object} Formatted rate limit response
 */
const rateLimitResponse = (message = 'Rate limit exceeded') => {
    return errorResponse(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
};

/**
 * Create a maintenance mode response
 * @param {string} message - Maintenance message
 * @returns {object} Formatted maintenance response
 */
const maintenanceResponse = (message = 'System is under maintenance') => {
    return errorResponse(message, 503, ERROR_CODES.MAINTENANCE_MODE);
};

/**
 * Create a server error response
 * @param {string} message - Server error message
 * @param {object} error - Error details (for logging)
 * @returns {object} Formatted server error response
 */
const serverErrorResponse = (message = 'Internal server error', error = null) => {
    // Log the actual error for debugging
    if (error) {
        console.error('Server Error:', error);
    }

    return errorResponse(message, 500, ERROR_CODES.DATABASE_ERROR);
};

/**
 * Create a payment failed response
 * @param {string} message - Payment error message
 * @param {object} paymentDetails - Payment error details
 * @returns {object} Formatted payment error response
 */
const paymentFailedResponse = (message = 'Payment failed', paymentDetails = null) => {
    return errorResponse(message, 400, ERROR_CODES.PAYMENT_FAILED, paymentDetails);
};

/**
 * Create an insufficient balance response
 * @param {string} message - Insufficient balance message
 * @returns {object} Formatted insufficient balance response
 */
const insufficientBalanceResponse = (message = 'Insufficient balance') => {
    return errorResponse(message, 400, ERROR_CODES.INSUFFICIENT_BALANCE);
};

/**
 * Create an order not found response
 * @param {string} message - Order not found message
 * @returns {object} Formatted order not found response
 */
const orderNotFoundResponse = (message = 'Order not found') => {
    return errorResponse(message, 404, ERROR_CODES.ORDER_NOT_FOUND);
};

/**
 * Create a product out of stock response
 * @param {string} message - Out of stock message
 * @param {object} productDetails - Product details
 * @returns {object} Formatted out of stock response
 */
const outOfStockResponse = (message = 'Product out of stock', productDetails = null) => {
    return errorResponse(message, 400, ERROR_CODES.PRODUCT_OUT_OF_STOCK, productDetails);
};

/**
 * Create a delivery unavailable response
 * @param {string} message - Delivery unavailable message
 * @returns {object} Formatted delivery unavailable response
 */
const deliveryUnavailableResponse = (message = 'Delivery unavailable for this location') => {
    return errorResponse(message, 400, ERROR_CODES.DELIVERY_UNAVAILABLE);
};

/**
 * Create a branch closed response
 * @param {string} message - Branch closed message
 * @param {object} branchDetails - Branch details
 * @returns {object} Formatted branch closed response
 */
const branchClosedResponse = (message = 'Branch is currently closed', branchDetails = null) => {
    return errorResponse(message, 400, ERROR_CODES.BRANCH_CLOSED, branchDetails);
};

/**
 * Create a file upload error response
 * @param {string} message - File upload error message
 * @param {object} fileDetails - File error details
 * @returns {object} Formatted file upload error response
 */
const fileUploadErrorResponse = (message = 'File upload failed', fileDetails = null) => {
    return errorResponse(message, 400, ERROR_CODES.FILE_UPLOAD_ERROR, fileDetails);
};

/**
 * Send a standardized JSON response
 * @param {object} res - Express response object
 * @param {object} responseData - Response data
 * @param {number} statusCode - HTTP status code
 */
const sendResponse = (res, responseData, statusCode = null) => {
    const status = statusCode || responseData.status_code || 200;
    return res.status(status).json(responseData);
};

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @param {object} meta - Additional metadata
 */
const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200, meta = {}) => {
    const response = successResponse(data, message, statusCode, meta);
    return sendResponse(res, response, statusCode);
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Custom error code
 * @param {object} errors - Validation errors or additional error details
 * @param {object} meta - Additional metadata
 */
const sendErrorResponse = (res, message = 'An error occurred', statusCode = 500, errorCode = null, errors = null, meta = {}) => {
    const response = errorResponse(message, statusCode, errorCode, errors, meta);
    return sendResponse(res, response, statusCode);
};

/**
 * Send a paginated response
 * @param {object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} totalCount - Total number of items
 * @param {number} currentPage - Current page number
 * @param {number} limit - Items per page
 * @param {string} message - Response message
 */
const sendPaginatedResponse = (res, data, totalCount, currentPage, limit, message = 'Data retrieved successfully') => {
    const response = paginatedResponse(data, totalCount, currentPage, limit, message);
    return sendResponse(res, response);
};

module.exports = {
    DEFAULT_RESPONSES,
    GATEWAY_RESPONSES,
    successResponse,
    errorResponse,
    validationErrorResponse,
    paginatedResponse,
    responseWithCount,
    formatValidationErrors,
    createdResponse,
    updatedResponse,
    deletedResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    badRequestResponse,
    conflictResponse,
    rateLimitResponse,
    maintenanceResponse,
    serverErrorResponse,
    paymentFailedResponse,
    insufficientBalanceResponse,
    orderNotFoundResponse,
    outOfStockResponse,
    deliveryUnavailableResponse,
    branchClosedResponse,
    fileUploadErrorResponse,
    sendResponse,
    sendSuccessResponse,
    sendErrorResponse,
    sendPaginatedResponse
}; 