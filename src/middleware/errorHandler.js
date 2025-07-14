const { translateWithRequest } = require('../config/i18n');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
const notFound = (req, res, next) => {
  const message = translateWithRequest(req, 'messages.route_not_found', { 
    path: req.originalUrl 
  });
  
  const error = new AppError(message, 404);
  next(error);
};

// Main error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id || 'anonymous'
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = translateWithRequest(req, 'messages.validation_error');
    const details = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    error = new AppError(message, 400);
    error.details = details;
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = translateWithRequest(req, 'messages.duplicate_entry');
    const field = err.errors[0]?.path || 'field';
    
    error = new AppError(message, 400);
    error.field = field;
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = translateWithRequest(req, 'messages.foreign_key_constraint');
    error = new AppError(message, 400);
  }

  // Sequelize database connection error
  if (err.name === 'SequelizeConnectionError') {
    const message = translateWithRequest(req, 'messages.database_connection_error');
    error = new AppError(message, 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = translateWithRequest(req, 'messages.invalid_token');
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = translateWithRequest(req, 'messages.token_expired');
    error = new AppError(message, 401);
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = translateWithRequest(req, 'messages.file_too_large');
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = translateWithRequest(req, 'messages.too_many_files');
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = translateWithRequest(req, 'messages.unexpected_file');
    error = new AppError(message, 400);
  }

  // Razorpay errors
  if (err.error && err.error.code && err.error.code.startsWith('BAD_REQUEST')) {
    const message = translateWithRequest(req, 'messages.payment_error');
    error = new AppError(message, 400);
  }

  // MongoDB/Mongoose errors (if ever used)
  if (err.name === 'CastError') {
    const message = translateWithRequest(req, 'messages.invalid_id');
    error = new AppError(message, 400);
  }

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    const message = translateWithRequest(req, 'messages.firebase_error');
    error = new AppError(message, 401);
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = translateWithRequest(req, 'messages.too_many_requests');
    error = new AppError(message, 429);
  }

  // Validation errors from Joi
  if (err.isJoi) {
    const message = translateWithRequest(req, 'messages.validation_error');
    const details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    error = new AppError(message, 400);
    error.details = details;
  }

  // Handle specific HTTP status codes
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    error.message = translateWithRequest(req, 'messages.internal_error');
  }

  // Send error response
  const response = {
    success: false,
    message: error.message,
    status: error.status || 'error'
  };

  // Add additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = error;
    response.stack = err.stack;
  }

  // Add validation details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add field information for unique constraint errors
  if (error.field) {
    response.field = error.field;
  }

  res.status(error.statusCode).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error formatter
const formatValidationErrors = (errors, req) => {
  return errors.map(error => ({
    field: error.path || error.param,
    message: translateWithRequest(req, `validation.${error.type}`, { 
      field: error.path || error.param,
      value: error.value
    }),
    value: error.value
  }));
};

// Success response helper
const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Error response helper
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Pagination response helper
const paginationResponse = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      current_page: pagination.page || 1,
      per_page: pagination.limit || 10,
      total: pagination.total || 0,
      total_pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      has_next_page: pagination.page < Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      has_prev_page: pagination.page > 1
    }
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  formatValidationErrors,
  successResponse,
  errorResponse,
  paginationResponse
}; 