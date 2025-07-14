const express = require('express');
const router = express.Router();
const { 
  LanguageController,
  setLanguageValidation,
  translateKeysValidation,
  addTranslationValidation,
  importLanguageValidation,
  paramValidation
} = require('../../controllers/languageController');
const { authenticate } = require('../../middleware/auth');
const { requireAnyRole } = require('../../middleware/roleAuth');

// Public routes (no authentication required)
router.get('/', LanguageController.getSupportedLanguages);
router.get('/rtl', LanguageController.getRTLLanguages);
router.get('/:lang/translations/:namespace', paramValidation, LanguageController.getTranslations);
router.get('/:lang/translations', paramValidation, LanguageController.getAllTranslations);
router.post('/translate', translateKeysValidation, LanguageController.translateKeys);

// User routes (authentication required)
router.use(authenticate); // All routes below require authentication

router.get('/current', LanguageController.getCurrentLanguage);
router.post('/set', setLanguageValidation, LanguageController.setLanguage);
router.get('/:lang/stats', paramValidation, LanguageController.getLanguageStats);
router.get('/:lang/missing', paramValidation, LanguageController.getMissingTranslations);
router.get('/:lang/export', paramValidation, LanguageController.exportLanguage);

// Admin routes (admin role required)
router.use(requireAnyRole(['SUPER_ADMIN', 'ADMIN'])); // All routes below require admin role

router.post('/initialize', LanguageController.initializeLanguages);
router.post('/:lang/translations/:namespace', 
  paramValidation, 
  addTranslationValidation, 
  LanguageController.addTranslation
);
router.delete('/:lang/translations/:namespace/:key', 
  paramValidation, 
  LanguageController.removeTranslation
);
router.post('/:lang/import', 
  paramValidation, 
  importLanguageValidation, 
  LanguageController.importLanguage
);

module.exports = router; 