/**
 * AsyncHandler utility for Express route handlers
 * Wraps async functions to handle errors and pass them to Express error handler
 */

/**
 * Wraps an async function to handle errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function that handles errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wraps an async function and provides custom error handling
 * @param {Function} fn - Async function to wrap
 * @param {Function} errorHandler - Custom error handler function
 * @returns {Function} - Wrapped function with custom error handling
 */
const asyncHandlerWithCustomError = (fn, errorHandler) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (errorHandler) {
        errorHandler(error, req, res, next);
      } else {
        next(error);
      }
    });
  };
};

/**
 * Wraps an async function and provides JSON error response
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with JSON error response
 */
const asyncHandlerWithJsonError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('AsyncHandler Error:', error);
      
      // Send JSON error response
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    });
  };
};

/**
 * Wraps an async function with timeout handling
 * @param {Function} fn - Async function to wrap
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {Function} - Wrapped function with timeout
 */
const asyncHandlerWithTimeout = (fn, timeout = 30000) => {
  return (req, res, next) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    Promise.race([
      Promise.resolve(fn(req, res, next)),
      timeoutPromise
    ]).catch(next);
  };
};

/**
 * Create async handler with validation
 * @param {Function} fn - Async function to wrap
 * @param {Object} validation - Validation schema
 * @returns {Function} - Wrapped function with validation
 */
const asyncHandlerWithValidation = (fn, validation) => {
  return (req, res, next) => {
    // Simple validation example (can be extended with joi, yup, etc.)
    if (validation && typeof validation === 'function') {
      const validationResult = validation(req);
      if (validationResult.error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.details || validationResult.error,
          timestamp: new Date().toISOString()
        });
      }
    }

    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  asyncHandler,
  asyncHandlerWithCustomError,
  asyncHandlerWithJsonError,
  asyncHandlerWithTimeout,
  asyncHandlerWithValidation
};

// Default export for backward compatibility
module.exports.default = asyncHandler; 