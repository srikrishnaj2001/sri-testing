const fs = require('fs').promises;
const path = require('path');
const LanguageService = require('../services/LanguageService');

/**
 * Utility class for migrating Laravel language files to Node.js JSON format
 */
class LanguageMigration {
  constructor() {
    this.laravelLangPath = path.join(__dirname, '../../Admin panel new install V11.2/resources/lang');
    this.flutterLangPath = path.join(__dirname, '../../User app and web/assets/language');
    this.nodeLangPath = path.join(__dirname, '../locales');
  }

  /**
   * Parse Laravel PHP language file
   * @param {string} filePath - Path to Laravel language file
   * @returns {Promise<Object>} Parsed language data
   */
  async parseLaravelLanguageFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Simple PHP array parser (this is a basic implementation)
      // In production, you might want to use a proper PHP parser
      const arrayMatch = content.match(/return\s+array\s*\(([\s\S]*)\);/);
      if (!arrayMatch) {
        throw new Error('Invalid Laravel language file format');
      }
      
      const arrayContent = arrayMatch[1];
      const translations = {};
      
      // Parse key-value pairs
      const regex = /['"]([^'"]+)['"]\s*=>\s*['"]([^'"]*)['"]/g;
      let match;
      
      while ((match = regex.exec(arrayContent)) !== null) {
        const key = match[1];
        const value = match[2];
        translations[key] = value;
      }
      
