const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const AnalyticsService = require('../services/AnalyticsService');

const { User, Product, Category } = db;

class AdminDashboardController {
  // Get dashboard overview statistics
  async getDashboardStats(req, res) {
    try {
      const { branchId } = req.query;
      const userType = req.user.userType;
      
      // Branch managers can only see their branch data
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      // Get comprehensive dashboard statistics from AnalyticsService
      const dashboardStats = await AnalyticsService.getDashboardStats(effectiveBranchId);

      return generateResponse(res, 200, 'Dashboard statistics retrieved successfully', {
        stats: dashboardStats
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve dashboard statistics', error.message);
    }
  }

  // Get order statistics with optional filtering
  async getOrderStats(req, res) {
    try {
      const { branchId, fromDate, toDate } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      let whereConditions = {};
      
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      if (fromDate && toDate) {
        whereConditions.created_at = {
          [db.Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      const orderStatusStats = await AnalyticsService.getOrderStatusStats(whereConditions);

      return generateResponse(res, 200, 'Order statistics retrieved successfully', {
        order_stats: orderStatusStats
      });
    } catch (error) {
      console.error('Order stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order statistics', error.message);
    }
  }

  // Get earning statistics
  async getEarningStats(req, res) {
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

      return generateResponse(res, 200, 'Earning statistics retrieved successfully', {
        earning_stats: earningAnalytics
      });
    } catch (error) {
      console.error('Earning stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve earning statistics', error.message);
    }
  }

  // Get monthly earning chart data
  async getMonthlyEarningChart(req, res) {
    try {
      const { year = new Date().getFullYear(), branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      const chartData = await AnalyticsService.getMonthlyEarningChart(year, effectiveBranchId);

      return generateResponse(res, 200, 'Monthly earning chart retrieved successfully', {
        chart_data: chartData,
        year: year,
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
      });
    } catch (error) {
      console.error('Monthly earning chart error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve monthly earning chart', error.message);
    }
  }

  // Get top performing metrics
  async getTopPerformingData(req, res) {
    try {
      const { branchId, limit = 5 } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      let whereConditions = {};
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const [
        topSellingProducts,
        mostRatedProducts,
        topCustomers
      ] = await Promise.all([
        AnalyticsService.getTopSellingProducts(whereConditions, parseInt(limit)),
        AnalyticsService.getMostRatedProducts(parseInt(limit)),
        AnalyticsService.getTopCustomers(whereConditions, parseInt(limit))
      ]);

      return generateResponse(res, 200, 'Top performing data retrieved successfully', {
        top_selling_products: topSellingProducts,
        most_rated_products: mostRatedProducts,
        top_customers: topCustomers
      });
    } catch (error) {
      console.error('Top performing data error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve top performing data', error.message);
    }
  }

  // Get recent activities
  async getRecentActivities(req, res) {
    try {
      const { branchId, limit = 10 } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      let whereConditions = {};
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const recentOrders = await AnalyticsService.getRecentOrders(whereConditions, parseInt(limit));

      return generateResponse(res, 200, 'Recent activities retrieved successfully', {
        recent_orders: recentOrders
      });
    } catch (error) {
      console.error('Recent activities error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve recent activities', error.message);
    }
  }

  // Get today's summary
  async getTodaysSummary(req, res) {
    try {
      const { branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      let whereConditions = {};
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const todayStats = await AnalyticsService.getTodayStats(whereConditions);

      return generateResponse(res, 200, "Today's summary retrieved successfully", {
        today_stats: todayStats
      });
    } catch (error) {
      console.error("Today's summary error:", error);
      return generateErrorResponse(res, 500, "Failed to retrieve today's summary", error.message);
    }
  }

  // Get monthly summary
  async getMonthlySummary(req, res) {
    try {
      const { branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      let whereConditions = {};
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const monthlyStats = await AnalyticsService.getMonthlyStats(whereConditions);

      return generateResponse(res, 200, 'Monthly summary retrieved successfully', {
        monthly_stats: monthlyStats
      });
    } catch (error) {
      console.error('Monthly summary error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve monthly summary', error.message);
    }
  }

  // Get system overview (legacy support)
  async getSystemOverview(req, res) {
    try {
      // Keep existing implementation for backward compatibility
      const totalCustomers = await User.count({
        where: { user_type: null }
      });

      const totalDeliveryMen = await User.count({
        where: { user_type: 'delivery_man' }
      });

      const totalProducts = await Product.count();
      const totalCategories = await Category.count();

      const overview = {
        total_customers: totalCustomers,
        total_delivery_men: totalDeliveryMen,
        total_products: totalProducts,
        total_categories: totalCategories
      };

      return generateResponse(res, 200, 'System overview retrieved successfully', {
        overview: overview
      });
    } catch (error) {
      console.error('System overview error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve system overview', error.message);
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const { period = 'month', branchId } = req.query; // day, week, month, year
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      // Calculate date range based on period
      const now = new Date();
      let fromDate, toDate;

      switch (period) {
        case 'day':
          fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'month':
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          fromDate = new Date(now.getFullYear(), 0, 1);
          toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }

      const [
        orderAnalytics,
        earningAnalytics
      ] = await Promise.all([
        AnalyticsService.getOrderAnalytics(fromDate, toDate, effectiveBranchId),
        AnalyticsService.getEarningAnalytics(fromDate, toDate, effectiveBranchId)
      ]);

      return generateResponse(res, 200, 'Performance metrics retrieved successfully', {
        period: period,
        date_range: { from: fromDate, to: toDate },
        order_analytics: orderAnalytics,
        earning_analytics: earningAnalytics
      });
    } catch (error) {
      console.error('Performance metrics error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve performance metrics', error.message);
    }
  }

  // Get chart data for dashboard
  async getChartData(req, res) {
    try {
      const { branchId, period = 'month' } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      // Get monthly earning chart data
      const year = new Date().getFullYear();
      const monthlyEarningChart = await AnalyticsService.getMonthlyEarningChart(year, effectiveBranchId);

      // Get order analytics for the period
      const now = new Date();
      let fromDate, toDate;

      switch (period) {
        case 'week':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          toDate = now;
          break;
        case 'month':
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          fromDate = new Date(now.getFullYear(), 0, 1);
          toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
          toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }

      const orderAnalytics = await AnalyticsService.getOrderAnalytics(fromDate, toDate, effectiveBranchId);

      return generateResponse(res, 200, 'Chart data retrieved successfully', {
        monthly_earning_chart: monthlyEarningChart,
        order_analytics: orderAnalytics,
        year: year,
        period: period,
        date_range: { from: fromDate, to: toDate }
      });
    } catch (error) {
      console.error('Chart data error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve chart data', error.message);
    }
  }

  // Get real-time stats for dashboard
  async getRealTimeStats(req, res) {
    try {
      const { branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      // Get today's real-time statistics
      let whereConditions = {};
      if (effectiveBranchId) {
        whereConditions.branch_id = effectiveBranchId;
      }

      const [
        todayStats,
        recentOrders,
        orderStatusStats
      ] = await Promise.all([
        AnalyticsService.getTodayStats(whereConditions),
        AnalyticsService.getRecentOrders(whereConditions, 5),
        AnalyticsService.getOrderStatusStats(whereConditions)
      ]);

      return generateResponse(res, 200, 'Real-time statistics retrieved successfully', {
        today_stats: todayStats,
        recent_orders: recentOrders,
        order_status_stats: orderStatusStats,
        last_updated: new Date()
      });
    } catch (error) {
      console.error('Real-time stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve real-time statistics', error.message);
    }
  }

  // Get system health status
  async getSystemHealth(req, res) {
    try {
      const { branchId } = req.query;
      const userType = req.user.userType;
      
      const effectiveBranchId = userType === 'branch' ? req.user.branchId : branchId;

      // Check database connectivity
      let dbStatus = 'healthy';
      let dbResponseTime = 0;
      
      try {
        const start = Date.now();
        await db.sequelize.authenticate();
        dbResponseTime = Date.now() - start;
      } catch (error) {
        dbStatus = 'unhealthy';
        dbResponseTime = -1;
      }

      // Get system overview
      const [
        totalCustomers,
        totalDeliveryMen,
        totalProducts,
        totalCategories,
        totalOrders,
        todayOrders
      ] = await Promise.all([
        User.count({ where: { user_type: null } }),
        User.count({ where: { user_type: 'delivery_man' } }),
        Product.count(),
        Category.count(),
        db.Order.count(),
        db.Order.count({
          where: {
            created_at: {
              [db.Sequelize.Op.gte]: new Date(new Date().toDateString())
            }
          }
        })
      ]);

      const systemHealth = {
        status: dbStatus === 'healthy' ? 'operational' : 'degraded',
        database: {
          status: dbStatus,
          response_time_ms: dbResponseTime,
          connection_pool: 'active'
        },
        system_metrics: {
          total_customers: totalCustomers,
          total_delivery_men: totalDeliveryMen,
          total_products: totalProducts,
          total_categories: totalCategories,
          total_orders: totalOrders,
          today_orders: todayOrders
        },
        memory_usage: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        },
        uptime: process.uptime(),
        last_checked: new Date()
      };

      return generateResponse(res, 200, 'System health retrieved successfully', {
        health: systemHealth
      });
    } catch (error) {
      console.error('System health error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve system health', error.message);
    }
  }
}

module.exports = new AdminDashboardController(); 