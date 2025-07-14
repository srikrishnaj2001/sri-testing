const fs = require('fs').promises;
const path = require('path');
const { i18next } = require('../config/i18n');

class LanguageService {
  constructor() {
    this.supportedLanguages = {
      en: { name: 'English', nativeName: 'English', code: 'en', flag: '🇺🇸', rtl: false },
      ar: { name: 'Arabic', nativeName: 'العربية', code: 'ar', flag: '🇸🇦', rtl: true },
      bn: { name: 'Bengali', nativeName: 'বাংলা', code: 'bn', flag: '🇧🇩', rtl: false },
      es: { name: 'Spanish', nativeName: 'Español', code: 'es', flag: '🇪🇸', rtl: false },
      fr: { name: 'French', nativeName: 'Français', code: 'fr', flag: '🇫🇷', rtl: false }
    };
    
    this.defaultLanguage = 'en';
    this.localesPath = path.join(__dirname, '../locales');
    this.namespaces = ['common', 'messages', 'validation', 'auth', 'orders', 'products'];
  }

  /**
   * Get all supported languages
   * @returns {Object} Supported languages with metadata
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Get language by code
   * @param {string} langCode - Language code
   * @returns {Object|null} Language object or null if not found
   */
  getLanguage(langCode) {
    return this.supportedLanguages[langCode] || null;
  }

  /**
   * Check if a language is supported
   * @param {string} langCode - Language code
   * @returns {boolean} True if supported
   */
  isLanguageSupported(langCode) {
    return langCode in this.supportedLanguages;
  }

  /**
   * Get user's preferred language from request
   * @param {Object} req - Express request object
   * @returns {string} Language code
   */
  getUserLanguage(req) {
    // 1. Check X-Language header
    const headerLang = req.headers['x-language'] || req.headers['accept-language'];
    if (headerLang && this.isLanguageSupported(headerLang)) {
      return headerLang;
    }

    // 2. Check user's saved language preference
    if (req.user && req.user.language_code && this.isLanguageSupported(req.user.language_code)) {
      return req.user.language_code;
    }

    // 3. Check session language
    if (req.session && req.session.language && this.isLanguageSupported(req.session.language)) {
      return req.session.language;
    }

    // 4. Parse Accept-Language header
    if (headerLang) {
      const languages = headerLang.split(',').map(lang => lang.split(';')[0].trim());
      for (const lang of languages) {
        if (this.isLanguageSupported(lang)) {
          return lang;
        }
        // Check for base language (e.g., 'en' from 'en-US')
        const baseLang = lang.split('-')[0];
        if (this.isLanguageSupported(baseLang)) {
          return baseLang;
        }
      }
    }

    // 5. Default to English
    return this.defaultLanguage;
  }

