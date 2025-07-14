/**
 * Application Constants
 * Centralized constants for the eFood delivery system
 */

// Cache Keys
const CACHE_KEYS = {
    BUSINESS_SETTINGS: 'business_settings',
    LOGIN_SETUP: 'login_setup',
    LANGUAGE_SETTINGS: 'language_settings',
    CURRENCY_SETTINGS: 'currency_settings',
    BRANCHES: 'branches',
    CATEGORIES: 'categories',
    PRODUCTS: 'products',
    DELIVERY_CHARGES: 'delivery_charges'
};

// Order Status Constants
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    PREPARING: 'preparing',
    READY_FOR_PICKUP: 'ready_for_pickup',
    PICKED_UP: 'picked_up',
    ON_THE_WAY: 'on_the_way',
    DELIVERED: 'delivered',
    RETURNED: 'returned',
    CANCELLED: 'cancelled'
};

// Payment Status Constants
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
};

// Payment Methods
const PAYMENT_METHODS = {
    CASH_ON_DELIVERY: 'cash_on_delivery',
    RAZORPAY: 'razorpay',
    STRIPE: 'stripe',
    PAYPAL: 'paypal',
    WALLET: 'wallet',
    BANK_TRANSFER: 'bank_transfer',
    CARD: 'card'
};

// User Types
const USER_TYPES = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    DELIVERY_MAN: 'delivery_man',
    KITCHEN_STAFF: 'kitchen_staff',
    BRANCH_MANAGER: 'branch_manager'
};

// Product Types
const PRODUCT_TYPES = {
    VEG: 'veg',
    NON_VEG: 'non_veg',
    ALL: 'all'
};

// Order Types
const ORDER_TYPES = {
    DELIVERY: 'delivery',
    TAKEAWAY: 'takeaway',
    DINE_IN: 'dine_in'
};

// Business Settings Keys
const BUSINESS_SETTINGS = {
    RESTAURANT_NAME: 'restaurant_name',
    RESTAURANT_LOGO: 'restaurant_logo',
    RESTAURANT_ADDRESS: 'restaurant_address',
    RESTAURANT_PHONE: 'restaurant_phone',
    RESTAURANT_EMAIL: 'restaurant_email',
    CURRENCY_CODE: 'currency_code',
    CURRENCY_SYMBOL: 'currency_symbol',
    CURRENCY_SYMBOL_POSITION: 'currency_symbol_position',
    CURRENCY_DECIMAL_PLACES: 'currency_decimal_places',
    TIMEZONE: 'timezone',
    COUNTRY_CODE: 'country_code',
    PAGINATION_LIMIT: 'pagination_limit',
    MINIMUM_ORDER_VALUE: 'minimum_order_value',
    DELIVERY_CHARGE: 'delivery_charge',
    FREE_DELIVERY_OVER: 'free_delivery_over',
    TAX_PERCENT: 'tax_percent',
    SERVICE_CHARGE: 'service_charge',
    DELIVERY_MANAGEMENT: 'delivery_management',
    BRANCH_COVERAGE: 'branch_coverage',
    CUSTOMER_VERIFICATION: 'customer_verification',
    ORDER_CONFIRMATION_MODEL: 'order_confirmation_model',
    MAINTENANCE_MODE: 'maintenance_mode',
    MAXIMUM_ORDER_VALUE: 'maximum_order_value',
    SELF_PICKUP: 'self_pickup',
    DELIVERY_CHARGE_SETUP: 'delivery_charge_setup',
    TOGGLE_VEG_NON_VEG: 'toggle_veg_non_veg',
    TOGGLE_DM_REGISTRATION: 'toggle_dm_registration',
    TOGGLE_RESTAURANT_REGISTRATION: 'toggle_restaurant_registration',
    SCHEDULE_ORDER: 'schedule_order',
    SCHEDULE_ORDER_SLOT_DURATION: 'schedule_order_slot_duration',
    DIGITAL_PAYMENT: 'digital_payment',
    CASH_ON_DELIVERY: 'cash_on_delivery',
    PARTIAL_PAYMENT: 'partial_payment',
    WALLET_STATUS: 'wallet_status',
    LOYALTY_POINT_STATUS: 'loyalty_point_status',
    LOYALTY_POINT_EXCHANGE_RATE: 'loyalty_point_exchange_rate',
    LOYALTY_POINT_ITEM_PURCHASE_POINT: 'loyalty_point_item_purchase_point',
    LOYALTY_POINT_MINIMUM_POINT: 'loyalty_point_minimum_point',
    REFERRAL_EARNING_STATUS: 'referral_earning_status',
    REFERRAL_EARNING_EXCHANGE_RATE: 'referral_earning_exchange_rate',
    PHONE_VERIFICATION: 'phone_verification',
    EMAIL_VERIFICATION: 'email_verification',
    FORGOT_PASSWORD_VERIFICATION: 'forgot_password_verification',
    FIREBASE_MESSAGE_CONFIG: 'firebase_message_config',
    PUSH_NOTIFICATION_KEY: 'push_notification_key',
    ORDER_PENDING_MESSAGE: 'order_pending_message',
    ORDER_CONFIRMATION_MESSAGE: 'order_confirmation_message',
    ORDER_PROCESSING_MESSAGE: 'order_processing_message',
    OUT_FOR_DELIVERY_MESSAGE: 'out_for_delivery_message',
    ORDER_DELIVERED_MESSAGE: 'order_delivered_message',
    DELIVERY_BOY_ASSIGN_MESSAGE: 'delivery_boy_assign_message',
    DELIVERY_BOY_START_MESSAGE: 'delivery_boy_start_message',
    DELIVERY_BOY_DELIVERED_MESSAGE: 'delivery_boy_delivered_message',
    CANCELED_MESSAGE: 'canceled_message',
    CUSTOMER_NOTIFY_MESSAGE: 'customer_notify_message',
    RETURNED_MESSAGE: 'returned_message',
    FAILED_MESSAGE: 'failed_message',
    CUSTOMER_NOTIFY_MESSAGE_FOR_TIME_CHANGE: 'customer_notify_message_for_time_change'
};

