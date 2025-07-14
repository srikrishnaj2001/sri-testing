const express = require('express');
const router = express.Router();
const reportingController = require('../../controllers/reportingController');
const adminDashboardController = require('../../controllers/adminDashboardController');
const { authenticate } = require('../../middleware/auth');
const { requireAnyRole } = require('../../middleware/roleAuth');

// Dashboard Analytics Routes
/**
 * @route GET /api/v1/reporting/dashboard/analytics
 * @desc Get comprehensive dashboard analytics
 * @access Admin, Branch
 * @query branchId (optional for admin, ignored for branch users)
 */
router.get('/dashboard/analytics', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getDashboardAnalytics
);

/**
 * @route GET /api/v1/reporting/dashboard/stats
 * @desc Get basic dashboard statistics (enhanced version)
 * @access Admin, Branch
 * @query branchId (optional for admin, ignored for branch users)
 */
router.get('/dashboard/stats', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getDashboardStats
);

/**
 * @route GET /api/v1/reporting/dashboard/order-stats
 * @desc Get order statistics with optional filtering
 * @access Admin, Branch
 * @query branchId, fromDate, toDate
 */
router.get('/dashboard/order-stats', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getOrderStats
);

/**
 * @route GET /api/v1/reporting/dashboard/earning-stats
 * @desc Get earning statistics for date range
 * @access Admin, Branch
 * @query fromDate (required), toDate (required), branchId
 */
router.get('/dashboard/earning-stats', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getEarningStats
);

/**
 * @route GET /api/v1/reporting/dashboard/monthly-chart
 * @desc Get monthly earning chart data
 * @access Admin, Branch
 * @query year, branchId
 */
router.get('/dashboard/monthly-chart', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getMonthlyEarningChart
);

/**
 * @route GET /api/v1/reporting/dashboard/top-performing
 * @desc Get top performing products, customers, etc.
 * @access Admin, Branch
 * @query branchId, limit
 */
router.get('/dashboard/top-performing', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getTopPerformingData
);

/**
 * @route GET /api/v1/reporting/dashboard/recent-activities
 * @desc Get recent orders and activities
 * @access Admin, Branch
 * @query branchId, limit
 */
router.get('/dashboard/recent-activities', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getRecentActivities
);

/**
 * @route GET /api/v1/reporting/dashboard/today-summary
 * @desc Get today's summary statistics
 * @access Admin, Branch
 * @query branchId
 */
router.get('/dashboard/today-summary', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getTodaysSummary
);

/**
 * @route GET /api/v1/reporting/dashboard/monthly-summary
 * @desc Get current month's summary statistics
 * @access Admin, Branch
 * @query branchId
 */
router.get('/dashboard/monthly-summary', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getMonthlySummary
);

/**
 * @route GET /api/v1/reporting/dashboard/performance-metrics
 * @desc Get performance metrics for specified period
 * @access Admin, Branch
 * @query period (day|week|month|year), branchId
 */
router.get('/dashboard/performance-metrics', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  adminDashboardController.getPerformanceMetrics
);

// Report Generation Routes
/**
 * @route GET /api/v1/reporting/orders
 * @desc Generate order report with filtering
 * @access Admin, Branch
 * @query fromDate, toDate, branchId, orderStatus, paymentMethod, customerId, deliveryManId, page, limit
 */
router.get('/orders', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getOrderReport
);

/**
 * @route GET /api/v1/reporting/earnings
 * @desc Generate earning report with grouping
 * @access Admin, Branch
 * @query fromDate, toDate, branchId, groupBy (day|week|month|year)
 */
router.get('/earnings', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getEarningReport
);

/**
 * @route GET /api/v1/reporting/delivery-men
 * @desc Generate delivery man performance report
 * @access Admin, Branch
 * @query fromDate, toDate, deliveryManId, branchId, page, limit
 */
router.get('/delivery-men', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getDeliveryManReport
);

/**
 * @route GET /api/v1/reporting/products
 * @desc Generate product performance report
 * @access Admin, Branch
 * @query fromDate, toDate, branchId, categoryId, productId, page, limit
 */
router.get('/products', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getProductReport
);

/**
 * @route GET /api/v1/reporting/sales
 * @desc Generate sales report
 * @access Admin, Branch
 * @query fromDate, toDate, branchId, page, limit
 */
router.get('/sales', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getSaleReport
);

// Analytics Routes
/**
 * @route GET /api/v1/reporting/analytics/orders
 * @desc Get order analytics for date range
 * @access Admin, Branch
 * @query fromDate (required), toDate (required), branchId
 */
router.get('/analytics/orders', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getOrderAnalytics
);

/**
 * @route GET /api/v1/reporting/analytics/earnings
 * @desc Get earning analytics for date range
 * @access Admin, Branch
 * @query fromDate (required), toDate (required), branchId
 */
router.get('/analytics/earnings', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getEarningAnalytics
);

/**
 * @route GET /api/v1/reporting/analytics/delivery-performance
 * @desc Get delivery man performance analytics
 * @access Admin, Branch
 * @query deliveryManId, fromDate, toDate, branchId
 */
router.get('/analytics/delivery-performance', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getDeliveryManPerformance
);

/**
 * @route GET /api/v1/reporting/analytics/monthly-earnings
 * @desc Get monthly earning chart data
 * @access Admin, Branch
 * @query year, branchId
 */
router.get('/analytics/monthly-earnings', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getMonthlyEarningChart
);

// Top Performance Routes
/**
 * @route GET /api/v1/reporting/top/products
 * @desc Get top selling products
 * @access Admin, Branch, Staff
 * @query limit, branchId, fromDate, toDate
 */
router.get('/top/products', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF']), 
  reportingController.getTopSellingProducts
);

/**
 * @route GET /api/v1/reporting/top/rated-products
 * @desc Get most rated products
 * @access Admin, Branch, Staff
 * @query limit
 */
router.get('/top/rated-products', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF']), 
  reportingController.getMostRatedProducts
);

/**
 * @route GET /api/v1/reporting/top/customers
 * @desc Get top customers by orders/spending
 * @access Admin, Branch
 * @query limit, branchId, fromDate, toDate
 */
router.get('/top/customers', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getTopCustomers
);

/**
 * @route GET /api/v1/reporting/recent/orders
 * @desc Get recent orders
 * @access Admin, Branch, Staff
 * @query limit, branchId
 */
router.get('/recent/orders', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'STAFF']), 
  reportingController.getRecentOrders
);

// Export Routes
/**
 * @route GET /api/v1/reporting/export
 * @desc Export reports in various formats
 * @access Admin, Branch
 * @query reportType (order|earning|delivery|product|sale), format (pdf|csv|excel), ...filters
 */
router.get('/export', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.exportReport
);

// Summary Routes
/**
 * @route GET /api/v1/reporting/summary
 * @desc Get report summary for date range
 * @access Admin, Branch
 * @query fromDate (required), toDate (required), branchId
 */
router.get('/summary', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER']), 
  reportingController.getReportSummary
);

// System Overview (Legacy Support)
/**
 * @route GET /api/v1/reporting/system/overview
 * @desc Get basic system overview statistics
 * @access Admin
 */
router.get('/system/overview', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN']), 
  adminDashboardController.getSystemOverview
);

// Maintenance Routes
/**
 * @route POST /api/v1/reporting/cleanup-exports
 * @desc Clean up old export files
 * @access Admin
 */
router.post('/cleanup-exports', 
  authenticate, 
  requireAnyRole(['SUPER_ADMIN', 'ADMIN']), 
  reportingController.cleanupExports
);

module.exports = router; 