  /**
   * Set user's language preference
   * @param {Object} req - Express request object
   * @param {string} langCode - Language code
   * @returns {boolean} True if successful
   */
  setUserLanguage(req, langCode) {
    if (!this.isLanguageSupported(langCode)) {
      return false;
    }

    // Set in session
    if (req.session) {
      req.session.language = langCode;
    }

    // Update i18next language
    i18next.changeLanguage(langCode);

    return true;
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @param {string} langCode - Language code
   * @param {Object} options - Interpolation options
   * @returns {Promise<string>} Translated text
   */
  async translate(key, langCode = this.defaultLanguage, options = {}) {
    try {
      // Change language if needed
      if (i18next.language !== langCode) {
        await i18next.changeLanguage(langCode);
      }

      return i18next.t(key, options);
    } catch (error) {
      console.error(`Translation error for key "${key}" in language "${langCode}":`, error);
      return key; // Return the key if translation fails
    }
  }

  /**
   * Get translation with request context
   * @param {Object} req - Express request object
   * @param {string} key - Translation key
   * @param {Object} options - Interpolation options
   * @returns {Promise<string>} Translated text
   */
  async translateWithRequest(req, key, options = {}) {
    const langCode = this.getUserLanguage(req);
    return await this.translate(key, langCode, options);
  }

  /**
   * Get multiple translations
   * @param {Array} keys - Array of translation keys
   * @param {string} langCode - Language code
   * @param {Object} options - Interpolation options
   * @returns {Promise<Object>} Object with translated keys
   */
  async bulkTranslate(keys, langCode = this.defaultLanguage, options = {}) {
    const translations = {};
    
    try {
      // Change language if needed
      if (i18next.language !== langCode) {
        await i18next.changeLanguage(langCode);
      }

      for (const key of keys) {
        translations[key] = i18next.t(key, options[key] || {});
      }
    } catch (error) {
      console.error(`Bulk translation error in language "${langCode}":`, error);
      // Return keys as fallback
      keys.forEach(key => translations[key] = key);
    }

    return translations;
  }

  /**
   * Load language file
   * @param {string} langCode - Language code
   * @param {string} namespace - Namespace (e.g., 'common', 'messages')
   * @returns {Promise<Object>} Language data
   */
  async loadLanguageFile(langCode, namespace = 'common') {
    try {
      const filePath = path.join(this.localesPath, langCode, `${namespace}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading language file ${langCode}/${namespace}:`, error);
      return {};
    }
  }

  /**
   * Save language file
   * @param {string} langCode - Language code
   * @param {string} namespace - Namespace
   * @param {Object} data - Language data
   * @returns {Promise<boolean>} True if successful
   */
  async saveLanguageFile(langCode, namespace, data) {
    try {
      const langDir = path.join(this.localesPath, langCode);
      
      // Create directory if it doesn't exist
      try {
        await fs.access(langDir);
      } catch (error) {
        await fs.mkdir(langDir, { recursive: true });
      }

      const filePath = path.join(langDir, `${namespace}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      console.error(`Error saving language file ${langCode}/${namespace}:`, error);
      return false;
    }
  }

  /**
   * Add or update translation
   * @param {string} langCode - Language code
   * @param {string} namespace - Namespace
   * @param {string} key - Translation key
   * @param {string} value - Translation value
   * @returns {Promise<boolean>} True if successful
   */
  async addTranslation(langCode, namespace, key, value) {
    try {
      const data = await this.loadLanguageFile(langCode, namespace);
      data[key] = value;
      return await this.saveLanguageFile(langCode, namespace, data);
    } catch (error) {
      console.error(`Error adding translation ${key} for ${langCode}/${namespace}:`, error);
      return false;
    }
  }

  /**
   * Remove translation
   * @param {string} langCode - Language code
   * @param {string} namespace - Namespace
   * @param {string} key - Translation key
   * @returns {Promise<boolean>} True if successful
   */
  async removeTranslation(langCode, namespace, key) {
    try {
      const data = await this.loadLanguageFile(langCode, namespace);
      if (key in data) {
        delete data[key];
        return await this.saveLanguageFile(langCode, namespace, data);
      }
      return true;
    } catch (error) {
      console.error(`Error removing translation ${key} for ${langCode}/${namespace}:`, error);
      return false;
    }
  }

  /**
   * Get all translations for a language
   * @param {string} langCode - Language code
   * @returns {Promise<Object>} All translations grouped by namespace
   */
  async getAllTranslations(langCode) {
    const translations = {};
    
    for (const namespace of this.namespaces) {
      translations[namespace] = await this.loadLanguageFile(langCode, namespace);
    }

    return translations;
  }

  /**
   * Get missing translations
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @param {string} namespace - Namespace
   * @returns {Promise<Array>} Array of missing keys
   */
  async getMissingTranslations(sourceLang, targetLang, namespace = 'common') {
    const sourceData = await this.loadLanguageFile(sourceLang, namespace);
    const targetData = await this.loadLanguageFile(targetLang, namespace);
    
    const missingKeys = [];
    for (const key in sourceData) {
      if (!(key in targetData)) {
        missingKeys.push(key);
      }
    }
    
    return missingKeys;
  }

  /**
   * Get language statistics
   * @param {string} langCode - Language code
   * @returns {Promise<Object>} Language statistics
   */
  async getLanguageStats(langCode) {
    const stats = {
      language: this.getLanguage(langCode),
      namespaces: {}
    };

    let totalKeys = 0;
    let totalTranslated = 0;

    for (const namespace of this.namespaces) {
      const data = await this.loadLanguageFile(langCode, namespace);
      const keys = Object.keys(data);
      const translated = keys.filter(key => data[key] && data[key].trim() !== '');
      
      stats.namespaces[namespace] = {
        totalKeys: keys.length,
        translatedKeys: translated.length,
        completionPercentage: keys.length > 0 ? Math.round((translated.length / keys.length) * 100) : 0
      };

      totalKeys += keys.length;
      totalTranslated += translated.length;
    }

    stats.overall = {
      totalKeys,
      translatedKeys: totalTranslated,
      completionPercentage: totalKeys > 0 ? Math.round((totalTranslated / totalKeys) * 100) : 0
    };

    return stats;
  }

  /**
   * Export language data
   * @param {string} langCode - Language code
   * @param {string} format - Export format ('json', 'csv', 'xlsx')
   * @returns {Promise<Object>} Export data
   */
  async exportLanguage(langCode, format = 'json') {
    const translations = await this.getAllTranslations(langCode);
    
    switch (format) {
      case 'json':
        return {
          language: langCode,
          data: translations,
          exported_at: new Date().toISOString()
        };
      
      case 'csv':
        const csvData = [];
        for (const namespace in translations) {
          for (const key in translations[namespace]) {
            csvData.push({
              namespace,
              key,
              value: translations[namespace][key]
            });
          }
        }
        return csvData;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import language data
   * @param {string} langCode - Language code
   * @param {Object} data - Import data
   * @param {string} format - Import format
   * @returns {Promise<Object>} Import result
   */
  async importLanguage(langCode, data, format = 'json') {
    const result = {
      imported: 0,
      failed: 0,
      errors: []
    };

    try {
      switch (format) {
        case 'json':
          for (const namespace in data) {
            if (this.namespaces.includes(namespace)) {
              const success = await this.saveLanguageFile(langCode, namespace, data[namespace]);
              if (success) {
                result.imported += Object.keys(data[namespace]).length;
              } else {
                result.failed++;
                result.errors.push(`Failed to import namespace: ${namespace}`);
              }
            }
          }
          break;
        
        case 'csv':
          const groupedData = {};
          for (const item of data) {
            if (!groupedData[item.namespace]) {
              groupedData[item.namespace] = {};
            }
            groupedData[item.namespace][item.key] = item.value;
          }
          
          for (const namespace in groupedData) {
            if (this.namespaces.includes(namespace)) {
              const success = await this.saveLanguageFile(langCode, namespace, groupedData[namespace]);
              if (success) {
                result.imported += Object.keys(groupedData[namespace]).length;
              } else {
                result.failed++;
                result.errors.push(`Failed to import namespace: ${namespace}`);
              }
            }
          }
          break;
        
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Initialize language resources
   * @returns {Promise<boolean>} True if successful
   */
  async initializeLanguages() {
    try {
      // Ensure locales directory exists
      try {
        await fs.access(this.localesPath);
      } catch (error) {
        await fs.mkdir(this.localesPath, { recursive: true });
      }

      // Create default language files if they don't exist
      for (const langCode of Object.keys(this.supportedLanguages)) {
        const langDir = path.join(this.localesPath, langCode);
        
        try {
          await fs.access(langDir);
        } catch (error) {
          await fs.mkdir(langDir, { recursive: true });
        }

        // Create default namespace files
        for (const namespace of this.namespaces) {
          const filePath = path.join(langDir, `${namespace}.json`);
          
          try {
            await fs.access(filePath);
          } catch (error) {
            // File doesn't exist, create it with empty object
            await fs.writeFile(filePath, '{}', 'utf8');
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error initializing languages:', error);
      return false;
    }
  }

  /**
   * Get RTL (Right-to-Left) languages
   * @returns {Array} Array of RTL language codes
   */
  getRTLLanguages() {
    return Object.keys(this.supportedLanguages).filter(
      lang => this.supportedLanguages[lang].rtl
    );
  }

  /**
   * Check if a language is RTL
   * @param {string} langCode - Language code
   * @returns {boolean} True if RTL
   */
  isRTL(langCode) {
    const lang = this.getLanguage(langCode);
    return lang ? lang.rtl : false;
  }
}

module.exports = new LanguageService(); 