// File Upload Constants
const FILE_TYPES = {
    IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    DOCUMENTS: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    VIDEOS: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    AUDIO: ['mp3', 'wav', 'aac', 'ogg', 'flac']
};

const FILE_SIZE_LIMITS = {
    PRODUCT_IMAGE: 5 * 1024 * 1024, // 5MB
    PROFILE_IMAGE: 2 * 1024 * 1024, // 2MB
    BANNER_IMAGE: 10 * 1024 * 1024, // 10MB
    CATEGORY_IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 50 * 1024 * 1024 // 50MB
};

// Notification Types
const NOTIFICATION_TYPES = {
    ORDER_PLACED: 'order_placed',
    ORDER_CONFIRMED: 'order_confirmed',
    ORDER_PROCESSING: 'order_processing',
    ORDER_READY_FOR_PICKUP: 'order_ready_for_pickup',
    ORDER_PICKED_UP: 'order_picked_up',
    ORDER_ON_THE_WAY: 'order_on_the_way',
    ORDER_DELIVERED: 'order_delivered',
    ORDER_CANCELLED: 'order_cancelled',
    ORDER_RETURNED: 'order_returned',
    DELIVERY_MAN_ASSIGNED: 'delivery_man_assigned',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    WALLET_CREDITED: 'wallet_credited',
    WALLET_DEBITED: 'wallet_debited',
    LOYALTY_POINTS_EARNED: 'loyalty_points_earned',
    PROMOTIONAL: 'promotional',
    GENERAL: 'general'
};

// Time Constants
const TIME_CONSTANTS = {
    SECONDS_IN_MINUTE: 60,
    MINUTES_IN_HOUR: 60,
    HOURS_IN_DAY: 24,
    DAYS_IN_WEEK: 7,
    DAYS_IN_MONTH: 30,
    MONTHS_IN_YEAR: 12,
    MILLISECONDS_IN_SECOND: 1000,
    MILLISECONDS_IN_MINUTE: 60 * 1000,
    MILLISECONDS_IN_HOUR: 60 * 60 * 1000,
    MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000
};

// App Information (from Constants.php)
const APPS = {
    TABLE_APP: {
        software_id: 40488202,
        app_name: 'Efood table app',
        buy_now_link: 'https://codecanyon.net/item/efood-tablewaiter-app/40488202?s_rank=2'
    },
    KITCHEN_APP: {
        software_id: 40488338,
        app_name: 'Efood kitchen app',
        buy_now_link: 'https://codecanyon.net/item/efood-kitchenchef-app/40488338?s_rank=1'
    }
};

