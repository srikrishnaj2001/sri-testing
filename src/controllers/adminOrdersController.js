const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { User } = db;

class AdminOrdersController {
  // Get all orders with filters and pagination
  async getOrders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        customer_id, 
        delivery_man_id, 
        date_from, 
        date_to,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {};
      
      if (status) {
        whereConditions.status = status;
      }
      
      if (customer_id) {
        whereConditions.customer_id = customer_id;
      }
      
      if (delivery_man_id) {
        whereConditions.delivery_man_id = delivery_man_id;
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
      
      if (search) {
        whereConditions[Op.or] = [
          { order_number: { [Op.iLike]: `%${search}%` } },
          { customer_name: { [Op.iLike]: `%${search}%` } },
          { customer_phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Mock orders data (would be real database query)
      const mockOrders = this.generateMockOrders(100);
      
      // Apply filters to mock data
      let filteredOrders = mockOrders;
      
      if (status) {
        filteredOrders = filteredOrders.filter(order => order.status === status);
      }
      
      if (search) {
        filteredOrders = filteredOrders.filter(order => 
          order.order_number.toLowerCase().includes(search.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          order.customer_phone.includes(search)
        );
      }
      
      // Sort orders
      filteredOrders.sort((a, b) => {
        if (sort_order === 'asc') {
          return a[sort_by] > b[sort_by] ? 1 : -1;
        }
        return a[sort_by] < b[sort_by] ? 1 : -1;
      });
      
      // Pagination
      const totalOrders = filteredOrders.length;
      const paginatedOrders = filteredOrders.slice(offset, offset + parseInt(limit));
      
      return generateResponse(res, 200, 'Orders retrieved successfully', {
        orders: paginatedOrders,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalOrders,
          total_pages: Math.ceil(totalOrders / limit),
          has_next: page * limit < totalOrders,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Get orders error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve orders', error.message);
    }
  }

  // Get order details by ID
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Mock order details (would be real database query)
      const orderDetails = {
        id: orderId,
        order_number: `ORD-${String(orderId).padStart(6, '0')}`,
        status: 'delivered',
        customer: {
          id: 1,
          name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com'
        },
        delivery_man: {
          id: 1,
          name: 'Mike Wilson',
          phone: '+1234567891',
          rating: 4.8
        },
        items: [
          {
            id: 1,
            name: 'Margherita Pizza',
            quantity: 2,
            price: 12.99,
            total: 25.98
          },
          {
            id: 2,
            name: 'Coca Cola',
            quantity: 1,
            price: 2.50,
            total: 2.50
          }
        ],
        pricing: {
          subtotal: 28.48,
          tax: 2.28,
          delivery_fee: 3.99,
          discount: 0,
          total: 34.75
        },
        addresses: {
          pickup: {
            address: '123 Restaurant St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          },
          delivery: {
            address: '456 Customer Ave',
            city: 'New York',
            state: 'NY',
            zip: '10002'
          }
        },
        timestamps: {
          ordered_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          confirmed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          prepared_at: new Date(Date.now() - 1 * 60 * 60 * 1000),
          picked_up_at: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
          delivered_at: new Date()
        },
        payment: {
          method: 'credit_card',
          status: 'paid',
          transaction_id: 'TXN123456789'
        },
        notes: 'Please ring the doorbell',
        estimated_delivery: new Date(Date.now() + 30 * 60 * 1000),
        tracking_info: {
          current_location: {
            latitude: 40.7128,
            longitude: -74.0060
          },
          estimated_arrival: new Date(Date.now() + 15 * 60 * 1000)
        }
      };

      return generateResponse(res, 200, 'Order details retrieved successfully', {
        order: orderDetails
      });

    } catch (error) {
      console.error('Get order details error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order details', error.message);
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      if (!status) {
        return generateErrorResponse(res, 400, 'Status is required');
      }

      const validStatuses = [
        'pending', 'confirmed', 'preparing', 'ready_for_pickup', 
        'picked_up', 'on_the_way', 'delivered', 'cancelled'
      ];

      if (!validStatuses.includes(status)) {
        return generateErrorResponse(res, 400, 'Invalid status provided');
      }

      // Mock order update (would be real database update)
      const updatedOrder = {
        id: orderId,
        status,
        notes,
        updated_at: new Date(),
        updated_by: req.user.userId
      };

      return generateResponse(res, 200, 'Order status updated successfully', {
        order: updatedOrder
      });

    } catch (error) {
      console.error('Update order status error:', error);
      return generateErrorResponse(res, 500, 'Failed to update order status', error.message);
    }
  }

  // Assign delivery man to order
  async assignDeliveryMan(req, res) {
    try {
      const { orderId } = req.params;
      const { delivery_man_id } = req.body;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      if (!delivery_man_id) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Check if delivery man exists and is available
      const deliveryMan = await User.findOne({
        where: { 
          id: delivery_man_id, 
          user_type: 'delivery_man',
          is_available: true
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Available delivery man not found');
      }

      // Mock assignment (would be real database update)
      const assignedOrder = {
        id: orderId,
        delivery_man_id,
        delivery_man_name: `${deliveryMan.f_name} ${deliveryMan.l_name}`,
        assigned_at: new Date(),
        assigned_by: req.user.userId
      };

      return generateResponse(res, 200, 'Delivery man assigned successfully', {
        order: assignedOrder
      });

    } catch (error) {
      console.error('Assign delivery man error:', error);
      return generateErrorResponse(res, 500, 'Failed to assign delivery man', error.message);
    }
  }

  // Get order statistics
  async getOrderStats(req, res) {
    try {
      const { period = 'today' } = req.query;

      // Mock statistics (would be real database queries)
      const stats = {
        total_orders: Math.floor(Math.random() * 1000) + 500,
        pending_orders: Math.floor(Math.random() * 50) + 10,
        confirmed_orders: Math.floor(Math.random() * 100) + 30,
        preparing_orders: Math.floor(Math.random() * 25) + 5,
        ready_for_pickup: Math.floor(Math.random() * 15) + 3,
        out_for_delivery: Math.floor(Math.random() * 20) + 8,
        delivered_orders: Math.floor(Math.random() * 800) + 400,
        cancelled_orders: Math.floor(Math.random() * 30) + 10,
        average_order_value: (Math.random() * 50 + 25).toFixed(2),
        total_revenue: (Math.random() * 50000 + 25000).toFixed(2),
        average_preparation_time: Math.floor(Math.random() * 20) + 15,
        average_delivery_time: Math.floor(Math.random() * 30) + 25
      };

      return generateResponse(res, 200, 'Order statistics retrieved successfully', {
        stats,
        period
      });

    } catch (error) {
      console.error('Get order stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order statistics', error.message);
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Mock cancellation (would be real database update)
      const cancelledOrder = {
        id: orderId,
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date(),
        cancelled_by: req.user.userId
      };

      return generateResponse(res, 200, 'Order cancelled successfully', {
        order: cancelledOrder
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      return generateErrorResponse(res, 500, 'Failed to cancel order', error.message);
    }
  }

  // Get order history/timeline
  async getOrderHistory(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      // Mock order history (would be real database query)
      const history = [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          description: 'Order placed by customer',
          user: 'Customer'
        },
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          description: 'Order confirmed by restaurant',
          user: 'Restaurant Manager'
        },
        {
          status: 'preparing',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          description: 'Order preparation started',
          user: 'Kitchen Staff'
        },
        {
          status: 'ready_for_pickup',
          timestamp: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
          description: 'Order ready for pickup',
          user: 'Kitchen Staff'
        },
        {
          status: 'picked_up',
          timestamp: new Date(Date.now() - 0.25 * 60 * 60 * 1000),
          description: 'Order picked up by delivery man',
          user: 'Delivery Man'
        },
        {
          status: 'delivered',
          timestamp: new Date(),
          description: 'Order delivered to customer',
          user: 'Delivery Man'
        }
      ];

      return generateResponse(res, 200, 'Order history retrieved successfully', {
        order_id: orderId,
        history
      });

    } catch (error) {
      console.error('Get order history error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order history', error.message);
    }
  }

  // Helper method to generate mock orders
  generateMockOrders(count) {
    const orders = [];
    const statuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered', 'cancelled'];
    
    for (let i = 1; i <= count; i++) {
      orders.push({
        id: i,
        order_number: `ORD-${String(i).padStart(6, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        customer_name: `Customer ${i}`,
        customer_phone: `+123456789${i}`,
        delivery_man_name: `Delivery Man ${Math.floor(Math.random() * 20) + 1}`,
        total_amount: (Math.random() * 100 + 20).toFixed(2),
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        estimated_delivery: new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000),
        items_count: Math.floor(Math.random() * 5) + 1,
        payment_method: ['credit_card', 'paypal', 'cash_on_delivery'][Math.floor(Math.random() * 3)]
      });
    }
    
    return orders;
  }
}

module.exports = new AdminOrdersController(); 