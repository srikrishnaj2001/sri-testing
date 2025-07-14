const Joi = require('joi');

// User registration validation schema
const registrationSchema = Joi.object({
  f_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required'
    }),
  
  l_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required'
    }),
  
  phone: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
      'any.required': 'Phone number is required'
    }),
  
  email: Joi.string()
    .email()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 100 characters'
    }),
  
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required'
    }),
  
  refer_code: Joi.string()
    .optional()
    .allow('')
    .messages({
      'string.base': 'Referral code must be a string'
    }),
  
  language_code: Joi.string()
    .valid('en', 'ar', 'bn', 'es', 'fr')
    .default('en')
    .optional()
    .messages({
      'any.only': 'Language code must be one of: en, ar, bn, es, fr'
    })
});

// User login validation schema
const loginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits'
    }),
  
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email must be a valid email address'
    }),
  
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
}).or('phone', 'email').messages({
  'object.missing': 'Either phone or email must be provided'
});

// Profile update validation schema
const profileUpdateSchema = Joi.object({
  f_name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'First name cannot be empty',
      'string.max': 'First name must not exceed 100 characters'
    }),
  
  l_name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Last name cannot be empty',
      'string.max': 'Last name must not exceed 100 characters'
    }),
  
  email: Joi.string()
    .email()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 100 characters'
    }),
  
  language_code: Joi.string()
    .valid('en', 'ar', 'bn', 'es', 'fr')
    .optional()
    .messages({
      'any.only': 'Language code must be one of: en, ar, bn, es, fr'
    })
});

// Password change validation schema
const passwordChangeSchema = Joi.object({
  current_password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  
  new_password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password must not exceed 100 characters',
      'any.required': 'New password is required'
    })
});

// Phone verification validation schema
const phoneVerificationSchema = Joi.object({
  otp: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be exactly 6 digits',
      'any.required': 'OTP is required'
    })
});

// Delivery man registration validation schema
const deliveryManRegistrationSchema = Joi.object({
  f_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.max': 'First name must not exceed 100 characters',
      'any.required': 'First name is required'
    }),
  
  l_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.max': 'Last name must not exceed 100 characters',
      'any.required': 'Last name is required'
    }),
  
  phone: Joi.string()
    .pattern(/^[+]?[0-9]{10,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
      'any.required': 'Phone number is required'
    }),
  
  email: Joi.string()
    .email()
    .max(100)
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 100 characters',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required'
    }),
  
  identity_number: Joi.string()
    .min(5)
    .max(30)
    .required()
    .messages({
      'string.min': 'Identity number must be at least 5 characters',
      'string.max': 'Identity number must not exceed 30 characters',
      'any.required': 'Identity number is required'
    }),
  
  identity_type: Joi.string()
    .valid('passport', 'nid', 'driving_license')
    .required()
    .messages({
      'any.only': 'Identity type must be one of: passport, nid, driving_license',
      'any.required': 'Identity type is required'
    }),
  
  branch_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Branch ID must be a number',
      'number.positive': 'Branch ID must be positive',
      'any.required': 'Branch ID is required'
    })
});

// Validation functions
const validateRegistration = (data) => {
  return registrationSchema.validate(data, { abortEarly: false });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, { abortEarly: false });
};

const validateProfileUpdate = (data) => {
  return profileUpdateSchema.validate(data, { abortEarly: false });
};

const validatePasswordChange = (data) => {
  return passwordChangeSchema.validate(data, { abortEarly: false });
};

const validatePhoneVerification = (data) => {
  return phoneVerificationSchema.validate(data, { abortEarly: false });
};

const validateDeliveryManRegistration = (data) => {
  return deliveryManRegistrationSchema.validate(data, { abortEarly: false });
};

