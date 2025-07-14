/**
 * Translation Utilities
 * Converted from PHP CentralLogics/Translation.php to JavaScript
 */

const fs = require('fs').promises;
const path = require('path');
const { removeInvalidCharacters, getDefaultLanguage } = require('./helpers');
const { DEFAULTS } = require('./constants');

// Cache for loaded translations
const translationCache = new Map();

/**
 * Get current language from session/context
 * @param {Object} req - Express request object (optional)
 * @returns {string} Current language code
 */
const getCurrentLanguage = (req = null) => {
    if (req) {
        // Check request headers for language
        const acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
            const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
            for (const lang of languages) {
                if (DEFAULTS.SUPPORTED_LANGUAGES.includes(lang)) {
                    return lang;
                }
            }
        }
        
        // Check session
        if (req.session && req.session.language) {
            return req.session.language;
        }
        
        // Check query parameter
        if (req.query && req.query.lang) {
            return req.query.lang;
        }
    }
    
    return DEFAULTS.LANGUAGE;
};

/**
 * Load translation file for a specific language
 * @param {string} language - Language code
 * @returns {Promise<Object>} Translation object
 */
const loadTranslationFile = async (language) => {
    const cacheKey = `translations_${language}`;
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }
    
    try {
        const translationPath = path.join(__dirname, '..', 'locales', `${language}.json`);
        const translationData = await fs.readFile(translationPath, 'utf8');
        const translations = JSON.parse(translationData);
        
        // Cache the translations
        translationCache.set(cacheKey, translations);
        
        return translations;
    } catch (error) {
        console.error(`Error loading translation file for language ${language}:`, error);
        
        // Fallback to default language
        if (language !== DEFAULTS.LANGUAGE) {
            return await loadTranslationFile(DEFAULTS.LANGUAGE);
        }
        
        return {};
    }
};

/**
 * Save translation file for a specific language
 * @param {string} language - Language code
 * @param {Object} translations - Translation object
 * @returns {Promise<boolean>} Success status
 */
const saveTranslationFile = async (language, translations) => {
    try {
        const translationPath = path.join(__dirname, '..', 'locales', `${language}.json`);
        const translationData = JSON.stringify(translations, null, 2);
        
        await fs.writeFile(translationPath, translationData, 'utf8');
        
        // Update cache
        const cacheKey = `translations_${language}`;
        translationCache.set(cacheKey, translations);
        
        return true;
    } catch (error) {
        console.error(`Error saving translation file for language ${language}:`, error);
        return false;
    }
};

/**
 * Translate a key to current language
 * @param {string} key - Translation key
 * @param {string} language - Language code (optional)
 * @param {Object} replacements - Variable replacements (optional)
 * @returns {Promise<string>} Translated text
 */
const translate = async (key, language = null, replacements = {}) => {
    if (!key || typeof key !== 'string') {
        return key || '';
    }
    
    const currentLanguage = language || DEFAULTS.LANGUAGE;
    const translations = await loadTranslationFile(currentLanguage);
    
    // Check if translation exists
    if (translations[key]) {
        let translatedText = translations[key];
        
        // Apply replacements
        if (replacements && typeof replacements === 'object') {
            Object.keys(replacements).forEach(placeholder => {
                const value = replacements[placeholder];
                translatedText = translatedText.replace(new RegExp(`{${placeholder}}`, 'g'), value);
            });
        }
        
        return translatedText;
    }
    
    // Translation not found, create a default one
    const processedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    const cleanedKey = removeInvalidCharacters(processedKey);
    
    // Add missing translation to the file
    translations[key] = cleanedKey;
    await saveTranslationFile(currentLanguage, translations);
    
    return cleanedKey;
};

/**
 * Translate with context (Express middleware compatible)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const translateMiddleware = (req, res, next) => {
    const currentLanguage = getCurrentLanguage(req);
    
    // Add translate function to request object
    req.translate = async (key, replacements = {}) => {
        return await translate(key, currentLanguage, replacements);
    };
    
    // Add translate function to response locals for template rendering
    res.locals.translate = req.translate;
    res.locals.__ = req.translate; // Common alias
    res.locals.t = req.translate; // Another common alias
    
    next();
};

/**
 * Get all available languages
 * @returns {Promise<Array>} Array of available languages
 */
