const AnalyticsService = require('../services/AnalyticsService');
const ReportService = require('../services/ReportService');
const ExportService = require('../services/ExportService');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const { Op } = require('sequelize'); // Added Op import for date range filtering

class ReportingController {
  // Dashboard Analytics
  async getDashboardAnalytics(req, res) {
    try {
      const { branchId } = req.query;
      const userType = req.user.userType;
      
      // Branch managers can only see their branch data
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const dashboardStats = await AnalyticsService.getDashboardStats(effectiveBranchId);

      return generateResponse(res, 200, 'Dashboard analytics retrieved successfully', {
        analytics: dashboardStats
      });
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve dashboard analytics', error.message);
    }
  }

  // Order Reports
  async getOrderReport(req, res) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        orderStatus,
        paymentMethod,
        customerId,
        deliveryManId,
        page = 1,
        limit = 25
      } = req.query;

      const userType = req.user.userType;
      
      // Apply role-based filtering
      const filters = { fromDate, toDate, orderStatus, paymentMethod, customerId, deliveryManId, page, limit };
      
      if (userType === 'branch') {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = branchId;
      }

      const orderReport = await ReportService.getOrderReport(filters);

      return generateResponse(res, 200, 'Order report retrieved successfully', {
        report: orderReport
      });
    } catch (error) {
      console.error('Order report error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order report', error.message);
    }
  }

  // Earning Reports
  async getEarningReport(req, res) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        groupBy = 'day'
      } = req.query;

      const userType = req.user.userType;
      
      const filters = { fromDate, toDate, groupBy };
      
      if (userType === 'branch') {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = branchId;
      }

      const earningReport = await ReportService.getEarningReport(filters);

      return generateResponse(res, 200, 'Earning report retrieved successfully', {
        report: earningReport
      });
    } catch (error) {
      console.error('Earning report error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve earning report', error.message);
    }
  }

  // Delivery Man Reports
  async getDeliveryManReport(req, res) {
    try {
      const {
        fromDate,
        toDate,
        deliveryManId,
        branchId,
        page = 1,
        limit = 25
      } = req.query;

      const userType = req.user.userType;
      
      const filters = { fromDate, toDate, deliveryManId, page, limit };
      
      if (userType === 'branch') {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = branchId;
      }

      const deliveryReport = await ReportService.getDeliveryManReport(filters);

      return generateResponse(res, 200, 'Delivery man report retrieved successfully', {
        report: deliveryReport
      });
    } catch (error) {
      console.error('Delivery man report error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man report', error.message);
    }
  }

  // Product Reports
  async getProductReport(req, res) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        categoryId,
        productId,
        page = 1,
        limit = 25
      } = req.query;

      const userType = req.user.userType;
      
      const filters = { fromDate, toDate, categoryId, productId, page, limit };
      
      if (userType === 'branch') {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = branchId;
      }

      const productReport = await ReportService.getProductReport(filters);

      return generateResponse(res, 200, 'Product report retrieved successfully', {
        report: productReport
      });
    } catch (error) {
      console.error('Product report error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve product report', error.message);
    }
  }

  // Sale Reports
  async getSaleReport(req, res) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        page = 1,
        limit = 25
      } = req.query;

      const userType = req.user.userType;
      
      const filters = { fromDate, toDate, page, limit };
      
      if (userType === 'branch') {
        filters.branchId = req.user.branchId;
      } else if (branchId) {
        filters.branchId = branchId;
      }

      const saleReport = await ReportService.getSaleReport(filters);

      return generateResponse(res, 200, 'Sale report retrieved successfully', {
        report: saleReport
      });
    } catch (error) {
      console.error('Sale report error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve sale report', error.message);
    }
  }

  // Order Analytics
  async getOrderAnalytics(req, res) {
    try {
      const { fromDate, toDate, branchId } = req.query;
      const userType = req.user.userType;
      
      if (!fromDate || !toDate) {
        return generateErrorResponse(res, 400, 'From date and to date are required');
      }

      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const orderAnalytics = await AnalyticsService.getOrderAnalytics(
        new Date(fromDate),
        new Date(toDate),
        effectiveBranchId
      );

      return generateResponse(res, 200, 'Order analytics retrieved successfully', {
        analytics: orderAnalytics
      });
    } catch (error) {
      console.error('Order analytics error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order analytics', error.message);
    }
  }

  // Earning Analytics
  async getEarningAnalytics(req, res) {
    try {
      const { fromDate, toDate, branchId } = req.query;
      const userType = req.user.userType;
      
      if (!fromDate || !toDate) {
        return generateErrorResponse(res, 400, 'From date and to date are required');
      }

      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const earningAnalytics = await AnalyticsService.getEarningAnalytics(
        new Date(fromDate),
        new Date(toDate),
        effectiveBranchId
      );

      return generateResponse(res, 200, 'Earning analytics retrieved successfully', {
        analytics: earningAnalytics
      });
    } catch (error) {
      console.error('Earning analytics error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve earning analytics', error.message);
    }
  }

  // Monthly Earning Chart
  async getMonthlyEarningChart(req, res) {
    try {
      const { year = new Date().getFullYear(), branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const chartData = await AnalyticsService.getMonthlyEarningChart(year, effectiveBranchId);

      return generateResponse(res, 200, 'Monthly earning chart retrieved successfully', {
        chart_data: chartData,
        year: year
      });
    } catch (error) {
      console.error('Monthly earning chart error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve monthly earning chart', error.message);
    }
  }

  // Delivery Man Performance
  async getDeliveryManPerformance(req, res) {
    try {
      const { deliveryManId, fromDate, toDate, branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const performance = await AnalyticsService.getDeliveryManPerformance(
        deliveryManId,
        fromDate ? new Date(fromDate) : null,
        toDate ? new Date(toDate) : null
      );

      // Filter by branch if needed
      const filteredPerformance = effectiveBranchId 
        ? performance.filter(p => p.delivery_man.branch_id === effectiveBranchId)
        : performance;

      return generateResponse(res, 200, 'Delivery man performance retrieved successfully', {
        performance: filteredPerformance
      });
    } catch (error) {
      console.error('Delivery man performance error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man performance', error.message);
    }
  }

  // Export Reports
  async exportReport(req, res) {
    try {
      const { reportType, format = 'pdf', ...filters } = req.query;
      const userType = req.user.userType;
      
      if (!reportType || !['order', 'earning', 'delivery', 'product', 'sale'].includes(reportType)) {
        return generateErrorResponse(res, 400, 'Invalid report type');
      }

      if (!['pdf', 'csv', 'excel'].includes(format)) {
        return generateErrorResponse(res, 400, 'Invalid export format');
      }

      // Apply role-based filtering
      if (userType === 'branch') {
        filters.branchId = req.user.branchId;
      }

      // Get report data
      let reportData;
      switch (reportType) {
        case 'order':
          reportData = await ReportService.getOrderReport(filters);
          break;
        case 'earning':
          reportData = await ReportService.getEarningReport(filters);
          break;
        case 'delivery':
          reportData = await ReportService.getDeliveryManReport(filters);
          break;
        case 'product':
          reportData = await ReportService.getProductReport(filters);
          break;
        case 'sale':
          reportData = await ReportService.getSaleReport(filters);
          break;
      }

      // Add date range to report data for export
      if (filters.fromDate && filters.toDate) {
        reportData.dateRange = {
          from: filters.fromDate,
          to: filters.toDate
        };
      }

      // Generate export file
      let exportResult;
      switch (format) {
        case 'pdf':
          exportResult = await ExportService.generatePDFReport(reportData, reportType);
          break;
        case 'csv':
          exportResult = await ExportService.generateCSVReport(reportData, reportType);
          break;
        case 'excel':
          exportResult = await ExportService.generateExcelReport(reportData, reportType);
          break;
      }

      // Send file
      res.download(exportResult.filePath, exportResult.filename, (err) => {
        if (err) {
          console.error('File download error:', err);
          return generateErrorResponse(res, 500, 'Failed to download file');
        }
      });

    } catch (error) {
      console.error('Export report error:', error);
      return generateErrorResponse(res, 500, 'Failed to export report', error.message);
    }
  }

  // Report Summary
  async getReportSummary(req, res) {
    try {
      const { fromDate, toDate, branchId } = req.query;
      const userType = req.user.userType;
      
      if (!fromDate || !toDate) {
        return generateErrorResponse(res, 400, 'From date and to date are required');
      }

      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const summary = await ReportService.getReportSummary(fromDate, toDate, effectiveBranchId);

      return generateResponse(res, 200, 'Report summary retrieved successfully', {
        summary: summary
      });
    } catch (error) {
      console.error('Report summary error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve report summary', error.message);
    }
  }

  // Get Top Selling Products
  async getTopSellingProducts(req, res) {
    try {
      const { limit = 10, branchId, fromDate, toDate } = req.query;
      const userType = req.user.userType;
      
      let whereConditions = {};
      
      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const topProducts = await AnalyticsService.getTopSellingProducts(whereConditions, parseInt(limit));

      return generateResponse(res, 200, 'Top selling products retrieved successfully', {
        products: topProducts
      });
    } catch (error) {
      console.error('Top selling products error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve top selling products', error.message);
    }
  }

  // Get Most Rated Products
  async getMostRatedProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const mostRated = await AnalyticsService.getMostRatedProducts(parseInt(limit));

      return generateResponse(res, 200, 'Most rated products retrieved successfully', {
        products: mostRated
      });
    } catch (error) {
      console.error('Most rated products error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve most rated products', error.message);
    }
  }

  // Get Top Customers
  async getTopCustomers(req, res) {
    try {
      const { limit = 10, branchId, fromDate, toDate } = req.query;
      const userType = req.user.userType;
      
      let whereConditions = {};
      
      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const topCustomers = await AnalyticsService.getTopCustomers(whereConditions, parseInt(limit));

      return generateResponse(res, 200, 'Top customers retrieved successfully', {
        customers: topCustomers
      });
    } catch (error) {
      console.error('Top customers error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve top customers', error.message);
    }
  }

  // Get Recent Orders
  async getRecentOrders(req, res) {
    try {
      const { limit = 10, branchId } = req.query;
      const userType = req.user.userType;
      
      let whereConditions = {};
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const recentOrders = await AnalyticsService.getRecentOrders(whereConditions, parseInt(limit));

      return generateResponse(res, 200, 'Recent orders retrieved successfully', {
        orders: recentOrders
      });
    } catch (error) {
      console.error('Recent orders error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve recent orders', error.message);
    }
  }

  // Cleanup old export files
  async cleanupExports(req, res) {
    try {
      await ExportService.cleanupOldExports();
      return generateResponse(res, 200, 'Export cleanup completed successfully');
    } catch (error) {
      console.error('Export cleanup error:', error);
      return generateErrorResponse(res, 500, 'Failed to cleanup exports', error.message);
    }
  }
}

module.exports = new ReportingController(); 