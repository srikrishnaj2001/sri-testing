const db = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class ReportService {
  constructor() {
    this.Order = db.Order;
    this.OrderDetail = db.OrderDetail;
    this.User = db.User;
    this.Product = db.Product;
    this.Category = db.Category;
    this.Branch = db.Branch;
    this.Review = db.Review;
  }

  // Order Reports
  async getOrderReport(filters = {}) {
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
      } = filters;

      const whereConditions = {};
      
      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      if (orderStatus) {
        whereConditions.order_status = orderStatus;
      }

      if (paymentMethod) {
        whereConditions.payment_method = paymentMethod;
      }

      if (customerId) {
        whereConditions.customer_id = customerId;
      }

      if (deliveryManId) {
        whereConditions.delivery_man_id = deliveryManId;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await this.Order.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: this.User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'email']
          },
          {
            model: this.User,
            as: 'delivery_man',
            attributes: ['id', 'f_name', 'l_name', 'phone']
          },
          {
            model: this.Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          },
          {
            model: this.OrderDetail,
            as: 'details',
            include: [
              {
                model: this.Product,
                as: 'product',
                attributes: ['id', 'name', 'image']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: offset
      });

      // Calculate summary statistics
      const totalOrders = count;
      const totalRevenue = rows.reduce((sum, order) => sum + parseFloat(order.order_amount), 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        orders: rows,
        pagination: {
          total: totalOrders,
          page: page,
          limit: limit,
          pages: Math.ceil(totalOrders / limit)
        },
        summary: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          avg_order_value: avgOrderValue
        }
      };
    } catch (error) {
      console.error('Order report error:', error);
      throw error;
    }
  }

  // Earning Reports
  async getEarningReport(filters = {}) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        groupBy = 'day' // day, week, month, year
      } = filters;

      const whereConditions = {
        order_status: 'delivered'
      };

      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      // Get earning data grouped by specified period
      const earningData = await this.getEarningDataGrouped(whereConditions, groupBy);

      // Calculate tax information
      const taxData = await this.calculateTaxData(whereConditions);

      // Get payment method breakdown
      const paymentMethodData = await this.getPaymentMethodBreakdown(whereConditions);

      return {
        earning_data: earningData,
        tax_data: taxData,
        payment_method_data: paymentMethodData,
        summary: {
          total_orders: earningData.reduce((sum, item) => sum + item.order_count, 0),
          total_revenue: earningData.reduce((sum, item) => sum + item.total_amount, 0),
          total_tax: taxData.total_tax,
          net_revenue: earningData.reduce((sum, item) => sum + item.total_amount, 0) - taxData.total_tax
        }
      };
    } catch (error) {
      console.error('Earning report error:', error);
      throw error;
    }
  }

  // Delivery Man Reports
  async getDeliveryManReport(filters = {}) {
    try {
      const {
        fromDate,
        toDate,
        deliveryManId,
        branchId,
        page = 1,
        limit = 25
      } = filters;

      const whereConditions = {};

      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      if (deliveryManId) {
        whereConditions.delivery_man_id = deliveryManId;
      }

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const offset = (page - 1) * limit;

      // Get delivery man performance data
      const deliveryManStats = await this.Order.findAll({
        attributes: [
          'delivery_man_id',
          [sequelize.fn('COUNT', sequelize.col('Order.id')), 'total_deliveries'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount'],
          [sequelize.fn('AVG', sequelize.col('delivery_time')), 'avg_delivery_time'],
          [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN order_status = 'delivered' THEN 1 END`)), 'successful_deliveries'],
          [sequelize.fn('COUNT', sequelize.literal(`CASE WHEN order_status = 'cancelled' THEN 1 END`)), 'cancelled_deliveries']
        ],
        include: [
          {
            model: this.User,
            as: 'delivery_man',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'email', 'image'],
            where: { user_type: 'delivery_man' }
          },
          {
            model: this.Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        where: whereConditions,
        group: ['delivery_man_id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Order.id')), 'DESC']],
        limit: limit,
        offset: offset
      });

      // Calculate success rate for each delivery man
      const deliveryManReport = deliveryManStats.map(item => {
        const totalDeliveries = parseInt(item.dataValues.total_deliveries);
        const successfulDeliveries = parseInt(item.dataValues.successful_deliveries);
        const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

        return {
          delivery_man_id: item.delivery_man_id,
          delivery_man: item.delivery_man,
          branch: item.branch,
          total_deliveries: totalDeliveries,
          successful_deliveries: successfulDeliveries,
          cancelled_deliveries: parseInt(item.dataValues.cancelled_deliveries),
          success_rate: successRate.toFixed(2),
          total_amount: parseFloat(item.dataValues.total_amount || 0),
          avg_delivery_time: parseFloat(item.dataValues.avg_delivery_time || 0)
        };
      });

      return {
        delivery_men: deliveryManReport,
        pagination: {
          page: page,
          limit: limit
        }
      };
    } catch (error) {
      console.error('Delivery man report error:', error);
      throw error;
    }
  }

  // Product Reports
  async getProductReport(filters = {}) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        categoryId,
        productId,
        page = 1,
        limit = 25
      } = filters;

      const whereConditions = {};

      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const offset = (page - 1) * limit;

      // Build product filter conditions
      const productIncludeWhere = {};
      if (productId) {
        productIncludeWhere.id = productId;
      }
      if (categoryId) {
        productIncludeWhere.category_id = categoryId;
      }

      const productStats = await this.OrderDetail.findAll({
        attributes: [
          'product_id',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
          [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'total_sales'],
          [sequelize.fn('COUNT', sequelize.col('OrderDetail.id')), 'total_orders'],
          [sequelize.fn('AVG', sequelize.col('price')), 'avg_price']
        ],
        include: [
          {
            model: this.Order,
            as: 'order',
            where: whereConditions,
            attributes: []
          },
          {
            model: this.Product,
            as: 'product',
            where: productIncludeWhere,
            attributes: ['id', 'name', 'image', 'price', 'category_id'],
            include: [
              {
                model: this.Category,
                as: 'category',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        group: ['product_id'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: limit,
        offset: offset
      });

      // Get product reviews
      const productReviews = await this.Review.findAll({
        attributes: [
          'product_id',
          [sequelize.fn('AVG', sequelize.col('rating')), 'avg_rating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews']
        ],
        group: ['product_id'],
        raw: true
      });

      // Map reviews to products
      const reviewsMap = {};
      productReviews.forEach(review => {
        reviewsMap[review.product_id] = {
          avg_rating: parseFloat(review.avg_rating).toFixed(2),
          total_reviews: parseInt(review.total_reviews)
        };
      });

      const productReport = productStats.map(item => ({
        product_id: item.product_id,
        product: item.product,
        category: item.product.category,
        total_quantity: parseInt(item.dataValues.total_quantity),
        total_sales: parseFloat(item.dataValues.total_sales),
        total_orders: parseInt(item.dataValues.total_orders),
        avg_price: parseFloat(item.dataValues.avg_price),
        reviews: reviewsMap[item.product_id] || { avg_rating: 0, total_reviews: 0 }
      }));

      return {
        products: productReport,
        pagination: {
          page: page,
          limit: limit
        }
      };
    } catch (error) {
      console.error('Product report error:', error);
      throw error;
    }
  }

  // Sale Reports
  async getSaleReport(filters = {}) {
    try {
      const {
        fromDate,
        toDate,
        branchId,
        page = 1,
        limit = 25
      } = filters;

      const whereConditions = {};

      if (fromDate && toDate) {
        whereConditions.created_at = {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        };
      }

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const offset = (page - 1) * limit;

      const saleData = await this.OrderDetail.findAll({
        attributes: [
          'order_id',
          'product_id',
          'quantity',
          'price',
          'discount_on_product',
          'created_at'
        ],
        include: [
          {
            model: this.Order,
            as: 'order',
            where: whereConditions,
            attributes: ['id', 'order_amount', 'created_at', 'customer_id', 'branch_id'],
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
            ]
          },
          {
            model: this.Product,
            as: 'product',
            attributes: ['id', 'name', 'image']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: limit,
        offset: offset
      });

      // Calculate totals
      const totalSales = saleData.reduce((sum, item) => {
        const itemTotal = (parseFloat(item.price) - parseFloat(item.discount_on_product || 0)) * parseInt(item.quantity);
        return sum + itemTotal;
      }, 0);

      const totalQuantity = saleData.reduce((sum, item) => sum + parseInt(item.quantity), 0);

      const saleReport = saleData.map(item => {
        const itemTotal = (parseFloat(item.price) - parseFloat(item.discount_on_product || 0)) * parseInt(item.quantity);
        return {
          order_id: item.order_id,
          date: item.created_at,
          customer: item.order.customer,
          branch: item.order.branch,
          product: item.product,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          discount: parseFloat(item.discount_on_product || 0),
          total: itemTotal
        };
      });

      return {
        sales: saleReport,
        pagination: {
          page: page,
          limit: limit
        },
        summary: {
          total_sales: totalSales,
          total_quantity: totalQuantity,
          avg_sale_value: saleData.length > 0 ? totalSales / saleData.length : 0
        }
      };
    } catch (error) {
      console.error('Sale report error:', error);
      throw error;
    }
  }

  // Helper method to get earning data grouped by period
  async getEarningDataGrouped(whereConditions, groupBy) {
    try {
      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'year':
          dateFormat = '%Y';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      return await this.Order.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat), 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount']
        ],
        where: whereConditions,
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), dateFormat)],
        order: [['period', 'ASC']],
        raw: true
      });
    } catch (error) {
      console.error('Earning data grouped error:', error);
      throw error;
    }
  }

  // Helper method to calculate tax data
  async calculateTaxData(whereConditions) {
    try {
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

      let totalTax = 0;
      let totalAddOnTax = 0;

      orders.forEach(order => {
        totalTax += parseFloat(order.total_tax_amount || 0);
        order.details.forEach(detail => {
          totalAddOnTax += parseFloat(detail.add_on_tax_amount || 0);
        });
      });

      return {
        product_tax: totalTax,
        addon_tax: totalAddOnTax,
        total_tax: totalTax + totalAddOnTax
      };
    } catch (error) {
      console.error('Tax data calculation error:', error);
      throw error;
    }
  }

  // Helper method to get payment method breakdown
  async getPaymentMethodBreakdown(whereConditions) {
    try {
      return await this.Order.findAll({
        attributes: [
          'payment_method',
          [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
          [sequelize.fn('SUM', sequelize.col('order_amount')), 'total_amount']
        ],
        where: whereConditions,
        group: ['payment_method'],
        raw: true
      });
    } catch (error) {
      console.error('Payment method breakdown error:', error);
      throw error;
    }
  }

  // Get report summary for date range
  async getReportSummary(fromDate, toDate, branchId = null) {
    try {
      const whereConditions = {
        created_at: {
          [Op.between]: [new Date(fromDate), new Date(toDate)]
        }
      };

      if (branchId) {
        whereConditions.branch_id = branchId;
      }

      const [
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalDeliveries,
        avgOrderValue
      ] = await Promise.all([
        this.Order.count({ where: whereConditions }),
        this.Order.sum('order_amount', { where: whereConditions }),
        this.Order.count({ where: whereConditions, distinct: true, col: 'customer_id' }),
        this.Order.count({ where: { ...whereConditions, order_status: 'delivered' } }),
        this.Order.findAll({
          attributes: [[sequelize.fn('AVG', sequelize.col('order_amount')), 'avg_amount']],
          where: whereConditions,
          raw: true
        }).then(result => parseFloat(result[0].avg_amount || 0))
      ]);

      return {
        total_orders: totalOrders,
        total_revenue: totalRevenue || 0,
        total_customers: totalCustomers,
        total_deliveries: totalDeliveries,
        avg_order_value: avgOrderValue
      };
    } catch (error) {
      console.error('Report summary error:', error);
      throw error;
    }
  }
}

module.exports = new ReportService(); 