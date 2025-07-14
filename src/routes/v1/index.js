const express = require('express');
const router = express.Router();

// Import all route modules
const customerRoutes = require('./customer');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const deliveryRoutes = require('./delivery');
const productRoutes = require('./product');
const categoryRoutes = require('./category');
const configRoutes = require('./config');
const orderRoutes = require('./order');
const orderTrackingRoutes = require('./orderTracking');
const paymentRoutes = require('./payment');
const uploadRoutes = require('./upload');
const chatRoutes = require('./chat');
const posRoutes = require('./pos');
const tableBookingRoutes = require('./tableBooking');
const languageRoutes = require('./language');
const reportingRoutes = require('./reporting');
const pagesRoutes = require('./pages');

// Define API routes
router.use('/customers', customerRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/delivery-man', deliveryRoutes); // Alias for delivery routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/config', configRoutes);
router.use('/orders', orderRoutes);
router.use('/order-tracking', orderTrackingRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/chat', chatRoutes);
router.use('/pos', posRoutes);
router.use('/table-booking', tableBookingRoutes);
router.use('/languages', languageRoutes);
router.use('/reporting', reportingRoutes);
router.use('/pages', pagesRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation route
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'eFood API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      customers: '/api/v1/customers',
      admin: '/api/v1/admin',
      delivery: '/api/v1/delivery',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      orders: '/api/v1/orders',
      order_tracking: '/api/v1/order-tracking',
      payments: '/api/v1/payments',
      uploads: '/api/v1/uploads',
      chat: '/api/v1/chat',
      config: '/api/v1/config',
      pos: '/api/v1/pos',
      table_booking: '/api/v1/table-booking',
      languages: '/api/v1/languages',
      reporting: '/api/v1/reporting',
      pages: '/api/v1/pages'
    }
  });
});

module.exports = router; 