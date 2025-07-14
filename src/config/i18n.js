const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

// Supported languages (matching Laravel system)
const SUPPORTED_LANGUAGES = {
  en: 'English',
  ar: 'العربية',
  bn: 'বাংলা',
  es: 'Español',
  fr: 'Français'
};

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    // Fallback language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Debug mode
    debug: process.env.NODE_ENV === 'development',
    
    // Detection options
    detection: {
      // Order of language detection
      order: ['header', 'querystring', 'cookie', 'session'],
      
      // Keys for detection
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupHeader: 'accept-language',
      lookupSession: 'lng',
      
      // Cache user language
      caches: ['cookie'],
      
      // Exclude routes from detection
      ignoreRoutes: ['/api/health']
    },
    
    // Backend options
    backend: {
      // Path to locales
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
      
      // Path to save missing keys
      addPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.missing.json')
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    // Default namespace
    defaultNS: 'common',
    
    // Load all namespaces
    ns: ['common', 'auth', 'orders', 'products', 'validation', 'messages'],
    
    // Preload languages
    preload: Object.keys(SUPPORTED_LANGUAGES),
    
    // Save missing keys
    saveMissing: process.env.NODE_ENV === 'development',
    
    // Update missing keys
    updateMissing: process.env.NODE_ENV === 'development'
  });

// Custom language detection middleware
const detectLanguage = (req, res, next) => {
  // Check for language in custom header (for mobile apps)
  const customLang = req.headers['x-localization'] || req.headers['x-language'];
  
  if (customLang && Object.keys(SUPPORTED_LANGUAGES).includes(customLang)) {
    req.language = customLang;
    req.lng = customLang;
  } else {
    // Use i18next detection
    req.language = req.language || 'en';
  }
  
  next();
};

// Helper function to get translated message
const translate = (key, options = {}, language = 'en') => {
  return i18next.t(key, { ...options, lng: language });
};

// Helper function to get translated message with request context
const translateWithRequest = (req, key, options = {}) => {
  const language = req.language || req.lng || 'en';
  return i18next.t(key, { ...options, lng: language });
};

// Get user's preferred language from database
const getUserLanguage = async (userId, userType) => {
  try {
    // This would query the user's preferred language from database
    // For now, return default language
    return 'en';
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'en';
  }
};

// Set language preference for user
const setUserLanguage = async (userId, userType, language) => {
  try {
    // This would update user's language preference in database
    if (!Object.keys(SUPPORTED_LANGUAGES).includes(language)) {
      throw new Error('Unsupported language');
    }
    
    // Update user language in database
    return true;
  } catch (error) {
    console.error('Error setting user language:', error);
    return false;
  }
};

// Middleware to set language based on user preference
const setUserLanguageMiddleware = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      const userLanguage = await getUserLanguage(req.user.id, req.user.type);
      if (userLanguage) {
        req.language = userLanguage;
        req.lng = userLanguage;
      }
    } catch (error) {
      console.error('Error setting user language:', error);
    }
  }
  
  next();
};

// Response helper with translation
const respondWithTranslation = (res, key, data = {}, statusCode = 200, language = 'en') => {
  const message = translate(key, data, language);
  
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data: statusCode < 400 ? data : null,
    error: statusCode >= 400 ? data : null
  });
};

// Validation messages helper
const getValidationMessages = (language = 'en') => {
  return {
    required: translate('validation.required', {}, language),
    email: translate('validation.email', {}, language),
    min: translate('validation.min', {}, language),
    max: translate('validation.max', {}, language),
    numeric: translate('validation.numeric', {}, language),
    string: translate('validation.string', {}, language),
    boolean: translate('validation.boolean', {}, language),
    unique: translate('validation.unique', {}, language),
    exists: translate('validation.exists', {}, language)
  };
};

// Common response messages
const getCommonMessages = (language = 'en') => {
  return {
    success: translate('messages.success', {}, language),
    error: translate('messages.error', {}, language),
    notFound: translate('messages.not_found', {}, language),
    unauthorized: translate('messages.unauthorized', {}, language),
    forbidden: translate('messages.forbidden', {}, language),
    validationError: translate('messages.validation_error', {}, language),
    internalError: translate('messages.internal_error', {}, language)
  };
};

// RTL languages
const RTL_LANGUAGES = ['ar'];

// Check if language is RTL
const isRTL = (language) => {
  return RTL_LANGUAGES.includes(language);
};

module.exports = {
  i18next,
  middleware: [detectLanguage, middleware.handle(i18next), setUserLanguageMiddleware],
  SUPPORTED_LANGUAGES,
  translate,
  translateWithRequest,
  getUserLanguage,
  setUserLanguage,
  respondWithTranslation,
  getValidationMessages,
  getCommonMessages,
  isRTL,
  detectLanguage,
  setUserLanguageMiddleware
}; 