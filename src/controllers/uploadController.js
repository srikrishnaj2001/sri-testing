const path = require('path');
const fs = require('fs-extra');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const { getFileInfo, getFileUrl, deleteFile } = require('../config/upload');
const imageProcessor = require('../utils/imageProcessor');

class UploadController {
  // Upload profile image
  async uploadProfileImage(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.file) {
        return generateErrorResponse(res, 400, 'No file uploaded');
      }

      const file = req.file;
      const fileInfo = getFileInfo(file.path);
      
      // Process image into multiple sizes
      const baseFilename = path.parse(file.filename).name;
      const processingResult = await imageProcessor.processProfileImage(
        file.path,
        path.dirname(file.path),
        baseFilename
      );

      if (!processingResult.success) {
        // Clean up original file
        await deleteFile(file.path);
        return generateErrorResponse(res, 500, 'Failed to process image', processingResult.error);
      }

      // Clean up original file
      await deleteFile(file.path);

      const response = {
        file: {
          original_name: file.originalname,
          filename: file.filename,
          size: fileInfo.size,
          mime_type: fileInfo.mimeType,
          upload_type: 'profile_image',
          uploaded_by: userId,
          uploaded_at: new Date()
        },
        processed: processingResult.results.processed,
        urls: {}
      };

      // Generate URLs for each processed size
      for (const [size, data] of Object.entries(processingResult.results.processed)) {
        response.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
      }