const getAvailableLanguages = async () => {
    try {
        const localesPath = path.join(__dirname, '..', 'locales');
        const files = await fs.readdir(localesPath);
        
        const languages = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''));
        
        return languages;
    } catch (error) {
        console.error('Error getting available languages:', error);
        return [DEFAULTS.LANGUAGE];
    }
};

/**
 * Get language name by code
 * @param {string} languageCode - Language code
 * @returns {string} Language name
 */
const getLanguageName = (languageCode) => {
    const languageNames = {
        'en': 'English',
        'bn': 'বাংলা',
        'ar': 'العربية',
        'es': 'Español',
        'fr': 'Français',
        'hi': 'हिन्दी',
        'ur': 'اردو',
        'zh': '中文',
        'ja': '日本語',
        'ko': '한국어',
        'de': 'Deutsch',
        'it': 'Italiano',
        'pt': 'Português',
        'ru': 'Русский',
        'tr': 'Türkçe',
        'nl': 'Nederlands',
        'pl': 'Polski',
        'sv': 'Svenska',
        'no': 'Norsk',
        'da': 'Dansk',
        'fi': 'Suomi',
        'el': 'Ελληνικά',
        'he': 'עברית',
        'th': 'ไทย',
        'vi': 'Tiếng Việt',
        'id': 'Bahasa Indonesia',
        'ms': 'Bahasa Melayu',
        'tl': 'Filipino',
        'sw': 'Kiswahili',
        'am': 'አማርኛ',
        'yo': 'Yorùbá',
        'ig': 'Igbo',
        'ha': 'Hausa'
    };
    
    return languageNames[languageCode] || languageCode;
};

/**
 * Bulk translate multiple keys
 * @param {Array} keys - Array of translation keys
 * @param {string} language - Language code (optional)
 * @param {Object} replacements - Variable replacements (optional)
 * @returns {Promise<Object>} Object with translated keys
 */
const bulkTranslate = async (keys, language = null, replacements = {}) => {
    if (!Array.isArray(keys)) {
        return {};
    }
    
    const currentLanguage = language || DEFAULTS.LANGUAGE;
    const translations = await loadTranslationFile(currentLanguage);
    const result = {};
    
    for (const key of keys) {
        result[key] = await translate(key, currentLanguage, replacements[key] || {});
    }
    
    return result;
};

/**
 * Check if a translation key exists
 * @param {string} key - Translation key
 * @param {string} language - Language code (optional)
 * @returns {Promise<boolean>} Whether the key exists
 */
const hasTranslation = async (key, language = null) => {
    const currentLanguage = language || DEFAULTS.LANGUAGE;
    const translations = await loadTranslationFile(currentLanguage);
    
    return translations.hasOwnProperty(key);
};

/**
 * Get all translations for a language
 * @param {string} language - Language code (optional)
 * @returns {Promise<Object>} All translations
 */
const getAllTranslations = async (language = null) => {
    const currentLanguage = language || DEFAULTS.LANGUAGE;
    return await loadTranslationFile(currentLanguage);
};

/**
 * Add or update a translation
 * @param {string} key - Translation key
 * @param {string} value - Translation value
 * @param {string} language - Language code (optional)
 * @returns {Promise<boolean>} Success status
 */
const addTranslation = async (key, value, language = null) => {
    const currentLanguage = language || DEFAULTS.LANGUAGE;
    const translations = await loadTranslationFile(currentLanguage);
    
    translations[key] = value;
    
    return await saveTranslationFile(currentLanguage, translations);
};

/**
 * Remove a translation
 * @param {string} key - Translation key
 * @param {string} language - Language code (optional)
 * @returns {Promise<boolean>} Success status
 */