      return translations;
    } catch (error) {
      console.error(`Error parsing Laravel language file ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Parse Flutter JSON language file
   * @param {string} filePath - Path to Flutter language file
   * @returns {Promise<Object>} Parsed language data
   */
  async parseFlutterLanguageFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error parsing Flutter language file ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Convert Laravel language files to Node.js JSON format
   * @param {string} langCode - Language code (e.g., 'en', 'ar')
   * @returns {Promise<Object>} Conversion result
   */
  async migrateLaravelLanguage(langCode) {
    const result = {
      language: langCode,
      converted: 0,
      failed: 0,
      files: [],
      errors: []
    };

    try {
      const laravelLangDir = path.join(this.laravelLangPath, langCode);
      
      // Check if Laravel language directory exists
      try {
        await fs.access(laravelLangDir);
      } catch (error) {
        result.errors.push(`Laravel language directory not found: ${laravelLangDir}`);
        return result;
      }

      // Read Laravel language files
      const files = await fs.readdir(laravelLangDir);
      const phpFiles = files.filter(file => file.endsWith('.php'));

      for (const file of phpFiles) {
        const filePath = path.join(laravelLangDir, file);
        const namespace = path.basename(file, '.php');
        
        try {
          const translations = await this.parseLaravelLanguageFile(filePath);
          
          if (Object.keys(translations).length > 0) {
            // Save to Node.js locales directory
            const success = await LanguageService.saveLanguageFile(langCode, namespace, translations);
            
            if (success) {
              result.converted++;
              result.files.push({
                file: file,
                namespace: namespace,
                keys: Object.keys(translations).length
              });
            } else {
              result.failed++;
              result.errors.push(`Failed to save ${namespace} translations`);
            }
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error processing ${file}: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Migration error: ${error.message}`);
      return result;
    }
  }

  /**
   * Convert Flutter language files to Node.js JSON format
   * @param {string} langCode - Language code (e.g., 'en', 'ar')
   * @returns {Promise<Object>} Conversion result
   */
  async migrateFlutterLanguage(langCode) {
    const result = {
      language: langCode,
      converted: 0,
      failed: 0,
      files: [],
      errors: []
    };

    try {
      const flutterLangFile = path.join(this.flutterLangPath, `${langCode}.json`);
      
      // Check if Flutter language file exists
      try {
        await fs.access(flutterLangFile);
      } catch (error) {
        result.errors.push(`Flutter language file not found: ${flutterLangFile}`);
        return result;
      }

      // Parse Flutter language file
      const translations = await this.parseFlutterLanguageFile(flutterLangFile);
      
      if (Object.keys(translations).length > 0) {
        // Group translations by namespace based on key prefixes
        const namespaceGroups = this.groupTranslationsByNamespace(translations);
        
        for (const namespace in namespaceGroups) {
          const namespaceTranslations = namespaceGroups[namespace];
          
          try {
            const success = await LanguageService.saveLanguageFile(langCode, namespace, namespaceTranslations);
            
            if (success) {
              result.converted++;
              result.files.push({
                file: `${langCode}.json`,
                namespace: namespace,
                keys: Object.keys(namespaceTranslations).length
              });
            } else {
              result.failed++;
              result.errors.push(`Failed to save ${namespace} translations`);
            }
          } catch (error) {
            result.failed++;
            result.errors.push(`Error processing ${namespace}: ${error.message}`);
          }
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Migration error: ${error.message}`);
      return result;
    }
  }

  /**
   * Group translations by namespace based on key patterns
   * @param {Object} translations - Flat translations object
   * @returns {Object} Grouped translations
   */
  groupTranslationsByNamespace(translations) {
    const groups = {
      common: {},
      auth: {},
      orders: {},
      products: {},
      messages: {},
      validation: {}
    };

    // Define key patterns for each namespace
    const patterns = {
      auth: /^(login|logout|register|signup|signin|password|email|verify|forgot|reset|otp|token)/i,
      orders: /^(order|cart|checkout|delivery|payment|track|history|cancel|place|confirm)/i,
      products: /^(product|item|category|menu|addons|price|quantity|add_to_cart|buy|search|filter)/i,
      messages: /^(success|error|failed|warning|info|sent|received|message|notification|alert)/i,
      validation: /^(required|invalid|minimum|maximum|email|phone|password|confirm|match|length)/i
    };

    for (const [key, value] of Object.entries(translations)) {
      let assigned = false;

      // Check each pattern
      for (const [namespace, pattern] of Object.entries(patterns)) {
        if (pattern.test(key)) {
          groups[namespace][key] = value;
          assigned = true;
          break;
        }
      }

      // If no pattern matches, add to common
      if (!assigned) {
        groups.common[key] = value;
      }
    }

    // Remove empty groups
    Object.keys(groups).forEach(namespace => {
      if (Object.keys(groups[namespace]).length === 0) {
        delete groups[namespace];
      }
    });

    return groups;
  }

  /**
   * Migrate all supported languages
   * @returns {Promise<Object>} Migration result
   */
  async migrateAllLanguages() {
    const result = {
      total: 0,
      successful: 0,
      failed: 0,
      languages: [],
      errors: []
    };

    const supportedLanguages = Object.keys(LanguageService.getSupportedLanguages());

    for (const langCode of supportedLanguages) {
      result.total++;
      
      try {
        // Try Laravel migration first
        const laravelResult = await this.migrateLaravelLanguage(langCode);
        
        // Try Flutter migration
        const flutterResult = await this.migrateFlutterLanguage(langCode);
        
        // Combine results
        const combined = {
          language: langCode,
          laravel: laravelResult,
          flutter: flutterResult,
          totalConverted: laravelResult.converted + flutterResult.converted,
          totalFailed: laravelResult.failed + flutterResult.failed,
          totalErrors: [...laravelResult.errors, ...flutterResult.errors]
        };

        result.languages.push(combined);
        
        if (combined.totalConverted > 0) {
          result.successful++;
        } else {
          result.failed++;
        }
        
        result.errors.push(...combined.totalErrors);
      } catch (error) {
        result.failed++;
        result.errors.push(`Error migrating ${langCode}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Generate translation template for a new language
   * @param {string} langCode - Language code
   * @param {string} baseLang - Base language to copy from (default: 'en')
   * @returns {Promise<Object>} Generation result
   */
  async generateLanguageTemplate(langCode, baseLang = 'en') {
    const result = {
      language: langCode,
      baseLanguage: baseLang,
      generated: 0,
      failed: 0,
      files: [],
      errors: []
    };

    try {
      const baseTranslations = await LanguageService.getAllTranslations(baseLang);
      
      for (const namespace in baseTranslations) {
        const baseData = baseTranslations[namespace];
        const templateData = {};
        
        // Create empty template with same keys
        for (const key in baseData) {
          templateData[key] = ''; // Empty string for translation
        }
        
        const success = await LanguageService.saveLanguageFile(langCode, namespace, templateData);
        
        if (success) {
          result.generated++;
          result.files.push({
            namespace: namespace,
            keys: Object.keys(templateData).length
          });
        } else {
          result.failed++;
          result.errors.push(`Failed to generate ${namespace} template`);
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Template generation error: ${error.message}`);
      return result;
    }
  }

  /**
   * Validate all language files
   * @returns {Promise<Object>} Validation result
   */
  async validateAllLanguages() {
    const result = {
      languages: [],
      issues: [],
      totalIssues: 0
    };

    const supportedLanguages = Object.keys(LanguageService.getSupportedLanguages());

    for (const langCode of supportedLanguages) {
      const langResult = {
        language: langCode,
        namespaces: {},
        issues: [],
        totalKeys: 0,
        emptyKeys: 0
      };

      try {
        const translations = await LanguageService.getAllTranslations(langCode);
        
        for (const namespace in translations) {
          const namespaceData = translations[namespace];
          const namespaceResult = {
            totalKeys: Object.keys(namespaceData).length,
            emptyKeys: 0,
            issues: []
          };

          for (const [key, value] of Object.entries(namespaceData)) {
            if (!value || value.trim() === '') {
              namespaceResult.emptyKeys++;
              namespaceResult.issues.push(`Empty translation for key: ${key}`);
            }
          }

          langResult.namespaces[namespace] = namespaceResult;
          langResult.totalKeys += namespaceResult.totalKeys;
          langResult.emptyKeys += namespaceResult.emptyKeys;
          langResult.issues.push(...namespaceResult.issues);
        }

        result.languages.push(langResult);
        result.issues.push(...langResult.issues);
        result.totalIssues += langResult.issues.length;
      } catch (error) {
        langResult.issues.push(`Error validating ${langCode}: ${error.message}`);
        result.languages.push(langResult);
        result.issues.push(...langResult.issues);
        result.totalIssues += langResult.issues.length;
      }
    }

    return result;
  }
}

module.exports = new LanguageMigration(); 