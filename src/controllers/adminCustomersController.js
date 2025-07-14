const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { User } = db;

class AdminCustomersController {
  // Get all customers with filters and pagination
  async getCustomers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search,
        status,
        sort_by = 'created_at',
        sort_order = 'desc',
        date_from,
        date_to
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {
        user_type: null // null means customer
      };
      
      if (status) {
        whereConditions.is_active = status === 'active' ? 1 : 0;
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
          { f_name: { [Op.iLike]: `%${search}%` } },
          { l_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get customers
      const { count, rows: customers } = await User.findAndCountAll({
        where: whereConditions,
        attributes: { 
          exclude: ['password', 'remember_token', 'email_verification_token', 'temporary_token'] 
        },
        limit: parseInt(limit),
        offset,
        order: [[sort_by, sort_order.toUpperCase()]]
      });

      // Add computed fields for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const customerData = customer.toJSON();
          
          // Add computed statistics
          customerData.total_orders = await customer.getTotalOrders();
          customerData.wallet_balance = customer.getWalletBalance();
          customerData.loyalty_points = customer.getLoyaltyPoints();
          customerData.full_name = customer.getFullName();
          customerData.profile_image = customer.getImageFullPath();
          customerData.registration_date = customer.created_at;
          customerData.last_order_date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          customerData.total_spent = (Math.random() * 1000 + 100).toFixed(2);
          customerData.avg_order_value = (Math.random() * 50 + 20).toFixed(2);
          
          return customerData;
        })
      );

      return generateResponse(res, 200, 'Customers retrieved successfully', {
        customers: customersWithStats,
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
      console.error('Get customers error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customers', error.message);
    }
  }

  // Get customer by ID
  async getCustomerById(req, res) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return generateErrorResponse(res, 400, 'Customer ID is required');
      }

      const customer = await User.findOne({
        where: { 
          id: customerId, 
          user_type: null 
        },
        attributes: { 
          exclude: ['password', 'remember_token', 'email_verification_token', 'temporary_token'] 
        }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Add computed fields
      const customerData = customer.toJSON();
      customerData.total_orders = await customer.getTotalOrders();
      customerData.wallet_balance = customer.getWalletBalance();
      customerData.loyalty_points = customer.getLoyaltyPoints();
      customerData.full_name = customer.getFullName();
      customerData.profile_image = customer.getImageFullPath();
      
      // Mock additional data (would be real queries)
      customerData.order_history = this.generateMockOrderHistory(10);
      customerData.addresses = this.generateMockAddresses(3);
      customerData.recent_activity = this.generateMockActivity(5);

      return generateResponse(res, 200, 'Customer retrieved successfully', {
        customer: customerData
      });

    } catch (error) {
      console.error('Get customer by ID error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customer', error.message);
    }
  }

  // Block/Unblock customer
  async toggleCustomerStatus(req, res) {
    try {
      const { customerId } = req.params;
      const { reason } = req.body;

      if (!customerId) {
        return generateErrorResponse(res, 400, 'Customer ID is required');
      }

      // Find customer
      const customer = await User.findOne({
        where: { 
          id: customerId, 
          user_type: null 
        }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Toggle status
      const newStatus = customer.is_active === 1 ? 0 : 1;
      await customer.update({
        is_active: newStatus,
        updated_by: req.user.userId
      });

      // Log the action
      const action = newStatus === 1 ? 'unblocked' : 'blocked';
      
      return generateResponse(res, 200, `Customer ${action} successfully`, {
        customer_id: customerId,
        new_status: newStatus === 1 ? 'active' : 'inactive',
        action,
        reason: reason || null,
        updated_by: req.user.userId
      });

    } catch (error) {
      console.error('Toggle customer status error:', error);
      return generateErrorResponse(res, 500, 'Failed to toggle customer status', error.message);
    }
  }

  // Get customer statistics
  async getCustomerStats(req, res) {
    try {
      const stats = {
        total_customers: await User.count({ where: { user_type: null } }),
        active_customers: await User.count({ 
          where: { 
            user_type: null, 
            is_active: 1 
          } 
        }),
        blocked_customers: await User.count({ 
          where: { 
            user_type: null, 
            is_active: 0 
          } 
        }),
        verified_customers: await User.count({
          where: {
            user_type: null,
            is_phone_verified: true
          }
        }),
        customers_with_orders: Math.floor(Math.random() * 800) + 200,
        new_customers_today: Math.floor(Math.random() * 10) + 5,
        new_customers_this_week: Math.floor(Math.random() * 50) + 20,
        new_customers_this_month: Math.floor(Math.random() * 200) + 100,
        average_order_value: (Math.random() * 50 + 25).toFixed(2),
        total_customer_spending: (Math.random() * 100000 + 50000).toFixed(2),
        retention_rate: `${(Math.random() * 20 + 70).toFixed(1)}%`
      };

      return generateResponse(res, 200, 'Customer statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get customer stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customer statistics', error.message);
    }
  }

  // Update customer profile
  async updateCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const updateData = req.body;

      if (!customerId) {
        return generateErrorResponse(res, 400, 'Customer ID is required');
      }

      // Find customer
      const customer = await User.findOne({
        where: { 
          id: customerId, 
          user_type: null 
        }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== customer.email) {
        const existingUser = await User.findOne({
          where: { 
            email: updateData.email,
            id: { [Op.ne]: customerId }
          }
        });

        if (existingUser) {
          return generateErrorResponse(res, 400, 'Email already exists');
        }
      }

      // Check if phone is being changed and if it's already taken
      if (updateData.phone && updateData.phone !== customer.phone) {
        const existingUser = await User.findOne({
          where: { 
            phone: updateData.phone,
            id: { [Op.ne]: customerId }
          }
        });

        if (existingUser) {
          return generateErrorResponse(res, 400, 'Phone number already exists');
        }
      }

      // Update customer
      await customer.update({
        ...updateData,
        updated_by: req.user.userId
      });

      // Get updated customer data
      const updatedCustomer = await User.findOne({
        where: { id: customerId },
        attributes: { 
          exclude: ['password', 'remember_token', 'email_verification_token', 'temporary_token'] 
        }
      });

      return generateResponse(res, 200, 'Customer updated successfully', {
        customer: updatedCustomer
      });

    } catch (error) {
      console.error('Update customer error:', error);
      return generateErrorResponse(res, 500, 'Failed to update customer', error.message);
    }
  }

  // Get customer orders
  async getCustomerOrders(req, res) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!customerId) {
        return generateErrorResponse(res, 400, 'Customer ID is required');
      }

      // Check if customer exists
      const customer = await User.findOne({
        where: { 
          id: customerId, 
          user_type: null 
        }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Mock order data (would be real database query)
      const orders = this.generateMockOrderHistory(20);
      const totalOrders = orders.length;
      const offset = (page - 1) * limit;
      const paginatedOrders = orders.slice(offset, offset + parseInt(limit));

      return generateResponse(res, 200, 'Customer orders retrieved successfully', {
        customer_id: customerId,
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
      console.error('Get customer orders error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customer orders', error.message);
    }
  }

  // Delete customer (soft delete)
  async deleteCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const { reason } = req.body;

      if (!customerId) {
        return generateErrorResponse(res, 400, 'Customer ID is required');
      }

      // Find customer
      const customer = await User.findOne({
        where: { 
          id: customerId, 
          user_type: null 
        }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Soft delete by deactivating
      await customer.update({
        is_active: 0,
        deleted_at: new Date(),
        deleted_by: req.user.userId,
        deletion_reason: reason
      });

      return generateResponse(res, 200, 'Customer deleted successfully', {
        customer_id: customerId,
        reason: reason || null,
        deleted_by: req.user.userId
      });

    } catch (error) {
      console.error('Delete customer error:', error);
      return generateErrorResponse(res, 500, 'Failed to delete customer', error.message);
    }
  }

  // Helper methods
  generateMockOrderHistory(count) {
    const orders = [];
    const statuses = ['delivered', 'cancelled', 'pending', 'confirmed'];
    
    for (let i = 1; i <= count; i++) {
      orders.push({
        id: i,
        order_number: `ORD-${String(i).padStart(6, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        total_amount: (Math.random() * 100 + 20).toFixed(2),
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        items_count: Math.floor(Math.random() * 5) + 1
      });
    }
    
    return orders;
  }

  generateMockAddresses(count) {
    const addresses = [];
    const types = ['home', 'office', 'other'];
    
    for (let i = 1; i <= count; i++) {
      addresses.push({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        address: `Address ${i}`,
        city: 'New York',
        state: 'NY',
        zip: '10001',
        is_default: i === 1
      });
    }
    
    return addresses;
  }

  generateMockActivity(count) {
    const activities = [];
    const types = ['order_placed', 'profile_updated', 'address_added', 'payment_made'];
    
    for (let i = 1; i <= count; i++) {
      activities.push({
        id: i,
        type: types[Math.floor(Math.random() * types.length)],
        description: `Activity ${i}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }
    
    return activities;
  }
}

module.exports = new AdminCustomersController(); 