// Customer profile validation
const validateCustomerUpdate = (data) => {
  const schema = Joi.object({
    f_name: Joi.string().min(2).max(50).trim(),
    l_name: Joi.string().min(2).max(50).trim(),
    email: Joi.string().email().lowercase().trim(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    image: Joi.string().uri(),
    date_of_birth: Joi.date(),
    gender: Joi.string().valid('male', 'female', 'other'),
    preferences: Joi.object(),
    emergency_contact: Joi.object({
      name: Joi.string().min(2).max(100),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      relationship: Joi.string().max(50)
    })
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Address validation
const validateAddress = (data) => {
  const schema = Joi.object({
    type: Joi.string().valid('home', 'office', 'other').default('home'),
    contact_person_name: Joi.string().min(2).max(100).required(),
    contact_person_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    address_type: Joi.string().valid('home', 'office', 'apartment', 'villa', 'other').default('home'),
    address: Joi.string().min(10).max(500).required(),
    floor: Joi.string().max(20),
    road: Joi.string().max(100),
    house: Joi.string().max(100),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    is_default: Joi.boolean().default(false)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Wallet transaction validation
const validateWalletTransaction = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    type: Joi.string().valid('credit', 'debit').required(),
    payment_method: Joi.string().valid('razorpay', 'wallet', 'cash', 'bank_transfer', 'card').when('type', {
      is: 'credit',
      then: Joi.required()
    }),
    description: Joi.string().max(500),
    reference_id: Joi.string().max(100)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Delivery man profile validation
const validateDeliveryManUpdate = (data) => {
  const schema = Joi.object({
    f_name: Joi.string().min(2).max(50).trim(),
    l_name: Joi.string().min(2).max(50).trim(),
    email: Joi.string().email().lowercase().trim(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
    image: Joi.string().uri(),
    date_of_birth: Joi.date(),
    gender: Joi.string().valid('male', 'female', 'other'),
    identity_number: Joi.string().max(50),
    identity_type: Joi.string().valid('passport', 'driving_license', 'national_id'),
    identity_image: Joi.string().uri(),
    vehicle_info: Joi.object({
      type: Joi.string().valid('bicycle', 'motorcycle', 'car', 'scooter'),
      brand: Joi.string().max(50),
      model: Joi.string().max(50),
      year: Joi.number().integer().min(1990).max(new Date().getFullYear()),
      plate_number: Joi.string().max(20),
      color: Joi.string().max(30),
      insurance_expiry: Joi.date(),
      registration_expiry: Joi.date()
    }),
    emergency_contact: Joi.object({
      name: Joi.string().min(2).max(100),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      relationship: Joi.string().max(50)
    }),
    bank_info: Joi.object({
      account_holder_name: Joi.string().max(100),
      account_number: Joi.string().max(50),
      bank_name: Joi.string().max(100),
      routing_number: Joi.string().max(20)
    })
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Order validation
const validateOrderPlacement = (data) => {
  const orderItemSchema = Joi.object({
    product_id: Joi.number().integer().positive().required(),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().positive().precision(2).required(),
    variations: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      price: Joi.number().precision(2).default(0)
    })),
    add_ons: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      price: Joi.number().precision(2).required()
    })),
    notes: Joi.string().max(500)
  });

  const deliveryAddressSchema = Joi.object({
    contact_person_name: Joi.string().min(2).max(100).required(),
    contact_person_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    address: Joi.string().min(10).max(500).required(),
    floor: Joi.string().max(20),
    road: Joi.string().max(100),
    house: Joi.string().max(100),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  });

  const schema = Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).required(),
    order_type: Joi.string().valid('delivery', 'take_away', 'dine_in').default('delivery'),
    payment_method: Joi.string().valid('cash_on_delivery', 'credit_card', 'paypal', 'stripe', 'razorpay', 'wallet').required(),
    delivery_address: Joi.when('order_type', {
      is: 'delivery',
      then: deliveryAddressSchema.required(),
      otherwise: Joi.optional()
    }),
    delivery_address_id: Joi.number().integer().positive(),
    delivery_instructions: Joi.string().max(500),
    order_note: Joi.string().max(500),
    branch_id: Joi.number().integer().positive(),
    scheduled: Joi.boolean().default(false),
    schedule_at: Joi.when('scheduled', {
      is: true,
      then: Joi.date().greater('now').required(),
      otherwise: Joi.optional()
    }),
    delivery_date: Joi.date(),
    delivery_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    preparation_time: Joi.number().integer().min(5).max(120).default(30),
    table_id: Joi.when('order_type', {
      is: 'dine_in',
      then: Joi.number().integer().positive(),
      otherwise: Joi.optional()
    }),
    number_of_people: Joi.when('order_type', {
      is: 'dine_in',
      then: Joi.number().integer().min(1).max(20),
      otherwise: Joi.optional()
    }),
    coupon_code: Joi.string().max(50),
    coupon_discount: Joi.number().precision(2).min(0),
    coupon_title: Joi.string().max(100),
    extra_discount: Joi.number().precision(2).min(0).default(0)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Order status update validation
const validateOrderStatusUpdate = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'preparing', 'ready_for_pickup', 
      'picked_up', 'on_the_way', 'delivered', 'cancelled'
    ).required(),
    notes: Joi.string().max(500),
    estimated_time: Joi.date().greater('now'),
    delivery_man_id: Joi.number().integer().positive(),
    cancellation_reason: Joi.when('status', {
      is: 'cancelled',
      then: Joi.string().min(5).max(500).required(),
      otherwise: Joi.optional()
    })
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Order cancellation validation
const validateOrderCancellation = (data) => {
  const schema = Joi.object({
    reason: Joi.string().min(5).max(500).required()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Order rating validation
const validateOrderRating = (data) => {
  const schema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    review: Joi.string().max(1000)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Delivery man assignment validation
const validateDeliveryManAssignment = (data) => {
  const schema = Joi.object({
    delivery_man_id: Joi.number().integer().positive().required()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Location update validation
const validateLocationUpdate = (data) => {
  const schema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Order search/filter validation
const validateOrderFilters = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(
      'pending', 'confirmed', 'preparing', 'ready_for_pickup', 
      'picked_up', 'on_the_way', 'delivered', 'cancelled'
    ),
    order_type: Joi.string().valid('delivery', 'take_away', 'dine_in'),
    payment_method: Joi.string().valid('cash_on_delivery', 'credit_card', 'paypal', 'stripe', 'razorpay', 'wallet'),
    date_from: Joi.date(),
    date_to: Joi.date().greater(Joi.ref('date_from')),
    customer_id: Joi.number().integer().positive(),
    delivery_man_id: Joi.number().integer().positive(),
    branch_id: Joi.number().integer().positive(),
    min_amount: Joi.number().precision(2).min(0),
    max_amount: Joi.number().precision(2).greater(Joi.ref('min_amount')),
    search: Joi.string().max(100)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Validate order ID parameter
const validateOrderId = (orderId) => {
  const schema = Joi.number().integer().positive().required();
  return schema.validate(orderId);
};

// Validate bulk order operations
const validateBulkOrderOperation = (data) => {
  const schema = Joi.object({
    order_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).required(),
    action: Joi.string().valid('cancel', 'confirm', 'assign_delivery_man').required(),
    reason: Joi.when('action', {
      is: 'cancel',
      then: Joi.string().min(5).max(500).required(),
      otherwise: Joi.optional()
    }),
    delivery_man_id: Joi.when('action', {
      is: 'assign_delivery_man',
      then: Joi.number().integer().positive().required(),
      otherwise: Joi.optional()
    })
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// Payment validation functions
const validatePaymentInitiation = (data) => {
  const schema = Joi.object({
    payment_method: Joi.string().valid(
      'razorpay', 'stripe', 'paypal', 'wallet', 'cash_on_delivery', 'card'
    ).required(),
    callback_url: Joi.string().uri().when('payment_method', {
      is: Joi.string().valid('razorpay', 'stripe', 'paypal', 'card'),
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    })
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validatePaymentVerification = (data) => {
  const schema = Joi.object({
    razorpay_order_id: Joi.string().required(),
    razorpay_payment_id: Joi.string().required(),
    razorpay_signature: Joi.string().required()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validateWalletTopup = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).min(1).max(500000).required(),
    payment_method: Joi.string().valid('razorpay', 'stripe', 'paypal', 'card').default('razorpay'),
    callback_url: Joi.string().uri()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validateRefundRequest = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).min(1),
    reason: Joi.string().min(5).max(500).required()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validateFeeCalculation = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).min(1).max(500000).required(),
    method: Joi.string().valid('card', 'netbanking', 'wallet', 'upi', 'emi').default('card')
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validatePaymentFilters = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    payment_type: Joi.string().valid(
      'order_payment', 'wallet_topup', 'refund', 'delivery_fee', 'tip', 'subscription'
    ),
    status: Joi.string().valid(
      'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'
    ),
    payment_method: Joi.string().valid(
      'razorpay', 'stripe', 'paypal', 'wallet', 'cash_on_delivery', 'bank_transfer', 'card'
    ),
    date_from: Joi.date(),
    date_to: Joi.date().greater(Joi.ref('date_from')),
    min_amount: Joi.number().precision(2).min(0),
    max_amount: Joi.number().precision(2).greater(Joi.ref('min_amount'))
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validateWebhookPayload = (data) => {
  const schema = Joi.object({
    event: Joi.string().valid(
      'payment.captured', 'payment.failed', 'refund.processed', 'order.paid'
    ).required(),
    payload: Joi.object().required()
  });

  return schema.validate(data, { allowUnknown: true });
};

const validatePaymentAmount = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().precision(2).min(1).max(500000).required()
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

// File upload validation functions
const validateFileUpload = (data) => {
  const schema = Joi.object({
    upload_type: Joi.string().valid(
      'profile_image', 'product_image', 'category_image', 'banner_image', 
      'logo', 'document', 'gallery', 'avatar', 'video', 'audio'
    ).required(),
    compress: Joi.boolean().default(true),
    generate_thumbnails: Joi.boolean().default(true),
    quality: Joi.number().integer().min(1).max(100).default(80),
    max_width: Joi.number().integer().min(100).max(4000).default(1920),
    max_height: Joi.number().integer().min(100).max(4000).default(1080)
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateImageUpload = (data) => {
  const schema = Joi.object({
    upload_type: Joi.string().valid(
      'profile_image', 'product_image', 'category_image', 'banner_image', 
      'logo', 'gallery', 'avatar'
    ).required(),
    compress: Joi.boolean().default(true),
    generate_thumbnails: Joi.boolean().default(true),
    quality: Joi.number().integer().min(1).max(100).default(80),
    max_width: Joi.number().integer().min(100).max(4000).default(1920),
    max_height: Joi.number().integer().min(100).max(4000).default(1080),
    convert_to_webp: Joi.boolean().default(false)
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateDocumentUpload = (data) => {
  const schema = Joi.object({
    upload_type: Joi.string().valid('document').required(),
    document_type: Joi.string().valid(
      'license', 'passport', 'identity_card', 'certificate', 'contract', 
      'invoice', 'receipt', 'other'
    ).default('other'),
    description: Joi.string().min(3).max(255),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10)
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateMultipleFileUpload = (data) => {
  const schema = Joi.object({
    upload_type: Joi.string().valid(
      'gallery', 'documents', 'mixed', 'product_images', 'category_images'
    ).required(),
    max_files: Joi.number().integer().min(1).max(50).default(10),
    compress_images: Joi.boolean().default(true),
    generate_thumbnails: Joi.boolean().default(true),
    quality: Joi.number().integer().min(1).max(100).default(80)
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateImageProcessing = (data) => {
  const schema = Joi.object({
    filepath: Joi.string().required(),
    operation: Joi.string().valid(
      'resize', 'compress', 'convert_webp', 'thumbnail', 'watermark', 'crop'
    ).required(),
    width: Joi.number().integer().min(50).max(4000),
    height: Joi.number().integer().min(50).max(4000),
    quality: Joi.number().integer().min(1).max(100).default(80),
    format: Joi.string().valid('jpeg', 'png', 'webp', 'gif').default('jpeg'),
    fit: Joi.string().valid('cover', 'contain', 'fill', 'inside', 'outside').default('cover'),
    position: Joi.string().valid(
      'center', 'centre', 'top', 'bottom', 'left', 'right', 
      'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ).default('center')
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateFileDelete = (data) => {
  const schema = Joi.object({
    filepath: Joi.string().required(),
    delete_variants: Joi.boolean().default(true), // Delete all size variants
    reason: Joi.string().min(5).max(255)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validateFileInfo = (data) => {
  const schema = Joi.object({
    filepath: Joi.string().required(),
    include_metadata: Joi.boolean().default(true),
    include_variants: Joi.boolean().default(true)
  });

  return schema.validate(data, { allowUnknown: false, stripUnknown: true });
};

const validateGalleryUpload = (data) => {
  const schema = Joi.object({
    gallery_type: Joi.string().valid(
      'product', 'category', 'banner', 'restaurant', 'menu', 'event'
    ).required(),
    entity_id: Joi.number().integer().positive(),
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(5).max(500),
    tags: Joi.array().items(Joi.string().min(1).max(50)).max(10),
    is_featured: Joi.boolean().default(false),
    sort_order: Joi.number().integer().min(0).default(0)
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateVideoUpload = (data) => {
  const schema = Joi.object({
    upload_type: Joi.string().valid('video').required(),
    video_type: Joi.string().valid(
      'product_demo', 'tutorial', 'advertisement', 'training', 'other'
    ).default('other'),
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(5).max(500),
    duration: Joi.number().integer().min(1).max(3600), // Max 1 hour
    generate_thumbnail: Joi.boolean().default(true),
    thumbnail_time: Joi.number().integer().min(0).default(5) // 5 seconds
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateAudioUpload = (data) => {
  const schema = Joi.object({
    upload_type: Joi.string().valid('audio').required(),
    audio_type: Joi.string().valid(
      'notification', 'background_music', 'voice_message', 'other'
    ).default('other'),
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(5).max(500),
    duration: Joi.number().integer().min(1).max(1800), // Max 30 minutes
    bitrate: Joi.number().integer().min(64).max(320).default(128)
  });

  return schema.validate(data, { allowUnknown: true });
};

const validateBulkFileOperation = (data) => {
  const schema = Joi.object({
    operation: Joi.string().valid(
      'delete', 'move', 'compress', 'convert_webp', 'generate_thumbnails'
    ).required(),
    filepaths: Joi.array().items(Joi.string().required()).min(1).max(100).required(),
    destination: Joi.string().when('operation', {
      is: 'move',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    quality: Joi.number().integer().min(1).max(100).default(80),
    compress_options: Joi.object({
      max_width: Joi.number().integer().min(100).max(4000).default(1920),
      max_height: Joi.number().integer().min(100).max(4000).default(1080),
      quality: Joi.number().integer().min(1).max(100).default(80)
    })
  });

  return schema.validate(data, { allowUnknown: true });
};

// Generic validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        status_code: 400,
        errors
      });
    }
    
    next();
  };
};

// Custom validation helper for phone or email requirement
const validatePhoneOrEmail = (data) => {
  if (!data.phone && !data.email) {
    return {
      error: {
        details: [{
          message: 'Either phone or email must be provided',
          path: ['phone', 'email']
        }]
      }
    };
  }
  return { error: null };
};

// Sanitize input data
const sanitizeInput = (data) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

module.exports = {
  // Schemas
  registrationSchema,
  loginSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  phoneVerificationSchema,
  deliveryManRegistrationSchema,
  
  // Validation functions
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validatePhoneVerification,
  validateDeliveryManRegistration,
  validateCustomerUpdate,
  validateAddress,
  validateWalletTransaction,
  validateDeliveryManUpdate,
  
  // Order validation functions
  validateOrderPlacement,
  validateOrderStatusUpdate,
  validateOrderCancellation,
  validateOrderRating,
  validateDeliveryManAssignment,
  validateLocationUpdate,
  validateOrderFilters,
  validateOrderId,
  validateBulkOrderOperation,
  
  // Payment validation functions
  validatePaymentInitiation,
  validatePaymentVerification,
  validateWalletTopup,
  validateRefundRequest,
  validateFeeCalculation,
  validatePaymentFilters,
  validateWebhookPayload,
  validatePaymentAmount,
  
  // File upload validation functions
  validateFileUpload,
  validateImageUpload,
  validateDocumentUpload,
  validateMultipleFileUpload,
  validateImageProcessing,
  validateFileDelete,
  validateFileInfo,
  validateGalleryUpload,
  validateVideoUpload,
  validateAudioUpload,
  validateBulkFileOperation,
  
  // Utilities
  validateRequest,
  validatePhoneOrEmail,
  sanitizeInput
}; 