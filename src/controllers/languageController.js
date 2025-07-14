const LanguageService = require('../services/LanguageService');
const { User } = require('../models');
const { formatResponse } = require('../utils/responseFormatter');
const { asyncHandler } = require('../utils/asyncHandler');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

class LanguageController {
  
  /**
   * Get all supported languages
   * GET /api/v1/languages
   */
  getSupportedLanguages = asyncHandler(async (req, res) => {
    const languages = LanguageService.getSupportedLanguages();
    const languageList = Object.values(languages).map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flag: lang.flag,
      rtl: lang.rtl,
      supported: true
    }));

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        languages: languageList,
        currentLanguage: LanguageService.getUserLanguage(req),
        defaultLanguage: LanguageService.defaultLanguage
      }
    ));
  });

  /**
   * Get current user's language
   * GET /api/v1/languages/current
   */
  getCurrentLanguage = asyncHandler(async (req, res) => {
    const currentLang = LanguageService.getUserLanguage(req);
    const languageInfo = LanguageService.getLanguage(currentLang);

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        currentLanguage: currentLang,
        languageInfo,
        isRTL: LanguageService.isRTL(currentLang)
      }
    ));
  });

  /**
   * Set user's language preference
   * POST /api/v1/languages/set
   */
  setLanguage = asyncHandler(async (req, res) => {
    const { language } = req.body;

    if (!LanguageService.isLanguageSupported(language)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    // Set in session
    const sessionSet = LanguageService.setUserLanguage(req, language);

    // Update user's language preference if logged in
    if (req.user && req.user.id) {
      try {
        await User.update(
          { language_code: language },
          { where: { id: req.user.id } }
        );
      } catch (error) {
        console.error('Error updating user language:', error);
      }
    }

    if (sessionSet) {
      res.json(formatResponse(
        true,
        await LanguageService.translateWithRequest(req, 'success'),
        {
          language,
          languageInfo: LanguageService.getLanguage(language),
          isRTL: LanguageService.isRTL(language)
        }
      ));
    } else {
      res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Failed to set language'
      ));
    }
  });

  /**
   * Get translations for a namespace
   * GET /api/v1/languages/:lang/translations/:namespace
   */
  getTranslations = asyncHandler(async (req, res) => {
    const { lang, namespace } = req.params;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const translations = await LanguageService.loadLanguageFile(lang, namespace);

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        language: lang,
        namespace,
        translations
      }
    ));
  });

  /**
   * Get all translations for a language
   * GET /api/v1/languages/:lang/translations
   */
  getAllTranslations = asyncHandler(async (req, res) => {
    const { lang } = req.params;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const translations = await LanguageService.getAllTranslations(lang);

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        language: lang,
        translations
      }
    ));
  });

  /**
   * Translate multiple keys
   * POST /api/v1/languages/translate
   */
  translateKeys = asyncHandler(async (req, res) => {
    const { keys, language, options = {} } = req.body;
    const targetLang = language || LanguageService.getUserLanguage(req);

    if (!LanguageService.isLanguageSupported(targetLang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const translations = await LanguageService.bulkTranslate(keys, targetLang, options);

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        language: targetLang,
        translations
      }
    ));
  });

  /**
   * Get language statistics
   * GET /api/v1/languages/:lang/stats
   */
  getLanguageStats = asyncHandler(async (req, res) => {
    const { lang } = req.params;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const stats = await LanguageService.getLanguageStats(lang);

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      stats
    ));
  });

  /**
   * Get missing translations
   * GET /api/v1/languages/:lang/missing
   */
  getMissingTranslations = asyncHandler(async (req, res) => {
    const { lang } = req.params;
    const { sourceLang = 'en', namespace = 'common' } = req.query;

    if (!LanguageService.isLanguageSupported(lang) || !LanguageService.isLanguageSupported(sourceLang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const missingKeys = await LanguageService.getMissingTranslations(sourceLang, lang, namespace);

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        sourceLanguage: sourceLang,
        targetLanguage: lang,
        namespace,
        missingKeys,
        missingCount: missingKeys.length
      }
    ));
  });

  /**
   * Export language data
   * GET /api/v1/languages/:lang/export
   */
  exportLanguage = asyncHandler(async (req, res) => {
    const { lang } = req.params;
    const { format = 'json' } = req.query;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    try {
      const exportData = await LanguageService.exportLanguage(lang, format);
      
      if (format === 'json') {
        res.json(formatResponse(
          true,
          await LanguageService.translateWithRequest(req, 'success'),
          exportData
        ));
      } else {
        res.json(formatResponse(
          true,
          await LanguageService.translateWithRequest(req, 'success'),
          { data: exportData }
        ));
      }
    } catch (error) {
      res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        error.message
      ));
    }
  });

  /**
   * Add or update translation (Admin only)
   * POST /api/v1/languages/:lang/translations/:namespace
   */
  addTranslation = asyncHandler(async (req, res) => {
    const { lang, namespace } = req.params;
    const { key, value } = req.body;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const success = await LanguageService.addTranslation(lang, namespace, key, value);

    if (success) {
      res.json(formatResponse(
        true,
        await LanguageService.translateWithRequest(req, 'success'),
        {
          language: lang,
          namespace,
          key,
          value
        }
      ));
    } else {
      res.status(500).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Failed to add translation'
      ));
    }
  });

  /**
   * Remove translation (Admin only)
   * DELETE /api/v1/languages/:lang/translations/:namespace/:key
   */
  removeTranslation = asyncHandler(async (req, res) => {
    const { lang, namespace, key } = req.params;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    const success = await LanguageService.removeTranslation(lang, namespace, key);

    if (success) {
      res.json(formatResponse(
        true,
        await LanguageService.translateWithRequest(req, 'success'),
        {
          language: lang,
          namespace,
          key,
          removed: true
        }
      ));
    } else {
      res.status(500).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Failed to remove translation'
      ));
    }
  });

  /**
   * Import language data (Admin only)
   * POST /api/v1/languages/:lang/import
   */
  importLanguage = asyncHandler(async (req, res) => {
    const { lang } = req.params;
    const { data, format = 'json' } = req.body;

    if (!LanguageService.isLanguageSupported(lang)) {
      return res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Unsupported language'
      ));
    }

    try {
      const result = await LanguageService.importLanguage(lang, data, format);
      
      res.json(formatResponse(
        true,
        await LanguageService.translateWithRequest(req, 'success'),
        result
      ));
    } catch (error) {
      res.status(400).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        error.message
      ));
    }
  });

  /**
   * Initialize language resources (Admin only)
   * POST /api/v1/languages/initialize
   */
  initializeLanguages = asyncHandler(async (req, res) => {
    const success = await LanguageService.initializeLanguages();

    if (success) {
      res.json(formatResponse(
        true,
        await LanguageService.translateWithRequest(req, 'success'),
        { initialized: true }
      ));
    } else {
      res.status(500).json(formatResponse(
        false,
        await LanguageService.translateWithRequest(req, 'error'),
        null,
        'Failed to initialize languages'
      ));
    }
  });

  /**
   * Get RTL languages
   * GET /api/v1/languages/rtl
   */
  getRTLLanguages = asyncHandler(async (req, res) => {
    const rtlLanguages = LanguageService.getRTLLanguages();
    const rtlLanguageInfo = rtlLanguages.map(lang => LanguageService.getLanguage(lang));

    res.json(formatResponse(
      true,
      await LanguageService.translateWithRequest(req, 'success'),
      {
        rtlLanguages: rtlLanguageInfo,
        count: rtlLanguages.length
      }
    ));
  });
}

// Validation middleware
const setLanguageValidation = [
  body('language').isString().isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
  validateRequest
];

const translateKeysValidation = [
  body('keys').isArray().withMessage('Keys must be an array'),
  body('keys.*').isString().withMessage('Each key must be a string'),
  body('language').optional().isString().withMessage('Language must be a string'),
  body('options').optional().isObject().withMessage('Options must be an object'),
  validateRequest
];

const addTranslationValidation = [
  body('key').isString().notEmpty().withMessage('Key is required'),
  body('value').isString().notEmpty().withMessage('Value is required'),
  validateRequest
];

const importLanguageValidation = [
  body('data').notEmpty().withMessage('Data is required'),
  body('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv'),
  validateRequest
];

const paramValidation = [
  param('lang').isString().isLength({ min: 2, max: 5 }).withMessage('Language code must be 2-5 characters'),
  param('namespace').optional().isString().withMessage('Namespace must be a string'),
  param('key').optional().isString().withMessage('Key must be a string'),
  validateRequest
];

module.exports = {
  LanguageController: new LanguageController(),
  setLanguageValidation,
  translateKeysValidation,
  addTranslationValidation,
  importLanguageValidation,
  paramValidation
}; 