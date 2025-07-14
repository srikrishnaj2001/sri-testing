const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

// Upload configuration
const uploadConfig = {
  // File size limits (in bytes)
  limits: {
    profileImage: 5 * 1024 * 1024, // 5MB
    productImage: 10 * 1024 * 1024, // 10MB
    categoryImage: 5 * 1024 * 1024, // 5MB
    bannerImage: 15 * 1024 * 1024, // 15MB
    document: 10 * 1024 * 1024, // 10MB
    avatar: 2 * 1024 * 1024, // 2MB
    logo: 3 * 1024 * 1024, // 3MB
    gallery: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024 // 50MB
  },

  // Allowed file types
  fileTypes: {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm']
  },

  // Upload directories
  directories: {
    temp: 'uploads/temp',
    profile: 'uploads/profile',
    products: 'uploads/products',
    categories: 'uploads/categories',
    banners: 'uploads/banners',
    documents: 'uploads/documents',
    gallery: 'uploads/gallery',
    logos: 'uploads/logos',
    videos: 'uploads/videos',
    audio: 'uploads/audio'
  },

  // Image processing settings
  imageProcessing: {
    profile: {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 800 }
    },
    product: {
      thumbnail: { width: 200, height: 200 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 }
    },
    category: {
      thumbnail: { width: 100, height: 100 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    },
    banner: {
      mobile: { width: 768, height: 300 },
      tablet: { width: 1024, height: 400 },
      desktop: { width: 1920, height: 600 }
    },
    logo: {
      small: { width: 100, height: 100 },
      medium: { width: 200, height: 200 },
      large: { width: 400, height: 400 }
    }
  }
};

// Ensure upload directories exist
const ensureUploadDirectories = async () => {
  try {
    for (const dir of Object.values(uploadConfig.directories)) {
      await fs.ensureDir(dir);
      console.log(`✅ Upload directory ensured: ${dir}`);
    }
  } catch (error) {
    console.error('❌ Error creating upload directories:', error);
  }
};

// Initialize upload directories
ensureUploadDirectories();

