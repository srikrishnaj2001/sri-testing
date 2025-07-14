const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { uploadConfig } = require('../config/upload');

class ImageProcessor {
  constructor() {
    this.sharp = sharp;
    this.defaultQuality = 80;
    this.webpQuality = 85;
    this.jpegQuality = 80;
    this.pngQuality = 80;
  }

  /**
   * Process single image with multiple sizes
   * @param {string} inputPath - Input image path
   * @param {string} outputDir - Output directory
   * @param {string} filename - Base filename
   * @param {Object} sizes - Size configurations
   * @returns {Promise<Object>} Processing results
   */
  async processImage(inputPath, outputDir, filename, sizes = {}) {
    try {
      // Ensure output directory exists
      await fs.ensureDir(outputDir);

      // Get image metadata
      const metadata = await this.sharp(inputPath).metadata();
      const results = {
        original: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size
        },
        processed: {}
      };

      // Process each size
      for (const [sizeName, config] of Object.entries(sizes)) {
        const outputPath = path.join(outputDir, `${filename}_${sizeName}.jpg`);
        
        await this.sharp(inputPath)
          .resize(config.width, config.height, {
            fit: 'cover',
            position: 'centre'
          })
          .jpeg({ quality: this.jpegQuality })
          .toFile(outputPath);

        results.processed[sizeName] = {
          path: outputPath,
          width: config.width,
          height: config.height,
          url: `/uploads/${path.relative('uploads', outputPath)}`
        };
      }

      return {
        success: true,
        results
      };

    } catch (error) {
      console.error('Image processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process profile image
   * @param {string} inputPath - Input image path
   * @param {string} outputDir - Output directory
   * @param {string} filename - Base filename
   * @returns {Promise<Object>} Processing results
   */
  async processProfileImage(inputPath, outputDir, filename) {
    const sizes = uploadConfig.imageProcessing.profile;
    return await this.processImage(inputPath, outputDir, filename, sizes);
  }

  /**
   * Process product image
   * @param {string} inputPath - Input image path
   * @param {string} outputDir - Output directory
   * @param {string} filename - Base filename
   * @returns {Promise<Object>} Processing results
   */
  async processProductImage(inputPath, outputDir, filename) {
    const sizes = uploadConfig.imageProcessing.product;
    return await this.processImage(inputPath, outputDir, filename, sizes);
  }

  /**
   * Process category image
   * @param {string} inputPath - Input image path
   * @param {string} outputDir - Output directory
   * @param {string} filename - Base filename
   * @returns {Promise<Object>} Processing results
   */
  async processCategoryImage(inputPath, outputDir, filename) {
    const sizes = uploadConfig.imageProcessing.category;
    return await this.processImage(inputPath, outputDir, filename, sizes);
  }

  /**
   * Process banner image
   * @param {string} inputPath - Input image path
   * @param {string} outputDir - Output directory
   * @param {string} filename - Base filename
   * @returns {Promise<Object>} Processing results
   */
  async processBannerImage(inputPath, outputDir, filename) {
    const sizes = uploadConfig.imageProcessing.banner;
    return await this.processImage(inputPath, outputDir, filename, sizes);
  }

  /**
   * Process logo image
   * @param {string} inputPath - Input image path
   * @param {string} outputDir - Output directory
   * @param {string} filename - Base filename
   * @returns {Promise<Object>} Processing results
   */
  async processLogoImage(inputPath, outputDir, filename) {
    const sizes = uploadConfig.imageProcessing.logo;
    return await this.processImage(inputPath, outputDir, filename, sizes);
  }

  /**
   * Resize image to specific dimensions
   * @param {string} inputPath - Input image path
   * @param {string} outputPath - Output image path
   * @param {number} width - Target width
   * @param {number} height - Target height
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Processing results
   */
  async resizeImage(inputPath, outputPath, width, height, options = {}) {
    try {
      const {
        fit = 'cover',
        position = 'centre',
        quality = this.defaultQuality,
        format = 'jpeg'
      } = options;

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      let pipeline = this.sharp(inputPath)
        .resize(width, height, { fit, position });

      // Apply format-specific settings
      switch (format) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ quality });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: this.webpQuality });
          break;
        default:
          pipeline = pipeline.jpeg({ quality });
      }

      await pipeline.toFile(outputPath);

      const stats = await fs.stat(outputPath);
      
      return {
        success: true,
        output: {
          path: outputPath,
          width,
          height,
          format,
          size: stats.size
        }
      };

    } catch (error) {
      console.error('Image resize error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compress image while maintaining aspect ratio
   * @param {string} inputPath - Input image path
   * @param {string} outputPath - Output image path
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Processing results
   */
  async compressImage(inputPath, outputPath, options = {}) {
    try {
      const {
        quality = this.defaultQuality,
        maxWidth = 1920,
        maxHeight = 1080,
        format = 'jpeg'
      } = options;

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      const metadata = await this.sharp(inputPath).metadata();
      
      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = metadata.width;
      let newHeight = metadata.height;
      
      if (newWidth > maxWidth || newHeight > maxHeight) {
        const aspectRatio = newWidth / newHeight;
        
        if (aspectRatio > 1) {
          // Landscape
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth / aspectRatio);
        } else {
          // Portrait
          newHeight = maxHeight;
          newWidth = Math.round(maxHeight * aspectRatio);
        }
      }

      let pipeline = this.sharp(inputPath);
      
      // Resize if needed
      if (newWidth !== metadata.width || newHeight !== metadata.height) {
        pipeline = pipeline.resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific compression
      switch (format) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, progressive: true });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: this.webpQuality });
          break;
        default:
          pipeline = pipeline.jpeg({ quality, progressive: true });
      }

      await pipeline.toFile(outputPath);

      const originalStats = await fs.stat(inputPath);
      const compressedStats = await fs.stat(outputPath);
      
      return {
        success: true,
        original: {
          width: metadata.width,
          height: metadata.height,
          size: originalStats.size
        },
        compressed: {
          width: newWidth,
          height: newHeight,
          size: compressedStats.size,
          path: outputPath
        },
        compressionRatio: ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(1)
      };

    } catch (error) {
      console.error('Image compression error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create WebP version of image
   * @param {string} inputPath - Input image path
   * @param {string} outputPath - Output WebP path
   * @param {Object} options - WebP options
   * @returns {Promise<Object>} Processing results
   */
  async convertToWebP(inputPath, outputPath, options = {}) {
    try {
      const { quality = this.webpQuality } = options;

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      await this.sharp(inputPath)
        .webp({ quality })
        .toFile(outputPath);

      const originalStats = await fs.stat(inputPath);
      const webpStats = await fs.stat(outputPath);
      
      return {
        success: true,
        original: {
          path: inputPath,
          size: originalStats.size
        },
        webp: {
          path: outputPath,
          size: webpStats.size
        },
        sizeSavings: ((originalStats.size - webpStats.size) / originalStats.size * 100).toFixed(1)
      };

    } catch (error) {
      console.error('WebP conversion error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate thumbnail from image
   * @param {string} inputPath - Input image path
   * @param {string} outputPath - Output thumbnail path
   * @param {Object} options - Thumbnail options
   * @returns {Promise<Object>} Processing results
   */
  async generateThumbnail(inputPath, outputPath, options = {}) {
    const {
      width = 150,
      height = 150,
      quality = this.defaultQuality,
      format = 'jpeg'
    } = options;

    return await this.resizeImage(inputPath, outputPath, width, height, {
      fit: 'cover',
      position: 'centre',
      quality,
      format
    });
  }

  /**
   * Apply watermark to image
   * @param {string} inputPath - Input image path
   * @param {string} watermarkPath - Watermark image path
   * @param {string} outputPath - Output image path
   * @param {Object} options - Watermark options
   * @returns {Promise<Object>} Processing results
   */
  async applyWatermark(inputPath, watermarkPath, outputPath, options = {}) {
    try {
      const {
        position = 'bottom-right',
        opacity = 0.3
      } = options;

      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      const image = this.sharp(inputPath);
      const metadata = await image.metadata();

      // Prepare watermark
      const watermark = await this.sharp(watermarkPath)
        .resize(Math.round(metadata.width * 0.2)) // 20% of image width
        .png()
        .toBuffer();

      // Apply watermark with positioning
      let gravity;
      switch (position) {
        case 'top-left':
          gravity = 'northwest';
          break;
        case 'top-right':
          gravity = 'northeast';
          break;
        case 'bottom-left':
          gravity = 'southwest';
          break;
        case 'bottom-right':
          gravity = 'southeast';
          break;
        case 'center':
          gravity = 'center';
          break;
        default:
          gravity = 'southeast';
      }

      await image
        .composite([{
          input: watermark,
          gravity,
          blend: 'over'
        }])
        .jpeg({ quality: this.jpegQuality })
        .toFile(outputPath);

      return {
        success: true,
        output: {
          path: outputPath,
          watermarkApplied: true,
          position,
          opacity
        }
      };

    } catch (error) {
      console.error('Watermark application error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get image information
   * @param {string} imagePath - Image path
   * @returns {Promise<Object>} Image information
   */
  async getImageInfo(imagePath) {
    try {
      const metadata = await this.sharp(imagePath).metadata();
      const stats = await fs.stat(imagePath);
      
      return {
        success: true,
        info: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: stats.size,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          channels: metadata.channels,
          colorspace: metadata.space
        }
      };

    } catch (error) {
      console.error('Get image info error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch process images
   * @param {Array} imagePaths - Array of image paths
   * @param {Function} processor - Processing function
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Processing results
   */
  async batchProcess(imagePaths, processor, options = {}) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await processor(imagePath, options);
        results.push({
          input: imagePath,
          ...result
        });
      } catch (error) {
        results.push({
          input: imagePath,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Clean up processed images
   * @param {Array} imagePaths - Array of image paths to delete
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupImages(imagePaths) {
    const results = {
      deleted: [],
      failed: [],
      count: 0
    };

    for (const imagePath of imagePaths) {
      try {
        if (await fs.pathExists(imagePath)) {
          await fs.unlink(imagePath);
          results.deleted.push(imagePath);
          results.count++;
        }
      } catch (error) {
        results.failed.push({
          path: imagePath,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Create singleton instance
const imageProcessor = new ImageProcessor();

module.exports = imageProcessor; 