const removeTranslation = async (key, language = null) => {
    const currentLanguage = language || DEFAULTS.LANGUAGE;
    const translations = await loadTranslationFile(currentLanguage);
    
    if (translations.hasOwnProperty(key)) {
        delete translations[key];
        return await saveTranslationFile(currentLanguage, translations);
    }
    
    return true;
};

/**
 * Clear translation cache
 * @param {string} language - Language code (optional, clears all if not specified)
 */
const clearTranslationCache = (language = null) => {
    if (language) {
        const cacheKey = `translations_${language}`;
        translationCache.delete(cacheKey);
    } else {
        translationCache.clear();
    }
};

/**
 * Get translation cache size
 * @returns {number} Cache size
 */
const getTranslationCacheSize = () => {
    return translationCache.size;
};

/**
 * Initialize translation system
 * @returns {Promise<boolean>} Success status
 */
const initializeTranslations = async () => {
    try {
        // Ensure locales directory exists
        const localesPath = path.join(__dirname, '..', 'locales');
        
        try {
            await fs.access(localesPath);
        } catch (error) {
            await fs.mkdir(localesPath, { recursive: true });
        }
        
        // Create default language file if it doesn't exist
        const defaultLanguageFile = path.join(localesPath, `${DEFAULTS.LANGUAGE}.json`);
        
        try {
            await fs.access(defaultLanguageFile);
        } catch (error) {
            const defaultTranslations = {
                'welcome': 'Welcome',
                'hello': 'Hello',
                'goodbye': 'Goodbye',
                'thank_you': 'Thank you',
                'please': 'Please',
                'yes': 'Yes',
                'no': 'No',
                'login': 'Login',
                'logout': 'Logout',
                'register': 'Register',
                'forgot_password': 'Forgot Password',
                'reset_password': 'Reset Password',
                'email': 'Email',
                'password': 'Password',
                'confirm_password': 'Confirm Password',
                'name': 'Name',
                'phone': 'Phone',
                'address': 'Address',
                'save': 'Save',
                'cancel': 'Cancel',
                'edit': 'Edit',
                'delete': 'Delete',
                'view': 'View',
                'back': 'Back',
                'next': 'Next',
                'previous': 'Previous',
                'search': 'Search',
                'filter': 'Filter',
                'sort': 'Sort',
                'order': 'Order',
                'cart': 'Cart',
                'checkout': 'Checkout',
                'payment': 'Payment',
                'delivery': 'Delivery',
                'pickup': 'Pickup',
                'total': 'Total',
                'subtotal': 'Subtotal',
                'tax': 'Tax',
                'discount': 'Discount',
                'success': 'Success',
                'error': 'Error',
                'warning': 'Warning',
                'info': 'Information',
                'loading': 'Loading...',
                'no_data': 'No data available',
                'invalid_email': 'Invalid email address',
                'invalid_phone': 'Invalid phone number',
                'required_field': 'This field is required',
                'min_length': 'Minimum length is {min} characters',
                'max_length': 'Maximum length is {max} characters',
                'order_placed': 'Order placed successfully',
                'order_confirmed': 'Order confirmed',
                'order_processing': 'Order is being processed',
                'order_ready': 'Order is ready for pickup',
                'order_picked_up': 'Order picked up',
                'order_on_the_way': 'Order is on the way',
                'order_delivered': 'Order delivered',
                'order_cancelled': 'Order cancelled',
                'payment_successful': 'Payment successful',
                'payment_failed': 'Payment failed',
                'insufficient_balance': 'Insufficient balance',
                'invalid_coupon': 'Invalid coupon code',
                'coupon_applied': 'Coupon applied successfully',
                'delivery_unavailable': 'Delivery unavailable for this location',
                'restaurant_closed': 'Restaurant is currently closed',
                'out_of_stock': 'Item is out of stock',
                'minimum_order_amount': 'Minimum order amount is {amount}',
                'maximum_order_amount': 'Maximum order amount is {amount}',
                'profile_updated': 'Profile updated successfully',
                'password_changed': 'Password changed successfully',
                'address_added': 'Address added successfully',
                'address_updated': 'Address updated successfully',
                'address_deleted': 'Address deleted successfully',
                'item_added_to_cart': 'Item added to cart',
                'item_removed_from_cart': 'Item removed from cart',
                'cart_cleared': 'Cart cleared',
                'wishlist_added': 'Added to wishlist',
                'wishlist_removed': 'Removed from wishlist',
                'notification_sent': 'Notification sent successfully',
                'email_sent': 'Email sent successfully',
                'sms_sent': 'SMS sent successfully',
                'file_uploaded': 'File uploaded successfully',
                'file_deleted': 'File deleted successfully',
                'settings_updated': 'Settings updated successfully',
                'data_exported': 'Data exported successfully',
                'data_imported': 'Data imported successfully',
                'backup_created': 'Backup created successfully',
                'backup_restored': 'Backup restored successfully',
                'cache_cleared': 'Cache cleared successfully',
                'maintenance_mode_on': 'Maintenance mode is enabled',
                'maintenance_mode_off': 'Maintenance mode is disabled',
                'system_update_available': 'System update available',
                'system_updated': 'System updated successfully',
                'permission_denied': 'Permission denied',
                'access_denied': 'Access denied',
                'session_expired': 'Session expired',
                'account_locked': 'Account locked',
                'account_suspended': 'Account suspended',
                'account_activated': 'Account activated',
                'account_deactivated': 'Account deactivated',
                'verification_code_sent': 'Verification code sent',
                'verification_successful': 'Verification successful',
                'verification_failed': 'Verification failed',
                'otp_expired': 'OTP expired',
                'invalid_otp': 'Invalid OTP',
                'rate_limit_exceeded': 'Rate limit exceeded',
                'server_error': 'Internal server error',
                'network_error': 'Network error',
                'connection_timeout': 'Connection timeout',
                'service_unavailable': 'Service temporarily unavailable',
                'database_error': 'Database error',
                'validation_error': 'Validation error',
                'authentication_error': 'Authentication error',
                'authorization_error': 'Authorization error',
                'not_found': 'Not found',
                'page_not_found': 'Page not found',
                'resource_not_found': 'Resource not found',
                'duplicate_entry': 'Duplicate entry',
                'invalid_request': 'Invalid request',
                'bad_request': 'Bad request',
                'forbidden': 'Forbidden',
                'unauthorized': 'Unauthorized',
                'method_not_allowed': 'Method not allowed',
                'unsupported_media_type': 'Unsupported media type',
                'request_timeout': 'Request timeout',
                'conflict': 'Conflict',
                'gone': 'Gone',
                'length_required': 'Length required',
                'precondition_failed': 'Precondition failed',
                'payload_too_large': 'Payload too large',
                'uri_too_long': 'URI too long',
                'unsupported_media_type': 'Unsupported media type',
                'range_not_satisfiable': 'Range not satisfiable',
                'expectation_failed': 'Expectation failed',
                'unprocessable_entity': 'Unprocessable entity',
                'locked': 'Locked',
                'failed_dependency': 'Failed dependency',
                'too_early': 'Too early',
                'upgrade_required': 'Upgrade required',
                'precondition_required': 'Precondition required',
                'too_many_requests': 'Too many requests',
                'request_header_fields_too_large': 'Request header fields too large',
                'unavailable_for_legal_reasons': 'Unavailable for legal reasons'
            };
            
            await fs.writeFile(defaultLanguageFile, JSON.stringify(defaultTranslations, null, 2), 'utf8');
        }
        
        return true;
    } catch (error) {
        console.error('Error initializing translations:', error);
        return false;
    }
};

module.exports = {
    getCurrentLanguage,
    loadTranslationFile,
    saveTranslationFile,
    translate,
    translateMiddleware,
    getAvailableLanguages,
    getLanguageName,
    bulkTranslate,
    hasTranslation,
    getAllTranslations,
    addTranslation,
    removeTranslation,
    clearTranslationCache,
    getTranslationCacheSize,
    initializeTranslations
}; 