// Default Values
const DEFAULTS = {
    PAGINATION_LIMIT: 10,
    CURRENCY_CODE: 'USD',
    CURRENCY_SYMBOL: '$',
    CURRENCY_DECIMAL_PLACES: 2,
    TIMEZONE: 'UTC',
    LANGUAGE: 'en',
    DELIVERY_CHARGE: 0,
    TAX_PERCENT: 0,
    SERVICE_CHARGE: 0,
    RATING_SCALE: 5,
    MINIMUM_ORDER_VALUE: 0,
    MAXIMUM_ORDER_VALUE: 999999,
    LOYALTY_POINT_EXCHANGE_RATE: 1,
    REFERRAL_EARNING_EXCHANGE_RATE: 1,
    SCHEDULE_ORDER_SLOT_DURATION: 30, // minutes
    SESSION_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    OTP_EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes in milliseconds
    PASSWORD_RESET_EXPIRY: 15 * 60 * 1000, // 15 minutes in milliseconds
    VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    MAXIMUM_LOGIN_ATTEMPTS: 5,
    ACCOUNT_LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
    CACHE_TTL: 60 * 60 * 1000, // 1 hour in milliseconds
    NOTIFICATION_BATCH_SIZE: 100,
    SEARCH_RESULTS_LIMIT: 50,
    MAXIMUM_FILE_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB
    DELIVERY_TIME_SLOTS: ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'],
    SUPPORTED_LANGUAGES: ['en', 'bn', 'ar', 'es', 'fr'],
    DISTANCE_UNIT: 'km',
    MAXIMUM_DELIVERY_DISTANCE: 50, // km
    MINIMUM_DELIVERY_DISTANCE: 0, // km
    DELIVERY_BOY_ASSIGNMENT_RADIUS: 10, // km
    ORDER_PREPARATION_TIME: 30, // minutes
    MINIMUM_AGE_REQUIREMENT: 18,
    MAXIMUM_CART_ITEMS: 50,
    MAXIMUM_WISHLIST_ITEMS: 100,
    MAXIMUM_ADDRESS_BOOK_ENTRIES: 10,
    COUPON_CODE_LENGTH: 8,
    REFERRAL_CODE_LENGTH: 6,
    ORDER_NUMBER_LENGTH: 8,
    TRANSACTION_ID_LENGTH: 12
};

// Error Codes
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    DELIVERY_UNAVAILABLE: 'DELIVERY_UNAVAILABLE',
    PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
    INVALID_COUPON: 'INVALID_COUPON',
    BRANCH_CLOSED: 'BRANCH_CLOSED',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    MAINTENANCE_MODE: 'MAINTENANCE_MODE',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    EXPIRED_TOKEN: 'EXPIRED_TOKEN',
    INVALID_OTP: 'INVALID_OTP',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
};

// Success Codes
const SUCCESS_CODES = {
    OK: 'OK',
    CREATED: 'CREATED',
    UPDATED: 'UPDATED',
    DELETED: 'DELETED',
    PAYMENT_SUCCESSFUL: 'PAYMENT_SUCCESSFUL',
    ORDER_PLACED: 'ORDER_PLACED',
    ORDER_UPDATED: 'ORDER_UPDATED',
    NOTIFICATION_SENT: 'NOTIFICATION_SENT',
    EMAIL_SENT: 'EMAIL_SENT',
    SMS_SENT: 'SMS_SENT',
    FILE_UPLOADED: 'FILE_UPLOADED',
    VERIFIED: 'VERIFIED',
    LOGGED_IN: 'LOGGED_IN',
    LOGGED_OUT: 'LOGGED_OUT',
    PASSWORD_RESET: 'PASSWORD_RESET',
    ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED'
};

// Regex Patterns
const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    POSTAL_CODE: /^[A-Za-z0-9\s-]{3,10}$/,
    CURRENCY: /^\d+(\.\d{1,2})?$/,
    PERCENTAGE: /^(0|[1-9]\d?)(\.\d+)?$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    NUMERIC: /^\d+$/,
    DECIMAL: /^\d+(\.\d+)?$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
    HEXCOLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    COORDINATES: /^-?\d+\.?\d*,-?\d+\.?\d*$/,
    TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
    DATETIME_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
};

module.exports = {
    CACHE_KEYS,
    ORDER_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    USER_TYPES,
    PRODUCT_TYPES,
    ORDER_TYPES,
    BUSINESS_SETTINGS,
    FILE_TYPES,
    FILE_SIZE_LIMITS,
    NOTIFICATION_TYPES,
    TIME_CONSTANTS,
    APPS,
    DEFAULTS,
    ERROR_CODES,
    SUCCESS_CODES,
    REGEX_PATTERNS
}; 