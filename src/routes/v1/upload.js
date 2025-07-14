const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../config/clerk');
const { uploadConfigs } = require('../../config/upload');
const uploadController = require('../../controllers/uploadController');

// ===================
// IMAGE UPLOAD ROUTES
// ===================

// Upload profile image
router.post('/profile-image', 
  requireAuth, 
  uploadConfigs.profileImage.single('image'), 
  uploadController.uploadProfileImage
);

// Upload product image
router.post('/product-image', 
  requireAuth, 
  uploadConfigs.productImage.single('image'), 
  uploadController.uploadProductImage
);

// Upload category image
router.post('/category-image', 
  requireAuth, 
  uploadConfigs.categoryImage.single('image'), 
  uploadController.uploadCategoryImage
);

// Upload banner image
router.post('/banner-image', 
  requireAuth, 
  uploadConfigs.bannerImage.single('image'), 
  uploadController.uploadBannerImage
);

// Upload logo
router.post('/logo', 
  requireAuth, 
  uploadConfigs.logo.single('image'), 
  uploadController.uploadLogo
);

// Upload gallery images (multiple)
router.post('/gallery', 
  requireAuth, 
  uploadConfigs.gallery.array('images', 10), 
  uploadController.uploadGalleryImages
);

// ===================
// DOCUMENT UPLOAD ROUTES
// ===================

// Upload document
router.post('/document', 
  requireAuth, 
  uploadConfigs.document.single('file'), 
  uploadController.uploadDocument
);

// Upload multiple documents
router.post('/documents', 
  requireAuth, 
  uploadConfigs.document.array('files', 5), 
  uploadController.uploadMultipleFiles
);

// ===================
// MULTIPLE FILE UPLOAD ROUTES
// ===================

// Upload multiple files (mixed types)
router.post('/multiple', 
  requireAuth, 
  uploadConfigs.any.array('files', 20), 
  uploadController.uploadMultipleFiles
);

// ===================
// FILE MANAGEMENT ROUTES
// ===================

// Delete file
router.delete('/file', requireAuth, uploadController.deleteFile);

// Get file information
router.get('/file-info/:filepath(*)', requireAuth, uploadController.getFileInfo);

// ===================
// IMAGE PROCESSING ROUTES
// ===================

// Compress image
router.post('/compress', requireAuth, uploadController.compressImage);

// Convert to WebP
router.post('/convert-webp', requireAuth, uploadController.convertToWebP);

// ===================
// UTILITY ROUTES
// ===================

// Get upload configuration
router.get('/config', requireAuth, (req, res) => {
  const { uploadConfig } = require('../../config/upload');
  
  res.status(200).json({
    success: true,
    message: 'Upload configuration retrieved successfully',
    data: {
      limits: uploadConfig.limits,
      file_types: uploadConfig.fileTypes,
      directories: uploadConfig.directories,
      image_processing: uploadConfig.imageProcessing
    }
  });
});

// Get supported file types
router.get('/file-types', (req, res) => {
  const { uploadConfig } = require('../../config/upload');
  
  res.status(200).json({
    success: true,
    message: 'Supported file types retrieved successfully',
    data: {
      images: uploadConfig.fileTypes.images,
      documents: uploadConfig.fileTypes.documents,
      videos: uploadConfig.fileTypes.videos,
      audio: uploadConfig.fileTypes.audio
    }
  });
});

// Get upload limits
router.get('/limits', (req, res) => {
  const { uploadConfig } = require('../../config/upload');
  
  const limitsInMB = {};
  for (const [key, value] of Object.entries(uploadConfig.limits)) {
    limitsInMB[key] = Math.round(value / 1024 / 1024);
  }
  
  res.status(200).json({
    success: true,
    message: 'Upload limits retrieved successfully',
    data: {
      limits_bytes: uploadConfig.limits,
      limits_mb: limitsInMB
    }
  });
});

// ===================
// ERROR HANDLING MIDDLEWARE
// ===================

// Handle Multer errors
router.use((error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      case 'MISSING_FIELD_NAME':
        message = 'Missing field name';
        break;
      default:
        message = error.message;
    }
    
    return res.status(400).json({
      success: false,
      message,
      error: {
        code: error.code,
        field: error.field,
        details: error.message
      }
    });
  }
  
  // Handle other file upload errors
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type',
      error: {
        details: error.message
      }
    });
  }
  
  next(error);
});

module.exports = router; 