      return generateResponse(res, 200, 'Profile image uploaded successfully', response);

    } catch (error) {
      console.error('Upload profile image error:', error);
      
      // Clean up file if upload failed
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload profile image', error.message);
    }
  }

  // Upload product image
  async uploadProductImage(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.file) {
        return generateErrorResponse(res, 400, 'No file uploaded');
      }

      const file = req.file;
      const fileInfo = getFileInfo(file.path);
      
      // Process image into multiple sizes
      const baseFilename = path.parse(file.filename).name;
      const processingResult = await imageProcessor.processProductImage(
        file.path,
        path.dirname(file.path),
        baseFilename
      );

      if (!processingResult.success) {
        await deleteFile(file.path);
        return generateErrorResponse(res, 500, 'Failed to process image', processingResult.error);
      }

      // Clean up original file
      await deleteFile(file.path);

      const response = {
        file: {
          original_name: file.originalname,
          filename: file.filename,
          size: fileInfo.size,
          mime_type: fileInfo.mimeType,
          upload_type: 'product_image',
          uploaded_by: userId,
          uploaded_at: new Date()
        },
        processed: processingResult.results.processed,
        urls: {}
      };

      // Generate URLs for each processed size
      for (const [size, data] of Object.entries(processingResult.results.processed)) {
        response.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
      }

      return generateResponse(res, 200, 'Product image uploaded successfully', response);

    } catch (error) {
      console.error('Upload product image error:', error);
      
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload product image', error.message);
    }
  }

  // Upload category image
  async uploadCategoryImage(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.file) {
        return generateErrorResponse(res, 400, 'No file uploaded');
      }

      const file = req.file;
      const fileInfo = getFileInfo(file.path);
      
      // Process image into multiple sizes
      const baseFilename = path.parse(file.filename).name;
      const processingResult = await imageProcessor.processCategoryImage(
        file.path,
        path.dirname(file.path),
        baseFilename
      );

      if (!processingResult.success) {
        await deleteFile(file.path);
        return generateErrorResponse(res, 500, 'Failed to process image', processingResult.error);
      }

      // Clean up original file
      await deleteFile(file.path);

      const response = {
        file: {
          original_name: file.originalname,
          filename: file.filename,
          size: fileInfo.size,
          mime_type: fileInfo.mimeType,
          upload_type: 'category_image',
          uploaded_by: userId,
          uploaded_at: new Date()
        },
        processed: processingResult.results.processed,
        urls: {}
      };

      // Generate URLs for each processed size
      for (const [size, data] of Object.entries(processingResult.results.processed)) {
        response.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
      }

      return generateResponse(res, 200, 'Category image uploaded successfully', response);

    } catch (error) {
      console.error('Upload category image error:', error);
      
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload category image', error.message);
    }
  }

  // Upload banner image
  async uploadBannerImage(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.file) {
        return generateErrorResponse(res, 400, 'No file uploaded');
      }

      const file = req.file;
      const fileInfo = getFileInfo(file.path);
      
      // Process image into multiple sizes
      const baseFilename = path.parse(file.filename).name;
      const processingResult = await imageProcessor.processBannerImage(
        file.path,
        path.dirname(file.path),
        baseFilename
      );

      if (!processingResult.success) {
        await deleteFile(file.path);
        return generateErrorResponse(res, 500, 'Failed to process image', processingResult.error);
      }

      // Clean up original file
      await deleteFile(file.path);

      const response = {
        file: {
          original_name: file.originalname,
          filename: file.filename,
          size: fileInfo.size,
          mime_type: fileInfo.mimeType,
          upload_type: 'banner_image',
          uploaded_by: userId,
          uploaded_at: new Date()
        },
        processed: processingResult.results.processed,
        urls: {}
      };

      // Generate URLs for each processed size
      for (const [size, data] of Object.entries(processingResult.results.processed)) {
        response.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
      }

      return generateResponse(res, 200, 'Banner image uploaded successfully', response);

    } catch (error) {
      console.error('Upload banner image error:', error);
      
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload banner image', error.message);
    }
  }

  // Upload logo
  async uploadLogo(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.file) {
        return generateErrorResponse(res, 400, 'No file uploaded');
      }

      const file = req.file;
      const fileInfo = getFileInfo(file.path);
      
      // Process logo image
      const baseFilename = path.parse(file.filename).name;
      const processingResult = await imageProcessor.processLogo(
        file.path,
        path.dirname(file.path),
        baseFilename
      );

      if (!processingResult.success) {
        await deleteFile(file.path);
        return generateErrorResponse(res, 500, 'Failed to process logo', processingResult.error);
      }

      // Clean up original file
      await deleteFile(file.path);

      const response = {
        file: {
          original_name: file.originalname,
          filename: file.filename,
          size: fileInfo.size,
          mime_type: fileInfo.mimeType,
          upload_type: 'logo',
          uploaded_by: userId,
          uploaded_at: new Date()
        },
        processed: processingResult.results.processed,
        urls: {}
      };

      // Generate URLs for each processed size
      for (const [size, data] of Object.entries(processingResult.results.processed)) {
        response.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
      }

      return generateResponse(res, 200, 'Logo uploaded successfully', response);

    } catch (error) {
      console.error('Upload logo error:', error);
      
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload logo', error.message);
    }
  }

  // Upload document
  async uploadDocument(req, res) {
    try {
      const { userId } = req.user;
      const { document_type } = req.body;
      
      if (!req.file) {
        return generateErrorResponse(res, 400, 'No file uploaded');
      }

      if (!document_type) {
        return generateErrorResponse(res, 400, 'Document type is required');
      }

      const file = req.file;
      const fileInfo = getFileInfo(file.path);
      
      const response = {
        file: {
          original_name: file.originalname,
          filename: file.filename,
          size: fileInfo.size,
          mime_type: fileInfo.mimeType,
          upload_type: 'document',
          document_type,
          uploaded_by: userId,
          uploaded_at: new Date()
        },
        url: getFileUrl(file.path, `${req.protocol}://${req.get('host')}`)
      };

      return generateResponse(res, 200, 'Document uploaded successfully', response);

    } catch (error) {
      console.error('Upload document error:', error);
      
      if (req.file) {
        await deleteFile(req.file.path);
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload document', error.message);
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(req, res) {
    try {
      const { userId } = req.user;
      const { upload_type = 'gallery' } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return generateErrorResponse(res, 400, 'No files uploaded');
      }

      const files = req.files;
      const uploadResults = [];
      const errors = [];

      for (const file of files) {
        try {
          const fileInfo = getFileInfo(file.path);
          
          let processingResult = null;
          
          // Process based on upload type
          if (upload_type === 'gallery') {
            const baseFilename = path.parse(file.filename).name;
            processingResult = await imageProcessor.processGalleryImage(
              file.path,
              path.dirname(file.path),
              baseFilename
            );
          }

          const result = {
            file: {
              original_name: file.originalname,
              filename: file.filename,
              size: fileInfo.size,
              mime_type: fileInfo.mimeType,
              upload_type,
              uploaded_by: userId,
              uploaded_at: new Date()
            },
            url: getFileUrl(file.path, `${req.protocol}://${req.get('host')}`)
          };

          if (processingResult && processingResult.success) {
            result.processed = processingResult.results.processed;
            result.urls = {};
            
            // Generate URLs for each processed size
            for (const [size, data] of Object.entries(processingResult.results.processed)) {
              result.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
            }
            
            // Clean up original file
            await deleteFile(file.path);
          }

          uploadResults.push(result);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
          
          // Clean up failed file
          await deleteFile(file.path);
        }
      }

      return generateResponse(res, 200, 'Files uploaded successfully', {
        uploaded: uploadResults,
        errors: errors.length > 0 ? errors : undefined,
        total: files.length,
        success: uploadResults.length,
        failed: errors.length
      });

    } catch (error) {
      console.error('Upload multiple files error:', error);
      
      // Clean up all files on error
      if (req.files) {
        for (const file of req.files) {
          await deleteFile(file.path);
        }
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload files', error.message);
    }
  }

  // Upload gallery images
  async uploadGalleryImages(req, res) {
    try {
      const { userId } = req.user;
      
      if (!req.files || req.files.length === 0) {
        return generateErrorResponse(res, 400, 'No files uploaded');
      }

      const files = req.files;
      const uploadResults = [];
      const errors = [];

      for (const file of files) {
        try {
          const fileInfo = getFileInfo(file.path);
          
          // Process gallery image
          const baseFilename = path.parse(file.filename).name;
          const processingResult = await imageProcessor.processGalleryImage(
            file.path,
            path.dirname(file.path),
            baseFilename
          );

          if (!processingResult.success) {
            errors.push({
              filename: file.originalname,
              error: processingResult.error
            });
            await deleteFile(file.path);
            continue;
          }

          // Clean up original file
          await deleteFile(file.path);

          const result = {
            file: {
              original_name: file.originalname,
              filename: file.filename,
              size: fileInfo.size,
              mime_type: fileInfo.mimeType,
              upload_type: 'gallery',
              uploaded_by: userId,
              uploaded_at: new Date()
            },
            processed: processingResult.results.processed,
            urls: {}
          };

          // Generate URLs for each processed size
          for (const [size, data] of Object.entries(processingResult.results.processed)) {
            result.urls[size] = getFileUrl(data.path, `${req.protocol}://${req.get('host')}`);
          }

          uploadResults.push(result);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
          
          // Clean up failed file
          await deleteFile(file.path);
        }
      }

      return generateResponse(res, 200, 'Gallery images uploaded successfully', {
        uploaded: uploadResults,
        errors: errors.length > 0 ? errors : undefined,
        total: files.length,
        success: uploadResults.length,
        failed: errors.length
      });

    } catch (error) {
      console.error('Upload gallery images error:', error);
      
      // Clean up all files on error
      if (req.files) {
        for (const file of req.files) {
          await deleteFile(file.path);
        }
      }
      
      return generateErrorResponse(res, 500, 'Failed to upload gallery images', error.message);
    }
  }

  // Delete file
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return generateErrorResponse(res, 400, 'Filename is required');
      }

      const success = await deleteFile(filename);
      
      if (success) {
        return generateResponse(res, 200, 'File deleted successfully');
      } else {
        return generateErrorResponse(res, 404, 'File not found');
      }

    } catch (error) {
      console.error('Delete file error:', error);
      return generateErrorResponse(res, 500, 'Failed to delete file', error.message);
    }
  }

  // Get file info
  async getFileInfo(req, res) {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return generateErrorResponse(res, 400, 'Filename is required');
      }

      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return generateErrorResponse(res, 404, 'File not found');
      }

      const fileInfo = getFileInfo(filePath);
      const fileUrl = getFileUrl(filePath, `${req.protocol}://${req.get('host')}`);

      return generateResponse(res, 200, 'File info retrieved successfully', {
        ...fileInfo,
        url: fileUrl
      });

    } catch (error) {
      console.error('Get file info error:', error);
      return generateErrorResponse(res, 500, 'Failed to get file info', error.message);
    }
  }

  // Compress image
  async compressImage(req, res) {
    try {
      const { filename } = req.params;
      const { quality = 80 } = req.body;
      
      if (!filename) {
        return generateErrorResponse(res, 400, 'Filename is required');
      }

      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return generateErrorResponse(res, 404, 'File not found');
      }

      const compressedPath = await imageProcessor.compressImage(filePath, quality);
      
      if (!compressedPath) {
        return generateErrorResponse(res, 500, 'Failed to compress image');
      }

      const fileInfo = getFileInfo(compressedPath);
      const fileUrl = getFileUrl(compressedPath, `${req.protocol}://${req.get('host')}`);

      return generateResponse(res, 200, 'Image compressed successfully', {
        original_file: filename,
        compressed_file: path.basename(compressedPath),
        size: fileInfo.size,
        url: fileUrl
      });

    } catch (error) {
      console.error('Compress image error:', error);
      return generateErrorResponse(res, 500, 'Failed to compress image', error.message);
    }
  }

  // Convert to WebP
  async convertToWebP(req, res) {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return generateErrorResponse(res, 400, 'Filename is required');
      }

      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        return generateErrorResponse(res, 404, 'File not found');
      }

      const webpPath = await imageProcessor.convertToWebP(filePath);
      
      if (!webpPath) {
        return generateErrorResponse(res, 500, 'Failed to convert to WebP');
      }

      const fileInfo = getFileInfo(webpPath);
      const fileUrl = getFileUrl(webpPath, `${req.protocol}://${req.get('host')}`);

      return generateResponse(res, 200, 'Image converted to WebP successfully', {
        original_file: filename,
        webp_file: path.basename(webpPath),
        size: fileInfo.size,
        url: fileUrl
      });

    } catch (error) {
      console.error('Convert to WebP error:', error);
      return generateErrorResponse(res, 500, 'Failed to convert to WebP', error.message);
    }
  }
}

module.exports = new UploadController(); 