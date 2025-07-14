const db = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class AnalyticsService {
  constructor() {
    this.Order = db.Order;
    this.OrderDetail = db.OrderDetail;
    this.User = db.User;
    this.Product = db.Product;
    this.Category = db.Category;
    this.Branch = db.Branch;
    this.Review = db.Review;
  }

  // Dashboard Statistics
  async getDashboardStats(branchId = null) {
    try {
      const whereConditions = branchId ? { branch_id: branchId } : {};
      
      // Basic counts
      const [
        totalCustomers,
        totalDeliveryMen,
        totalProducts,
        totalCategories,
        totalBranches,
        totalOrders
      ] = await Promise.all([
        this.User.count({ where: { user_type: null } }),
        this.User.count({ where: { user_type: 'delivery_man' } }),
        this.Product.count(),
        this.Category.count({ where: { parent_id: null } }),
        this.Branch.count(),
        this.Order.count({ where: whereConditions })
      ]);

      // Order status breakdown
      const orderStatusStats = await this.getOrderStatusStats(whereConditions);

      // Today's statistics
      const todayStats = await this.getTodayStats(whereConditions);

      // Monthly statistics
      const monthlyStats = await this.getMonthlyStats(whereConditions);

      // Top selling products
      const topSellingProducts = await this.getTopSellingProducts(whereConditions);

      // Most rated products
      const mostRatedProducts = await this.getMostRatedProducts();

      // Top customers
      const topCustomers = await this.getTopCustomers(whereConditions);

      // Recent orders
      const recentOrders = await this.getRecentOrders(whereConditions);

      return {
        basic_stats: {
          total_customers: totalCustomers,
          total_delivery_men: totalDeliveryMen,
          total_products: totalProducts,
          total_categories: totalCategories,
          total_branches: totalBranches,
          total_orders: totalOrders
        },
        order_status_stats: orderStatusStats,
        today_stats: todayStats,
        monthly_stats: monthlyStats,
        top_selling_products: topSellingProducts,
        most_rated_products: mostRatedProducts,
        top_customers: topCustomers,
        recent_orders: recentOrders
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }

  // Order Status Statistics
  async getOrderStatusStats(whereConditions = {}) {
    try {
      const orderStatusCounts = await this.Order.findAll({
        attributes: [
          'order_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: whereConditions,
        group: ['order_status'],
        raw: true
      });

      const statusStats = {
        pending: 0,
        confirmed: 0,
        preparing: 0,
        out_for_delivery: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
        failed: 0
      };

      orderStatusCounts.forEach(stat => {
        if (statusStats.hasOwnProperty(stat.order_status)) {
          statusStats[stat.order_status] = parseInt(stat.count);
        }
      });

      return statusStats;
    } catch (error) {
      console.error('Order status stats error:', error);
      throw error;
    }
  }

  // Today's Statistics
  async getTodayStats(whereConditions = {}) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const todayConditions = {
        ...whereConditions,
        created_at: {
          [Op.between]: [startOfDay, endOfDay]
        }
      };

      const [
        todayOrders,
        todayRevenue,
        todayCustomers,
        todayDeliveries
      ] = await Promise.all([
        this.Order.count({ where: todayConditions }),
        this.Order.sum('order_amount', { 
          where: { ...todayConditions, order_status: 'delivered' }
        }),
        this.Order.count({
          where: todayConditions,
          distinct: true,
          col: 'customer_id'
        }),
        this.Order.count({ 
          where: { ...todayConditions, order_status: 'delivered' }
        })
      ]);

      return {
        orders: todayOrders,
        revenue: todayRevenue || 0,
        customers: todayCustomers,
        deliveries: todayDeliveries
      };
    } catch (error) {
      console.error('Today stats error:', error);
      throw error;
    }
  }

  // Monthly Statistics
  async getMonthlyStats(whereConditions = {}) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const monthlyConditions = {
        ...whereConditions,
        created_at: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      };

      const [
        monthlyOrders,
        monthlyRevenue,
        monthlyCustomers,
        monthlyDeliveries
      ] = await Promise.all([
        this.Order.count({ where: monthlyConditions }),
        this.Order.sum('order_amount', { 
          where: { ...monthlyConditions, order_status: 'delivered' }
        }),
        this.Order.count({
          where: monthlyConditions,
          distinct: true,
          col: 'customer_id'
        }),
        this.Order.count({ 
          where: { ...monthlyConditions, order_status: 'delivered' }
        })
      ]);

      return {
        orders: monthlyOrders,
        revenue: monthlyRevenue || 0,
        customers: monthlyCustomers,
        deliveries: monthlyDeliveries
      };
    } catch (error) {
      console.error('Monthly stats error:', error);
      throw error;
    }
  }

  // Top Selling Products
  async getTopSellingProducts(whereConditions = {}, limit = 6) {
    try {
      const topProducts = await this.OrderDetail.findAll({
        attributes: [
          'product_id',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
          [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'total_sales']
        ],
        include: [
          {
            model: this.Order,
            as: 'order',
            where: {
              ...whereConditions,
              order_status: 'delivered'
            },
            attributes: []
          },
          {
            model: this.Product,
            as: 'product',
            attributes: ['id', 'name', 'image', 'price']
          }
        ],
        group: ['product_id'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: limit
      });

      return topProducts.map(item => ({
        product_id: item.product_id,
        product: item.product,
        total_quantity: parseInt(item.dataValues.total_quantity),
        total_sales: parseFloat(item.dataValues.total_sales)
      }));
    } catch (error) {
      console.error('Top selling products error:', error);
      throw error;
    }
  }

  // Most Rated Products
  async getMostRatedProducts(limit = 7) {
    try {
      const mostRated = await this.Review.findAll({
        attributes: [
          'product_id',
          [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews']
        ],
        include: [
          {
            model: this.Product,
            as: 'product',
            attributes: ['id', 'name', 'image', 'price']
          }
        ],
        group: ['product_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: limit
      });

      return mostRated.map(item => ({
        product_id: item.product_id,
        product: item.product,
        avg_rating: parseFloat(item.dataValues.avg_rating).toFixed(2),
        total_reviews: parseInt(item.dataValues.total_reviews)
      }));
    } catch (error) {
      console.error('Most rated products error:', error);
      throw error;
    }
  }

  // Top Customers
  async getTopCustomers(whereConditions = {}, limit = 6) {
    try {
      const topCustomers = await this.Order.findAll({
        attributes: [
          'customer_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_spent']
        ],
        include: [
          {
            model: this.User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
          }
        ],
        where: whereConditions,
        group: ['customer_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: limit
      });

      return topCustomers.map(item => ({
        customer_id: item.customer_id,
        customer: item.customer,
        total_orders: parseInt(item.dataValues.total_orders),
        total_spent: parseFloat(item.dataValues.total_spent)
      }));
    } catch (error) {
      console.error('Top customers error:', error);
      throw error;
    }
  }

  // Recent Orders
  async getRecentOrders(whereConditions = {}, limit = 5) {
    try {
      const recentOrders = await this.Order.findAll({
        where: whereConditions,
        include: [
          {
            model: this.User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone']
          },
          {
            model: this.Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: limit
      });

      return recentOrders;
    } catch (error) {
      console.error('Recent orders error:', error);
      throw error;
    }
  }

  // Earning Analytics
  async getEarningAnalytics(fromDate, toDate, branchId = null) {
    try {
      const whereConditions = {
        order_status: 'delivered',
        created_at: {
          [Op.between]: [fromDate, toDate]
        }
      };

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const orders = await this.Order.findAll({
        where: whereConditions,
        include: [
          {
            model: this.OrderDetail,
            as: 'details',
            attributes: ['add_on_tax_amount']
          }
        ]
      });

      let totalRevenue = 0;
      let totalTax = 0;
      let totalAddOnTax = 0;

      orders.forEach(order => {
        totalRevenue += parseFloat(order.order_amount);
        totalTax += parseFloat(order.total_tax_amount);
        
        order.details.forEach(detail => {
          totalAddOnTax += parseFloat(detail.add_on_tax_amount || 0);
        });
      });

      return {
        total_orders: orders.length,
        total_revenue: totalRevenue,
        total_tax: totalTax,
        total_addon_tax: totalAddOnTax,
        total_tax_amount: totalTax + totalAddOnTax,
        net_revenue: totalRevenue - (totalTax + totalAddOnTax)
      };
    } catch (error) {
      console.error('Earning analytics error:', error);
      throw error;
    }
  }

  // Order Analytics by Date Range
  async getOrderAnalytics(fromDate, toDate, branchId = null) {
    try {
      const whereConditions = {
        created_at: {
          [Op.between]: [fromDate, toDate]
        }
      };

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const [
        ordersByStatus,
        ordersByPaymentMethod,
        ordersByDate
      ] = await Promise.all([
        this.getOrdersByStatus(whereConditions),
        this.getOrdersByPaymentMethod(whereConditions),
        this.getOrdersByDate(fromDate, toDate, whereConditions)
      ]);

      return {
        orders_by_status: ordersByStatus,
        orders_by_payment_method: ordersByPaymentMethod,
        orders_by_date: ordersByDate
      };
    } catch (error) {
      console.error('Order analytics error:', error);
      throw error;
    }
  }

  // Orders by Status
  async getOrdersByStatus(whereConditions = {}) {
    try {
      return await this.Order.findAll({
        attributes: [
          'order_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount']
        ],
        where: whereConditions,
        group: ['order_status'],
        raw: true
      });
    } catch (error) {
      console.error('Orders by status error:', error);
      throw error;
    }
  }

  // Orders by Payment Method
  async getOrdersByPaymentMethod(whereConditions = {}) {
    try {
      return await this.Order.findAll({
        attributes: [
          'payment_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount']
        ],
        where: whereConditions,
        group: ['payment_method'],
        raw: true
      });
    } catch (error) {
      console.error('Orders by payment method error:', error);
      throw error;
    }
  }

  // Orders by Date
  async getOrdersByDate(fromDate, toDate, whereConditions = {}) {
    try {
      return await this.Order.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount']
        ],
        where: whereConditions,
        group: [sequelize.fn('DATE', sequelize.col('created_at'))],
        order: [['date', 'ASC']],
        raw: true
      });
    } catch (error) {
      console.error('Orders by date error:', error);
      throw error;
    }
  }

  // Monthly Earning Chart Data
  async getMonthlyEarningChart(year, branchId = null) {
    try {
      const whereConditions = {
        order_status: 'delivered',
        created_at: {
          [Op.between]: [
            new Date(year, 0, 1),
            new Date(year, 11, 31, 23, 59, 59)
          ]
        }
      };

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const monthlyData = await this.Order.findAll({
        attributes: [
          [sequelize.fn('MONTH', sequelize.col('created_at')), 'month'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount']
        ],
        where: whereConditions,
        group: [sequelize.fn('MONTH', sequelize.col('created_at'))],
        order: [['month', 'ASC']],
        raw: true
      });

      // Initialize array with 12 months
      const chartData = Array(12).fill(0);
      
      monthlyData.forEach(item => {
        chartData[item.month - 1] = parseFloat(item.total_amount);
      });

      return chartData;
    } catch (error) {
      console.error('Monthly earning chart error:', error);
      throw error;
    }
  }

  // Delivery Man Performance
  async getDeliveryManPerformance(deliveryManId = null, fromDate = null, toDate = null) {
    try {
      const whereConditions = {
        order_status: 'delivered'
      };

      if (deliveryManId) {
        whereConditions.delivery_man_id = deliveryManId;
      }

      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [fromDate, toDate]
        };
      }

      const performanceData = await this.Order.findAll({
        attributes: [
          'delivery_man_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_deliveries'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount'],
          [sequelize.fn('AVG', sequelize.col('delivery_time')), 'avg_delivery_time']
        ],
        include: [
          {
            model: this.User,
            as: 'delivery_man',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'image']
          }
        ],
        where: whereConditions,
        group: ['delivery_man_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: false
      });

      return performanceData.map(item => ({
        delivery_man_id: item.delivery_man_id,
        delivery_man: item.delivery_man,
        total_deliveries: parseInt(item.dataValues.total_deliveries),
        total_amount: parseFloat(item.dataValues.total_amount),
        avg_delivery_time: parseFloat(item.dataValues.avg_delivery_time || 0)
      }));
    } catch (error) {
      console.error('Delivery man performance error:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService(); 