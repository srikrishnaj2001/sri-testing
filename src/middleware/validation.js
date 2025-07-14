/**
 * Validation middleware for request validation
 * Uses express-validator for validation logic
 */

const { body, param, query, validationResult } = require('express-validator');
const { formatValidationErrorResponse } = require('../utils/responseFormatter');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
    }, {});
    
    return res.status(422).json(formatValidationErrorResponse(formattedErrors));
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // User validation
  userRegistration: [
    body('f_name').notEmpty().withMessage('First name is required'),
    body('l_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],

  userLogin: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Order validation
  orderCreation: [
    body('order_amount').isFloat({ min: 0 }).withMessage('Order amount must be a positive number'),
    body('delivery_address_id').isInt({ min: 1 }).withMessage('Valid delivery address is required'),
    body('payment_method').isIn(['cash', 'card', 'digital_payment']).withMessage('Valid payment method is required'),
    body('order_note').optional().isString().withMessage('Order note must be a string')
  ],

  // Product validation
  productCreation: [
    body('name').notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category_id').isInt({ min: 1 }).withMessage('Valid category is required'),
    body('description').optional().isString().withMessage('Description must be a string')
  ],

  // Address validation
  addressCreation: [
    body('contact_person_name').notEmpty().withMessage('Contact person name is required'),
    body('contact_person_number').isMobilePhone().withMessage('Valid phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
  ],

  // Table booking validation
  tableBooking: [
    body('table_id').isInt({ min: 1 }).withMessage('Valid table ID is required'),
    body('branch_id').isInt({ min: 1 }).withMessage('Valid branch ID is required'),
    body('total_people').isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],

  // Review validation
  reviewCreation: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().withMessage('Comment must be a string')
  ],

  // Coupon validation
  couponCreation: [
    body('title').notEmpty().withMessage('Coupon title is required'),
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('discount_type').isIn(['amount', 'percentage']).withMessage('Valid discount type is required'),
    body('discount').isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
    body('min_purchase').isFloat({ min: 0 }).withMessage('Minimum purchase must be a positive number')
  ],

  // Branch validation
  branchCreation: [
    body('name').notEmpty().withMessage('Branch name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isMobilePhone().withMessage('Valid phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
  ],

  // Category validation
  categoryCreation: [
    body('name').notEmpty().withMessage('Category name is required'),
    body('position').isInt({ min: 0 }).withMessage('Position must be a non-negative integer')
  ],

  // Parameter validation
  validateId: [
    param('id').isInt({ min: 1 }).withMessage('Valid ID is required')
  ],

  // Query validation
  validatePagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  validateSearch: [
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category_id').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('sort_by').optional().isIn(['name', 'price', 'rating', 'created_at']).withMessage('Invalid sort field'),
    query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ]
};

/**
 * Create validation middleware
 */
const validate = (validationName) => {
  return [
    ...(validationRules[validationName] || []),
    handleValidationErrors
  ];
};

/**
 * Custom validation functions
 */
const customValidations = {
  // Check if user exists
  userExists: async (value, { _req }) => {
    const { User } = require('../models');
    const user = await User.findByPk(value);
    if (!user) {
      throw new Error('User not found');
    }
    return true;
  },

  // Check if email is unique
  uniqueEmail: async (value, { req }) => {
    const { User } = require('../models');
    const existingUser = await User.findOne({ where: { email: value } });
    if (existingUser && existingUser.id !== req.params.id) {
      throw new Error('Email already exists');
    }
    return true;
  },

  // Check if phone is unique
  uniquePhone: async (value, { req }) => {
    const { User } = require('../models');
    const existingUser = await User.findOne({ where: { phone: value } });
    if (existingUser && existingUser.id !== req.params.id) {
      throw new Error('Phone number already exists');
    }
    return true;
  }
};

// Alias for backward compatibility
const validateRequest = handleValidationErrors;

module.exports = {
  validate,
  validationRules,
  handleValidationErrors,
  validateRequest,
  customValidations
}; 