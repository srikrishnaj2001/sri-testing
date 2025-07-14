const LanguageService = require('../services/LanguageService');
const { i18next } = require('../config/i18n');

/**
 * i18n middleware for Express
 * Detects user language and provides translation functions
 */
const i18nMiddleware = async (req, res, next) => {
  try {
    // Get user's preferred language
    const userLanguage = LanguageService.getUserLanguage(req);
    
    // Set the language in i18next
    await i18next.changeLanguage(userLanguage);
    
    // Store language info in request
    req.language = userLanguage;
    req.languageInfo = LanguageService.getLanguage(userLanguage);
    req.isRTL = LanguageService.isRTL(userLanguage);
    
    // Add translation functions to request
    req.t = async (key, options = {}) => {
      return await LanguageService.translate(key, userLanguage, options);
    };
    
    req.translate = req.t; // Alias
    
    // Add bulk translation function
    req.bulkTranslate = async (keys, options = {}) => {
      return await LanguageService.bulkTranslate(keys, userLanguage, options);
    };
    
    // Add translation functions to response locals for templates
    res.locals.t = req.t;
    res.locals.translate = req.t;
    res.locals.__ = req.t; // Common i18n alias
    res.locals.language = userLanguage;
    res.locals.languageInfo = req.languageInfo;
    res.locals.isRTL = req.isRTL;
    
    // Add language switching helper
    res.locals.languageUrl = (lang) => {
      const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
      url.searchParams.set('lang', lang);
      return url.toString();
    };
    
    // Add common translations to response locals
    try {
      const commonTranslations = await LanguageService.loadLanguageFile(userLanguage, 'common');
      res.locals.common = commonTranslations;
      
      // Add some commonly used translations directly
      res.locals.commonMessages = {
        loading: await req.t('loading'),
        success: await req.t('success'),
        error: await req.t('error'),
        save: await req.t('save'),
        cancel: await req.t('cancel'),
        ok: await req.t('ok'),
        yes: await req.t('yes'),
        no: await req.t('no')
      };
    } catch (error) {
      console.error('Error loading common translations:', error);
      res.locals.common = {};
      res.locals.commonMessages = {};
    }
    
    next();
  } catch (error) {
    console.error('i18n middleware error:', error);
    
    // Set fallback values
    req.language = LanguageService.defaultLanguage;
    req.languageInfo = LanguageService.getLanguage(LanguageService.defaultLanguage);
    req.isRTL = false;
    
    req.t = (key) => key;
    req.translate = req.t;
    req.bulkTranslate = async (keys) => {
      const result = {};
      keys.forEach(key => result[key] = key);
      return result;
    };
    
    res.locals.t = req.t;
    res.locals.translate = req.t;
    res.locals.__ = req.t;
    res.locals.language = LanguageService.defaultLanguage;
    res.locals.languageInfo = req.languageInfo;
    res.locals.isRTL = false;
    res.locals.common = {};
    res.locals.commonMessages = {};
    
    next();
  }
};

/**
 * Language detection middleware
 * Only detects language without setting up translation functions
 */
const languageDetectionMiddleware = (req, res, next) => {
  try {
    const userLanguage = LanguageService.getUserLanguage(req);
    
    req.language = userLanguage;
    req.languageInfo = LanguageService.getLanguage(userLanguage);
    req.isRTL = LanguageService.isRTL(userLanguage);
    
    res.locals.language = userLanguage;
    res.locals.languageInfo = req.languageInfo;
    res.locals.isRTL = req.isRTL;
    
    next();
  } catch (error) {
    console.error('Language detection middleware error:', error);
    
    req.language = LanguageService.defaultLanguage;
    req.languageInfo = LanguageService.getLanguage(LanguageService.defaultLanguage);
    req.isRTL = false;
    
    res.locals.language = LanguageService.defaultLanguage;
    res.locals.languageInfo = req.languageInfo;
    res.locals.isRTL = false;
    
    next();
  }
};

/**
 * Response formatting middleware with i18n support
 */
const i18nResponseMiddleware = (req, res, next) => {
  // Add localized response formatter
  res.formatResponse = async (success, messageKey, data = null, error = null) => {
    const message = await req.t(messageKey);
    
    return {
      success,
      message,
      data,
      error,
      language: req.language,
      timestamp: new Date().toISOString()
    };
  };
  
  // Add localized JSON response method
  res.jsonWithTranslation = async (success, messageKey, data = null, error = null, statusCode = 200) => {
    const response = await res.formatResponse(success, messageKey, data, error);
    return res.status(statusCode).json(response);
  };
  
  next();
};

/**
 * Middleware to add language headers to response
 */
const languageHeaderMiddleware = (req, res, next) => {
  // Add language information to response headers
  res.setHeader('Content-Language', req.language);
  res.setHeader('X-Language', req.language);
  
  if (req.isRTL) {
    res.setHeader('X-Text-Direction', 'rtl');
  } else {
    res.setHeader('X-Text-Direction', 'ltr');
  }
  
  next();
};

/**
 * Middleware to handle language switching
 */
const languageSwitchMiddleware = async (req, res, next) => {
  const langParam = req.query.lang || req.body.lang;
  
  if (langParam && LanguageService.isLanguageSupported(langParam)) {
    // Set language in session
    LanguageService.setUserLanguage(req, langParam);
    
    // Update user's language preference if logged in
    if (req.user && req.user.id) {
      try {
        const { User } = require('../models');
        await User.update(
          { language_code: langParam },
          { where: { id: req.user.id } }
        );
      } catch (error) {
        console.error('Error updating user language preference:', error);
      }
    }
    
    // Remove lang parameter from query to prevent it from being passed along
    delete req.query.lang;
    delete req.body.lang;
  }
  
  next();
};

/**
 * Middleware to add language-specific cache headers
 */
const languageCacheMiddleware = (req, res, next) => {
  // Add Vary header to indicate that response varies by language
  res.setHeader('Vary', 'Accept-Language, X-Language');
  
  // Add language-specific cache key
  const cacheKey = `${req.originalUrl}-${req.language}`;
  req.cacheKey = cacheKey;
  
  next();
};

/**
 * Error handling middleware with i18n support
 */
const i18nErrorMiddleware = async (err, req, res, next) => {
  // Try to translate error message
  let errorMessage = err.message;
  
  if (req.t) {
    try {
      // Try to find translation for error message
      const translatedMessage = await req.t(`errors.${err.code}`) || await req.t(err.message);
      if (translatedMessage && translatedMessage !== err.message && translatedMessage !== `errors.${err.code}`) {
        errorMessage = translatedMessage;
      }
    } catch (translationError) {
      console.error('Error translating error message:', translationError);
    }
  }
  
  // Set error response
  const errorResponse = {
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : null,
    code: err.code || 'INTERNAL_ERROR',
    language: req.language || LanguageService.defaultLanguage,
    timestamp: new Date().toISOString()
  };
  
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  i18nMiddleware,
  languageDetectionMiddleware,
  i18nResponseMiddleware,
  languageHeaderMiddleware,
  languageSwitchMiddleware,
  languageCacheMiddleware,
  i18nErrorMiddleware
}; 