// Generate unique filename
const generateFilename = (originalName, prefix = '') => {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${uuid}${ext}`;
};

// File filter function
const createFileFilter = (allowedTypes) => {
  return (req, file, callback) => {
    const fileType = file.mimetype;
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        return fileType.startsWith(type.replace('*', ''));
      }
      return fileType === type;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// Storage configuration
const createStorage = (directory, filenamePrefix = '') => {
  return multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, directory);
    },
    filename: (req, file, callback) => {
      const filename = generateFilename(file.originalname, filenamePrefix);
      callback(null, filename);
    }
  });
};

// Memory storage for processing
const memoryStorage = multer.memoryStorage();

// Upload configurations for different file types
const uploadConfigs = {
  // Profile image upload
  profileImage: multer({
    storage: createStorage(uploadConfig.directories.profile, 'profile'),
    limits: { fileSize: uploadConfig.limits.profileImage },
    fileFilter: createFileFilter(uploadConfig.fileTypes.images)
  }),

  // Product image upload
  productImage: multer({
    storage: createStorage(uploadConfig.directories.products, 'product'),
    limits: { fileSize: uploadConfig.limits.productImage },
    fileFilter: createFileFilter(uploadConfig.fileTypes.images)
  }),

  // Category image upload
  categoryImage: multer({
    storage: createStorage(uploadConfig.directories.categories, 'category'),
    limits: { fileSize: uploadConfig.limits.categoryImage },
    fileFilter: createFileFilter(uploadConfig.fileTypes.images)
  }),

  // Banner image upload
  bannerImage: multer({
    storage: createStorage(uploadConfig.directories.banners, 'banner'),
    limits: { fileSize: uploadConfig.limits.bannerImage },
    fileFilter: createFileFilter(uploadConfig.fileTypes.images)
  }),

  // Document upload
  document: multer({
    storage: createStorage(uploadConfig.directories.documents, 'doc'),
    limits: { fileSize: uploadConfig.limits.document },
    fileFilter: createFileFilter(uploadConfig.fileTypes.documents)
  }),

  // Gallery image upload
  gallery: multer({
    storage: createStorage(uploadConfig.directories.gallery, 'gallery'),
    limits: { fileSize: uploadConfig.limits.gallery },
    fileFilter: createFileFilter(uploadConfig.fileTypes.images)
  }),

  // Logo upload
  logo: multer({
    storage: createStorage(uploadConfig.directories.logos, 'logo'),
    limits: { fileSize: uploadConfig.limits.logo },
    fileFilter: createFileFilter(uploadConfig.fileTypes.images)
  }),

  // Video upload
  video: multer({
    storage: createStorage(uploadConfig.directories.videos, 'video'),
    limits: { fileSize: uploadConfig.limits.video },
    fileFilter: createFileFilter(uploadConfig.fileTypes.videos)
  }),

  // Audio upload
  audio: multer({
    storage: createStorage(uploadConfig.directories.audio, 'audio'),
    limits: { fileSize: uploadConfig.limits.audio },
    fileFilter: createFileFilter(uploadConfig.fileTypes.audio)
  }),

  // Memory storage for processing
  memory: multer({
    storage: memoryStorage,
    limits: { fileSize: uploadConfig.limits.productImage },
    fileFilter: createFileFilter([...uploadConfig.fileTypes.images, ...uploadConfig.fileTypes.documents])
  }),

  // General upload (any file type)
  any: multer({
    storage: createStorage(uploadConfig.directories.temp, 'temp'),
    limits: { fileSize: uploadConfig.limits.document },
    fileFilter: (req, file, callback) => {
      // Allow all file types for general upload
      callback(null, true);
    }
  })
};

// Utility functions
const getFileInfo = (filepath) => {
  const stats = fs.statSync(filepath);
  const filename = path.basename(filepath);
  const extension = path.extname(filepath).toLowerCase();
  const mimeType = mime.lookup(filepath) || 'application/octet-stream';
  
  return {
    filename,
    extension,
    mimeType,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    path: filepath
  };
};

const validateFile = (file, allowedTypes, maxSize) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }
  
  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  // Check file size
  if (maxSize && file.size > maxSize) {
    errors.push(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

const deleteFile = async (filepath) => {
  try {
    if (await fs.pathExists(filepath)) {
      await fs.unlink(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

const moveFile = async (sourcePath, destinationPath) => {
  try {
    await fs.ensureDir(path.dirname(destinationPath));
    await fs.move(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
};

const copyFile = async (sourcePath, destinationPath) => {
  try {
    await fs.ensureDir(path.dirname(destinationPath));
    await fs.copy(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    return false;
  }
};

// Clean up old files
const cleanupOldFiles = async (directory, days = 7) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const cutoff = days * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filepath = path.join(directory, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > cutoff) {
        await fs.unlink(filepath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return 0;
  }
};

// Get file URL
const getFileUrl = (filepath, baseUrl = '') => {
  if (!filepath) return null;
  
  // Remove uploads/ prefix if present
  const cleanPath = filepath.replace(/^uploads\//, '');
  
  return `${baseUrl}/uploads/${cleanPath}`;
};

// Handle multiple file uploads
const handleMultipleFiles = (files, validationRules = {}) => {
  const results = {
    successful: [],
    failed: [],
    errors: []
  };
  
  if (!Array.isArray(files)) {
    files = [files];
  }
  
  files.forEach((file, index) => {
    const validation = validateFile(
      file,
      validationRules.allowedTypes,
      validationRules.maxSize
    );
    
    if (validation.valid) {
      results.successful.push({
        index,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype
      });
    } else {
      results.failed.push({
        index,
        filename: file.originalname,
        errors: validation.errors
      });
      results.errors.push(...validation.errors);
    }
  });
  
  return results;
};

module.exports = {
  uploadConfig,
  uploadConfigs,
  generateFilename,
  createFileFilter,
  createStorage,
  getFileInfo,
  validateFile,
  deleteFile,
  moveFile,
  copyFile,
  cleanupOldFiles,
  getFileUrl,
  handleMultipleFiles,
  ensureUploadDirectories
}; 