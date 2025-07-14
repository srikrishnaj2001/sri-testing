/**
 * Core Helper Functions
 * Converted from PHP CentralLogics/helpers.php to JavaScript
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { 
  BusinessSetting, CustomerAddress, Coupon, DeliveryCharge, 
  Translation, CouponCustomer
} = require('../models');

// Remove old notification functions and replace with new service
const NotificationService = require('../services/NotificationService');
const FirebaseService = require('../services/FirebaseService');
const EmailService = require('../services/EmailService');

/**
 * Generate a random string
 */
const generateRandomString = (length = 10) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a unique token
 */
const generateUniqueToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
const generateJWT = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currencySymbol = '$', position = 'left') => {
  const formattedAmount = parseFloat(amount).toFixed(2);
  return position === 'left' ? `${currencySymbol}${formattedAmount}` : `${formattedAmount}${currencySymbol}`;
};

/**
 * Get business setting value
 */
const getBusinessSetting = async (key) => {
  try {
    const setting = await BusinessSetting.findOne({ where: { key } });
    return setting ? setting.value : null;
  } catch (error) {
    console.error('Error getting business setting:', error);
    return null;
  }
};

/**
 * Set business setting value
 */
const setBusinessSetting = async (key, value) => {
  try {
    const [setting] = await BusinessSetting.findOrCreate({
      where: { key },
      defaults: { key, value }
    });
    
    if (setting.value !== value) {
      await setting.update({ value });
    }
    
    return setting;
  } catch (error) {
    console.error('Error setting business setting:', error);
    return null;
  }
};

/**
 * Get default currency symbol
 */
const getDefaultCurrency = async () => {
  try {
    const currency = await getBusinessSetting('currency');
    return currency || 'USD';
  } catch (error) {
    console.error('Error getting default currency:', error);
    return 'USD';
  }
};

/**
 * Get default currency position
 */
const getCurrencyPosition = async () => {
  try {
    const position = await getBusinessSetting('currency_position');
    return position || 'left';
  } catch (error) {
    console.error('Error getting currency position:', error);
    return 'left';
  }
};

/**
 * Calculate distance between two points
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate delivery charge based on distance
 */
const calculateDeliveryCharge = async (distance, zoneId = null) => {
  try {
    let deliveryCharge = await DeliveryCharge.findOne({
      where: zoneId ? { zone_id: zoneId } : {},
      order: [['created_at', 'DESC']]
    });

    if (!deliveryCharge) {
      // Default delivery charge
      deliveryCharge = {
        minimum_charge: 5,
        per_km_charge: 2,
        minimum_distance: 1
      };
    }

    if (distance <= deliveryCharge.minimum_distance) {
      return deliveryCharge.minimum_charge;
    }

    const extraDistance = distance - deliveryCharge.minimum_distance;
    return deliveryCharge.minimum_charge + (extraDistance * deliveryCharge.per_km_charge);
  } catch (error) {
    console.error('Error calculating delivery charge:', error);
    return 5; // Default charge
  }
};

/**
 * Get order status color
 */
const getOrderStatusColor = (status) => {
  const colors = {
    'pending': '#ffc107',
    'confirmed': '#17a2b8',
    'processing': '#fd7e14',
    'out_for_delivery': '#6f42c1',
    'delivered': '#28a745',
    'canceled': '#dc3545',
    'returned': '#6c757d',
    'failed': '#dc3545'
  };
  return colors[status] || '#6c757d';
};

/**
 * Get delivery status color
 */
const getDeliveryStatusColor = (status) => {
  const colors = {
    'pending': '#ffc107',
    'accepted': '#17a2b8',
    'picked_up': '#fd7e14',
    'on_the_way': '#6f42c1',
    'delivered': '#28a745',
    'canceled': '#dc3545',
    'returned': '#6c757d'
  };
  return colors[status] || '#6c757d';
};

/**
 * Format date
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  
  if (format === 'YYYY-MM-DD') {
    return d.toISOString().split('T')[0];
  } else if (format === 'DD-MM-YYYY') {
    return d.toLocaleDateString('en-GB');
  } else if (format === 'MM-DD-YYYY') {
    return d.toLocaleDateString('en-US');
  } else {
    return d.toLocaleDateString();
  }
};

/**
 * Format time
 */
const formatTime = (date, format = '24h') => {
  const d = new Date(date);
  
  if (format === '24h') {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } else if (format === '12h') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else {
    return d.toLocaleTimeString();
  }
};

/**
 * Generate order number
 */
const generateOrderNumber = (prefix = 'ORD') => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate invoice number
 */
