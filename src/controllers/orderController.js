const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { Order, User, Branch } = db;

class OrderController {
  // Place a new order
  async placeOrder(req, res) {
    try {
      const { userId } = req.user;
      const orderData = req.body;

      // Validate required fields
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return generateErrorResponse(res, 400, 'Order items are required');
      }

      if (!orderData.delivery_address && orderData.order_type === 'delivery') {
        return generateErrorResponse(res, 400, 'Delivery address is required for delivery orders');
      }

      // Get customer information
      const customer = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Calculate order totals
      const orderCalculation = await this.calculateOrderTotals(orderData.items, orderData);

      // Prepare order data
      const orderToCreate = {
        customer_id: userId,
        branch_id: orderData.branch_id || 1,
        order_type: orderData.order_type || 'delivery',
        payment_method: orderData.payment_method,
        order_amount: orderCalculation.subtotal,
        tax_amount: orderCalculation.tax_amount,
        delivery_charge: orderCalculation.delivery_charge,
        total_tax_amount: orderCalculation.total_tax_amount,
        coupon_discount_amount: orderCalculation.coupon_discount || 0,
        coupon_code: orderData.coupon_code || null,
        coupon_discount_title: orderData.coupon_title || null,
        extra_discount: orderData.extra_discount || 0,
        order_note: orderData.order_note || null,
        delivery_address: orderData.delivery_address || null,
        delivery_address_id: orderData.delivery_address_id || null,
        delivery_instructions: orderData.delivery_instructions || null,
        scheduled: orderData.scheduled || false,
        schedule_at: orderData.schedule_at || null,
        delivery_date: orderData.delivery_date || null,
        delivery_time: orderData.delivery_time || null,
        preparation_time: orderData.preparation_time || 30,
        table_id: orderData.table_id || null,
        number_of_people: orderData.number_of_people || null,
        customer_info: {
          id: customer.id,
          name: customer.getFullName(),
          phone: customer.phone,
          email: customer.email
        },
        items: orderData.items,
        estimated_delivery_time: this.calculateEstimatedDeliveryTime(orderData.preparation_time || 30)
      };

      // Create order
      const order = await Order.create(orderToCreate);

      // Get complete order details
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'email']
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address', 'phone']
          }
        ]
      });

      return generateResponse(res, 201, 'Order placed successfully', {
        order: completeOrder,
        estimated_delivery_time: orderToCreate.estimated_delivery_time,
        order_number: order.order_number
      });

    } catch (error) {
      console.error('Place order error:', error);
      return generateErrorResponse(res, 500, 'Failed to place order', error.message);
    }
  }

  // Get customer orders
  async getCustomerOrders(req, res) {
    try {
      const { userId } = req.user;
      const { 
        page = 1, 
        limit = 20, 
        status,
        order_type,
        date_from,
        date_to 
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {
        customer_id: userId
      };
      
      if (status) {
        whereConditions.order_status = status;
      }
      
      if (order_type) {
        whereConditions.order_type = order_type;
      }
      
      if (date_from || date_to) {
        whereConditions.created_at = {};
        if (date_from) {
          whereConditions.created_at[Op.gte] = new Date(date_from);
        }
        if (date_to) {
          whereConditions.created_at[Op.lte] = new Date(date_to);
        }
      }

      // Get orders
      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'deliveryMan',
            attributes: ['id', 'f_name', 'l_name', 'phone'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address', 'phone'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      return generateResponse(res, 200, 'Customer orders retrieved successfully', {
        orders,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit),
          has_next: page * limit < count,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Get customer orders error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve orders', error.message);
    }
  }

  // Get order details by ID
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;
      const { userId, userType } = req.user;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Build where conditions based on user type
      const whereConditions = { id: orderId };
      
      // If customer, only show their own orders
      if (userType === 'customer' || !userType) {
        whereConditions.customer_id = userId;
      }

      const order = await Order.findOne({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'email']
          },
          {
            model: User,
            as: 'deliveryMan',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'current_location'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address', 'phone', 'latitude', 'longitude']
          }
        ]
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      return generateResponse(res, 200, 'Order details retrieved successfully', {
        order
      });

    } catch (error) {
      console.error('Get order by ID error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order details', error.message);
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { userId, userType } = req.user;
      const { reason } = req.body;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Build where conditions based on user type
      const whereConditions = { id: orderId };
      
      // If customer, only allow cancelling their own orders
      if (userType === 'customer' || !userType) {
        whereConditions.customer_id = userId;
      }

      const order = await Order.findOne({
        where: whereConditions
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      // Check if order can be cancelled
      if (!order.canBeCancelled()) {
        return generateErrorResponse(res, 400, 'Order cannot be cancelled at this stage');
      }

      // Cancel order
      await order.update({
        order_status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: userType || 'customer',
        canceled: new Date()
      });

      return generateResponse(res, 200, 'Order cancelled successfully', {
        order_id: orderId,
        cancellation_reason: reason,
        cancelled_at: new Date()
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      return generateErrorResponse(res, 500, 'Failed to cancel order', error.message);
    }
  }

  // Track order
  async trackOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { userId, userType } = req.user;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Build where conditions based on user type
      const whereConditions = { id: orderId };
      
      // If customer, only show their own orders
      if (userType === 'customer' || !userType) {
        whereConditions.customer_id = userId;
      }

      const order = await Order.findOne({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'deliveryMan',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'current_location'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address', 'latitude', 'longitude']
          }
        ]
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      // Get tracking information
      const trackingInfo = {
        order_id: order.id,
        order_number: order.order_number,
        current_status: order.order_status,
        status_timeline: order.getStatusTimeline(),
        estimated_delivery_time: order.estimated_delivery_time,
        actual_delivery_time: order.actual_delivery_time,
        delivery_man: order.deliveryMan ? {
          id: order.deliveryMan.id,
          name: order.deliveryMan.getFullName(),
          phone: order.deliveryMan.phone,
          current_location: order.deliveryMan.current_location
        } : null,
        branch_location: order.branch ? {
          latitude: order.branch.latitude,
          longitude: order.branch.longitude,
          address: order.branch.address
        } : null,
        delivery_address: order.delivery_address,
        can_cancel: order.canBeCancelled(),
        is_active: order.isActive()
      };

      return generateResponse(res, 200, 'Order tracking information retrieved successfully', {
        tracking: trackingInfo
      });

    } catch (error) {
      console.error('Track order error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve tracking information', error.message);
    }
  }

  // Reorder (place same order again)
  async reorder(req, res) {
    try {
      const { orderId } = req.params;
      const { userId } = req.user;
      const additionalData = req.body;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Get original order
      const originalOrder = await Order.findOne({
        where: { 
          id: orderId,
          customer_id: userId
        }
      });

      if (!originalOrder) {
        return generateErrorResponse(res, 404, 'Original order not found');
      }

      // Prepare new order data based on original order
      const newOrderData = {
        items: originalOrder.items,
        order_type: originalOrder.order_type,
        payment_method: additionalData.payment_method || originalOrder.payment_method,
        delivery_address: additionalData.delivery_address || originalOrder.delivery_address,
        delivery_instructions: additionalData.delivery_instructions || originalOrder.delivery_instructions,
        branch_id: originalOrder.branch_id,
        ...additionalData
      };

      // Place new order using existing placeOrder logic
      req.body = newOrderData;
      return await this.placeOrder(req, res);

    } catch (error) {
      console.error('Reorder error:', error);
      return generateErrorResponse(res, 500, 'Failed to reorder', error.message);
    }
  }

  // Rate and review order
  async rateOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { userId } = req.user;
      const { rating, review } = req.body;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      if (!rating || rating < 1 || rating > 5) {
        return generateErrorResponse(res, 400, 'Rating must be between 1 and 5');
      }

      // Find order
      const order = await Order.findOne({
        where: { 
          id: orderId,
          customer_id: userId,
          order_status: 'delivered'
        }
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Delivered order not found');
      }

      if (order.rating) {
        return generateErrorResponse(res, 400, 'Order has already been rated');
      }

      // Update order with rating and review
      await order.update({
        rating: parseFloat(rating),
        review: review || null
      });

      return generateResponse(res, 200, 'Order rated successfully', {
        order_id: orderId,
        rating: parseFloat(rating),
        review: review || null
      });

    } catch (error) {
      console.error('Rate order error:', error);
      return generateErrorResponse(res, 500, 'Failed to rate order', error.message);
    }
  }

  // Get order statistics
  async getOrderStats(req, res) {
    try {
      const { userId, userType } = req.user;

      // Build where conditions based on user type
      const whereConditions = {};
      
      if (userType === 'customer' || !userType) {
        whereConditions.customer_id = userId;
      }

      const stats = {
        total_orders: await Order.count({ where: whereConditions }),
        pending_orders: await Order.count({ 
          where: { ...whereConditions, order_status: 'pending' }
        }),
        confirmed_orders: await Order.count({ 
          where: { ...whereConditions, order_status: 'confirmed' }
        }),
        preparing_orders: await Order.count({ 
          where: { ...whereConditions, order_status: 'preparing' }
        }),
        delivered_orders: await Order.count({ 
          where: { ...whereConditions, order_status: 'delivered' }
        }),
        cancelled_orders: await Order.count({ 
          where: { ...whereConditions, order_status: 'cancelled' }
        }),
        total_amount_spent: await Order.sum('order_amount', { 
          where: { ...whereConditions, order_status: 'delivered' }
        }) || 0,
        average_order_value: await Order.findAll({
          attributes: [
            [db.sequelize.fn('AVG', db.sequelize.col('order_amount')), 'avg_amount']
          ],
          where: { ...whereConditions, order_status: 'delivered' },
          raw: true
        }).then(result => parseFloat(result[0].avg_amount).toFixed(2))
      };

      return generateResponse(res, 200, 'Order statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get order stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order statistics', error.message);
    }
  }

  // Helper methods
  async calculateOrderTotals(items, orderData) {
    // Mock calculation - would implement real product price calculation
    let subtotal = 0;
    
    for (const item of items) {
      const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
      subtotal += itemTotal;
    }

    const taxRate = 0.1; // 10% tax
    const tax_amount = subtotal * taxRate;
    
    let delivery_charge = 0;
    if (orderData.order_type === 'delivery') {
      delivery_charge = subtotal >= 50 ? 0 : 5; // Free delivery over $50
    }

    return {
      subtotal,
      tax_amount,
      delivery_charge,
      total_tax_amount: tax_amount,
      coupon_discount: orderData.coupon_discount || 0
    };
  }

  calculateEstimatedDeliveryTime(preparationTime) {
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + (preparationTime + 20) * 60000); // prep time + 20 min delivery
    return deliveryTime;
  }
}

module.exports = new OrderController(); 