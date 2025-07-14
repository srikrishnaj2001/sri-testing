const express = require('express');
const router = express.Router();

// Import controllers
const adminDashboardController = require('../../controllers/adminDashboardController');
const adminOrdersController = require('../../controllers/adminOrdersController');
const adminProductsController = require('../../controllers/adminProductsController');
const adminCustomersController = require('../../controllers/adminCustomersController');
const adminDeliveryMenController = require('../../controllers/adminDeliveryMenController');

// Import middleware
const { requireAuth, requireAdmin } = require('../../config/clerk');

// Apply admin authentication middleware to all routes
router.use(requireAuth());
router.use(requireAdmin());

// ===================
// DASHBOARD ROUTES
// ===================
router.get('/dashboard', adminDashboardController.getDashboardStats);
router.get('/dashboard/charts', adminDashboardController.getChartData);
router.get('/dashboard/realtime', adminDashboardController.getRealTimeStats);
router.get('/dashboard/system-health', adminDashboardController.getSystemHealth);

// ===================
// ORDER ROUTES
// ===================
router.get('/orders', adminOrdersController.getOrders);
router.get('/orders/stats', adminOrdersController.getOrderStats);
router.get('/orders/:orderId', adminOrdersController.getOrderDetails);
router.get('/orders/:orderId/history', adminOrdersController.getOrderHistory);
router.put('/orders/:orderId/status', adminOrdersController.updateOrderStatus);
router.put('/orders/:orderId/assign-delivery', adminOrdersController.assignDeliveryMan);
router.put('/orders/:orderId/cancel', adminOrdersController.cancelOrder);

// ===================
// PRODUCT ROUTES
// ===================
router.get('/products', adminProductsController.getProducts);
router.get('/products/stats', adminProductsController.getProductStats);
router.get('/products/:productId', adminProductsController.getProductById);
router.post('/products', adminProductsController.createProduct);
router.put('/products/:productId', adminProductsController.updateProduct);
router.delete('/products/:productId', adminProductsController.deleteProduct);
router.put('/products/bulk-update', adminProductsController.bulkUpdateProducts);
router.put('/products/:productId/stock', adminProductsController.updateProductStock);
router.put('/products/:productId/toggle-status', adminProductsController.toggleProductStatus);
router.get('/products/category/:categoryId', adminProductsController.getProductsByCategory);

// ===================
// CUSTOMER ROUTES
// ===================
router.get('/customers', adminCustomersController.getCustomers);
router.get('/customers/stats', adminCustomersController.getCustomerStats);
router.get('/customers/:customerId', adminCustomersController.getCustomerById);
router.get('/customers/:customerId/orders', adminCustomersController.getCustomerOrders);
router.put('/customers/:customerId', adminCustomersController.updateCustomer);
router.put('/customers/:customerId/toggle-status', adminCustomersController.toggleCustomerStatus);
router.delete('/customers/:customerId', adminCustomersController.deleteCustomer);

// ===================
// DELIVERY MEN ROUTES
// ===================
router.get('/delivery-men', adminDeliveryMenController.getDeliveryMen);
router.get('/delivery-men/stats', adminDeliveryMenController.getDeliveryMenStats);
router.get('/delivery-men/available', adminDeliveryMenController.getAvailableDeliveryMen);
router.get('/delivery-men/:deliveryManId', adminDeliveryMenController.getDeliveryManById);
router.get('/delivery-men/:deliveryManId/performance', adminDeliveryMenController.getDeliveryManPerformance);
router.get('/delivery-men/:deliveryManId/earnings', adminDeliveryMenController.getDeliveryManEarnings);
router.get('/delivery-men/:deliveryManId/documents', adminDeliveryMenController.getDeliveryManDocuments);
router.put('/delivery-men/:deliveryManId', adminDeliveryMenController.updateDeliveryMan);
router.put('/delivery-men/:deliveryManId/toggle-status', adminDeliveryMenController.toggleDeliveryManStatus);
router.put('/delivery-men/:deliveryManId/availability', adminDeliveryMenController.updateDeliveryManAvailability);

// ===================
// GENERAL ADMIN ROUTES
// ===================
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin API Documentation',
    version: 'v1.0.0',
    endpoints: {
      dashboard: {
        stats: 'GET /api/v1/admin/dashboard',
        charts: 'GET /api/v1/admin/dashboard/charts',
        realtime: 'GET /api/v1/admin/dashboard/realtime',
        system_health: 'GET /api/v1/admin/dashboard/system-health'
      },
      orders: {
        list: 'GET /api/v1/admin/orders',
        stats: 'GET /api/v1/admin/orders/stats',
        details: 'GET /api/v1/admin/orders/:orderId',
        history: 'GET /api/v1/admin/orders/:orderId/history',
        update_status: 'PUT /api/v1/admin/orders/:orderId/status',
        assign_delivery: 'PUT /api/v1/admin/orders/:orderId/assign-delivery',
        cancel: 'PUT /api/v1/admin/orders/:orderId/cancel'
      },
      products: {
        list: 'GET /api/v1/admin/products',
        stats: 'GET /api/v1/admin/products/stats',
        details: 'GET /api/v1/admin/products/:productId',
        create: 'POST /api/v1/admin/products',
        update: 'PUT /api/v1/admin/products/:productId',
        delete: 'DELETE /api/v1/admin/products/:productId',
        bulk_update: 'PUT /api/v1/admin/products/bulk-update',
        update_stock: 'PUT /api/v1/admin/products/:productId/stock',
        toggle_status: 'PUT /api/v1/admin/products/:productId/toggle-status',
        by_category: 'GET /api/v1/admin/products/category/:categoryId'
      },
      customers: {
        list: 'GET /api/v1/admin/customers',
        stats: 'GET /api/v1/admin/customers/stats',
        details: 'GET /api/v1/admin/customers/:customerId',
        orders: 'GET /api/v1/admin/customers/:customerId/orders',
        update: 'PUT /api/v1/admin/customers/:customerId',
        toggle_status: 'PUT /api/v1/admin/customers/:customerId/toggle-status',
        delete: 'DELETE /api/v1/admin/customers/:customerId'
      },
      delivery_men: {
        list: 'GET /api/v1/admin/delivery-men',
        stats: 'GET /api/v1/admin/delivery-men/stats',
        available: 'GET /api/v1/admin/delivery-men/available',
        details: 'GET /api/v1/admin/delivery-men/:deliveryManId',
        performance: 'GET /api/v1/admin/delivery-men/:deliveryManId/performance',
        earnings: 'GET /api/v1/admin/delivery-men/:deliveryManId/earnings',
        documents: 'GET /api/v1/admin/delivery-men/:deliveryManId/documents',
        update: 'PUT /api/v1/admin/delivery-men/:deliveryManId',
        toggle_status: 'PUT /api/v1/admin/delivery-men/:deliveryManId/toggle-status',
        availability: 'PUT /api/v1/admin/delivery-men/:deliveryManId/availability'
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      required: true,
      role: 'admin'
    },
    features: [
      'Dashboard analytics and real-time stats',
      'Order management and tracking',
      'Product and inventory management',
      'Customer management and blocking',
      'Delivery man performance tracking',
      'System health monitoring'
    ]
  });
});

module.exports = router; 