const generateInvoiceNumber = (prefix = 'INV') => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<script[^>]*>.*?<\/script>/gi, '')
             .replace(/<[/!]*?[^<>]*?>/gi, '')
             .replace(/javascript:/gi, '');
};

/**
 * Generate slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Check if file exists
 */
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * Delete file
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Create directory if not exists
 */
const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get file extension
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * Get file size in MB
 */
const getFileSizeInMB = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
};

/**
 * Compress image
 */
const compressImage = async (inputPath, outputPath, quality = 80) => {
  try {
    await sharp(inputPath)
      .jpeg({ quality })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Error compressing image:', error);
    return false;
  }
};

/**
 * Resize image
 */
const resizeImage = async (inputPath, outputPath, width, height = null) => {
  try {
    const options = { width };
    if (height) {
      options.height = height;
    }
    
    await sharp(inputPath)
      .resize(options)
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Error resizing image:', error);
    return false;
  }
};

/**
 * Generate thumbnail
 */
const generateThumbnail = async (inputPath, outputPath, size = 200) => {
  try {
    await sharp(inputPath)
      .resize(size, size)
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return false;
  }
};

/**
 * Get image dimensions
 */
const getImageDimensions = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
};

/**
 * Send notification using new notification service
 */
const sendNotification = async (userId, title, message, type = 'general', data = {}) => {
  try {
    return await NotificationService.sendNotification({
      title,
      message,
      type,
      user_id: userId,
      delivery_methods: ['app'],
      data
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Send FCM notification using new Firebase service
 */
const sendFCMNotification = async (deviceToken, title, body, data = {}) => {
  try {
    return await FirebaseService.sendNotification(deviceToken, title, body, data);
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return null;
  }
};

/**
 * Send email notification using new email service
 */
const sendEmailNotification = async (to, subject, body, options = {}) => {
  try {
    return await EmailService.sendEmail(to, subject, body, options);
  } catch (error) {
    console.error('Error sending email notification:', error);
    return null;
  }
};

/**
 * Send order notification
 */
const sendOrderNotification = async (order, type, additionalData = {}) => {
  try {
    return await NotificationService.sendOrderNotification(order, type, additionalData);
  } catch (error) {
    console.error('Error sending order notification:', error);
    return null;
  }
};

/**
 * Calculate tax amount
 */
const calculateTax = (amount, taxRate) => {
  return amount * (taxRate / 100);
};

/**
 * Calculate discount amount
 */
const calculateDiscount = (amount, discountPercentage) => {
  return amount * (discountPercentage / 100);
};

/**
 * Apply coupon discount
 */
const applyCouponDiscount = async (couponCode, orderAmount, userId = null) => {
  try {
    const coupon = await Coupon.findOne({
      where: { 
        code: couponCode, 
        status: 'active',
        start_date: { [Op.lte]: new Date() },
        end_date: { [Op.gte]: new Date() }
      }
    });
    
    if (!coupon) {
      return { success: false, message: 'Invalid or expired coupon' };
    }
    
    if (orderAmount < coupon.minimum_amount) {
      return { 
        success: false, 
        message: `Minimum order amount should be ${coupon.minimum_amount}` 
      };
    }
    
    if (coupon.limit && coupon.total_used >= coupon.limit) {
      return { success: false, message: 'Coupon usage limit exceeded' };
    }
    
    if (userId && coupon.limit_per_user) {
      const userUsageCount = await CouponCustomer.count({
        where: { coupon_id: coupon.id, user_id: userId }
      });
      
      if (userUsageCount >= coupon.limit_per_user) {
        return { success: false, message: 'Coupon usage limit per user exceeded' };
      }
    }
    
    let discountAmount = 0;
    
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderAmount * coupon.discount) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
    } else {
      discountAmount = coupon.discount;
    }
    
    return {
      success: true,
      coupon,
      discountAmount,
      finalAmount: orderAmount - discountAmount
    };
  } catch (error) {
    console.error('Error applying coupon discount:', error);
    return { success: false, message: 'Error applying coupon' };
  }
};

/**
 * Get customer addresses
 */
const getCustomerAddresses = async (customerId) => {
  try {
    return await CustomerAddress.findAll({
      where: { customer_id: customerId },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });
  } catch (error) {
    console.error('Error getting customer addresses:', error);
    return [];
  }
};

/**
 * Get customer default address
 */
const getCustomerDefaultAddress = async (customerId) => {
  try {
    return await CustomerAddress.findOne({
      where: { customer_id: customerId, is_default: true }
    });
  } catch (error) {
    console.error('Error getting customer default address:', error);
    return null;
  }
};

/**
 * Calculate order total
 */
const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

/**
 * Get order status text
 */
const getOrderStatusText = (status) => {
  const statusTexts = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'processing': 'Processing',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'canceled': 'Canceled',
    'returned': 'Returned',
    'failed': 'Failed'
  };
  return statusTexts[status] || 'Unknown';
};

/**
 * Check if order can be canceled
 */
const canCancelOrder = (orderStatus) => {
  const cancelableStatuses = ['pending', 'confirmed', 'processing'];
  return cancelableStatuses.includes(orderStatus);
};

/**
 * Check if order is delivered
 */
const isOrderDelivered = (orderStatus) => {
  return orderStatus === 'delivered';
};

/**
 * Add product rating
 */
const addProductRating = async (_productId, _rating, _review = null, _customerId = null) => {
  try {
    // Implementation would be added here
    console.log('Product rating functionality not implemented yet');
    return { success: false, message: 'Not implemented' };
  } catch (error) {
    console.error('Error adding product rating:', error);
    return { success: false, message: 'Error adding rating' };
  }
};

/**
 * Add delivery man rating
 */
const addDeliveryManRating = async (_deliverymanId, _rating, _review = null, _customerId = null) => {
  try {
    // Implementation would be added here
    console.log('Delivery man rating functionality not implemented yet');
    return { success: false, message: 'Not implemented' };
  } catch (error) {
    console.error('Error adding delivery man rating:', error);
    return { success: false, message: 'Error adding rating' };
  }
};

/**
 * Get translations
 */
const getTranslations = async (language = 'en') => {
  try {
    const translations = await Translation.findAll({
      where: { language_code: language }
    });
    
    const translationObj = {};
    translations.forEach(translation => {
      translationObj[translation.key] = translation.value;
    });
    
    return translationObj;
  } catch (error) {
    console.error('Error getting translations:', error);
    return {};
  }
};

/**
 * Translate text
 */
const translate = async (key, language = 'en', defaultValue = null) => {
  try {
    const translation = await Translation.findOne({
      where: { key, language_code: language }
    });
    
    return translation ? translation.value : (defaultValue || key);
  } catch (error) {
    console.error('Error translating text:', error);
    return defaultValue || key;
  }
};

/**
 * Get distance between coordinates
 */
const getDistanceBetweenCoordinates = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Check if coordinates are within delivery radius
 */
const isWithinDeliveryRadius = (customerLat, customerLng, restaurantLat, restaurantLng, maxRadius = 10) => {
  const getDistanceBetweenCoordinates = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const distance = getDistanceBetweenCoordinates(customerLat, customerLng, restaurantLat, restaurantLng);
  return distance <= maxRadius;
};

/**
 * Generate random OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Validate OTP
 */
const validateOTP = (inputOTP, storedOTP, expiryTime = null) => {
  if (inputOTP !== storedOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  if (expiryTime && new Date() > new Date(expiryTime)) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  return { valid: true, message: 'OTP is valid' };
};

/**
 * Get pagination info
 */
const getPaginationInfo = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalItems = parseInt(total) || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;
  
  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

/**
 * Format pagination response
 */
const formatPaginationResponse = (data, pagination) => {
  return {
    data,
    pagination: {
      current_page: pagination.currentPage,
      per_page: pagination.itemsPerPage,
      total: pagination.totalItems,
      total_pages: pagination.totalPages,
      has_next: pagination.hasNext,
      has_prev: pagination.hasPrev,
      next_page: pagination.nextPage,
      prev_page: pagination.prevPage
    }
  };
};

module.exports = {
  generateRandomString,
  generateUniqueToken,
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  formatCurrency,
  getBusinessSetting,
  setBusinessSetting,
  getDefaultCurrency,
  getCurrencyPosition,
  calculateDistance,
  calculateDeliveryCharge,
  getOrderStatusColor,
  getDeliveryStatusColor,
  formatDate,
  formatTime,
  generateOrderNumber,
  generateInvoiceNumber,
  validateEmail,
  validatePhoneNumber,
  sanitizeInput,
  generateSlug,
  fileExists,
  deleteFile,
  createDirectory,
  getFileExtension,
  getFileSizeInMB,
  compressImage,
  resizeImage,
  generateThumbnail,
  getImageDimensions,
  sendNotification,
  sendFCMNotification,
  sendEmailNotification,
  sendOrderNotification,
  calculateTax,
  calculateDiscount,
  applyCouponDiscount,
  getCustomerAddresses,
  getCustomerDefaultAddress,
  calculateOrderTotal,
  getOrderStatusText,
  canCancelOrder,
  isOrderDelivered,
  addProductRating,
  addDeliveryManRating,
  getTranslations,
  translate,
  getDistanceBetweenCoordinates,
  isWithinDeliveryRadius,
  generateOTP,
  validateOTP,
  getPaginationInfo,
  formatPaginationResponse
}; 