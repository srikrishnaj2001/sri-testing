const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const { validateCustomerUpdate } = require('../utils/validation');

const { User } = db;

class CustomerController {
  // Get customer profile
  async getProfile(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' },
        attributes: { exclude: ['password', 'otp', 'otp_expires_at', 'login_hit_count', 'is_temp_blocked'] }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const customerData = customer.toJSON();
      
      // Add computed fields
      customerData.total_orders = await customer.getTotalOrders();
      customerData.total_spent = await customer.getTotalSpent();
      customerData.loyalty_points = await customer.getLoyaltyPoints();
      customerData.wallet_balance = await customer.getWalletBalance();
      customerData.is_verified = customer.isVerified();
      customerData.profile_completion = customer.getProfileCompletion();

      return generateResponse(res, 200, 'Customer profile retrieved successfully', {
        customer: customerData
      });

    } catch (error) {
      console.error('Get customer profile error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customer profile', error.message);
    }
  }

  // Update customer profile
  async updateProfile(req, res) {
    try {
      const { userId } = req.user;
      const updateData = req.body;

      // Validate input
      const { error } = validateCustomerUpdate(updateData);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation error', error.details[0].message);
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== customer.email) {
        const existingUser = await User.findOne({
          where: { 
            email: updateData.email,
            id: { [Op.ne]: userId }
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
            id: { [Op.ne]: userId }
          }
        });

        if (existingUser) {
          return generateErrorResponse(res, 400, 'Phone number already exists');
        }
      }

      // Update customer
      await customer.update(updateData);

      // Get updated customer data
      const updatedCustomer = await User.findOne({
        where: { id: userId, user_type: 'customer' },
        attributes: { exclude: ['password', 'otp', 'otp_expires_at', 'login_hit_count', 'is_temp_blocked'] }
      });

      const customerData = updatedCustomer.toJSON();
      customerData.profile_completion = updatedCustomer.getProfileCompletion();

      return generateResponse(res, 200, 'Customer profile updated successfully', {
        customer: customerData
      });

    } catch (error) {
      console.error('Update customer profile error:', error);
      return generateErrorResponse(res, 500, 'Failed to update customer profile', error.message);
    }
  }

  // Upload profile image
  async uploadProfileImage(req, res) {
    try {
      const { userId } = req.user;

      if (!req.file) {
        return generateErrorResponse(res, 400, 'No image file provided');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Update customer with new image path
      const imagePath = `/uploads/customers/${req.file.filename}`;
      await customer.update({ image: imagePath });

      return generateResponse(res, 200, 'Profile image uploaded successfully', {
        image_url: imagePath
      });

    } catch (error) {
      console.error('Upload profile image error:', error);
      return generateErrorResponse(res, 500, 'Failed to upload profile image', error.message);
    }
  }

  // Delete customer account
  async deleteAccount(req, res) {
    try {
      const { userId } = req.user;
      const { confirmation } = req.body;

      if (!confirmation || confirmation !== 'DELETE_ACCOUNT') {
        return generateErrorResponse(res, 400, 'Account deletion requires confirmation');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Check if customer has pending orders
      const pendingOrders = await customer.getPendingOrders();
      if (pendingOrders.length > 0) {
        return generateErrorResponse(res, 400, 'Cannot delete account with pending orders');
      }

      // Soft delete - mark as inactive
      await customer.update({ 
        status: false, 
        deleted_at: new Date() 
      });

      return generateResponse(res, 200, 'Account deleted successfully');

    } catch (error) {
      console.error('Delete customer account error:', error);
      return generateErrorResponse(res, 500, 'Failed to delete account', error.message);
    }
  }

  // Get customer statistics
  async getCustomerStats(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const stats = {
        total_orders: await customer.getTotalOrders(),
        completed_orders: await customer.getCompletedOrders(),
        cancelled_orders: await customer.getCancelledOrders(),
        total_spent: await customer.getTotalSpent(),
        average_order_value: await customer.getAverageOrderValue(),
        loyalty_points: await customer.getLoyaltyPoints(),
        wallet_balance: await customer.getWalletBalance(),
        favorite_products: await customer.getFavoriteProductsCount(),
        saved_addresses: await customer.getSavedAddressesCount(),
        account_created: customer.created_at,
        last_order_date: await customer.getLastOrderDate(),
        profile_completion: customer.getProfileCompletion()
      };

      return generateResponse(res, 200, 'Customer statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get customer stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customer statistics', error.message);
    }
  }

  // Update customer preferences
  async updatePreferences(req, res) {
    try {
      const { userId } = req.user;
      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        return generateErrorResponse(res, 400, 'Invalid preferences data');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Update preferences
      const currentPreferences = customer.preferences || {};
      const updatedPreferences = { ...currentPreferences, ...preferences };

      await customer.update({ preferences: updatedPreferences });

      return generateResponse(res, 200, 'Customer preferences updated successfully', {
        preferences: updatedPreferences
      });

    } catch (error) {
      console.error('Update customer preferences error:', error);
      return generateErrorResponse(res, 500, 'Failed to update customer preferences', error.message);
    }
  }

  // Get customer preferences
  async getPreferences(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' },
        attributes: ['preferences']
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const preferences = customer.preferences || {
        notifications: {
          email: true,
          sms: true,
          push: true,
          promotional: true
        },
        language: 'en',
        currency: 'USD',
        dietary_restrictions: [],
        delivery_preferences: {
          preferred_time: 'anytime',
          special_instructions: ''
        }
      };

      return generateResponse(res, 200, 'Customer preferences retrieved successfully', {
        preferences
      });

    } catch (error) {
      console.error('Get customer preferences error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve customer preferences', error.message);
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { userId } = req.user;
      const { current_password, new_password, confirm_password } = req.body;

      if (!current_password || !new_password || !confirm_password) {
        return generateErrorResponse(res, 400, 'Current password, new password, and confirmation are required');
      }

      if (new_password !== confirm_password) {
        return generateErrorResponse(res, 400, 'New password and confirmation do not match');
      }

      if (new_password.length < 8) {
        return generateErrorResponse(res, 400, 'New password must be at least 8 characters long');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await customer.verifyPassword(current_password);
      if (!isCurrentPasswordValid) {
        return generateErrorResponse(res, 400, 'Current password is incorrect');
      }

      // Update password
      await customer.updatePassword(new_password);

      return generateResponse(res, 200, 'Password changed successfully');

    } catch (error) {
      console.error('Change password error:', error);
      return generateErrorResponse(res, 500, 'Failed to change password', error.message);
    }
  }

  // Get customer notifications
  async getNotifications(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20, type, status } = req.query;

      const whereClause = { user_id: userId };

      if (type) {
        whereClause.type = type;
      }

      if (status) {
        whereClause.status = status;
      }

      // This would require a notifications table/model
      // For now, return mock data
      const notifications = [];
      const total = 0;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generateResponse(res, 200, 'Notifications retrieved successfully', {
        notifications,
        pagination
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve notifications', error.message);
    }
  }

  // Mark notification as read
  async markNotificationAsRead(req, res) {
    try {
      // This would require a notifications table/model
      // For now, return success
      return generateResponse(res, 200, 'Notification marked as read successfully');

    } catch (error) {
      console.error('Mark notification as read error:', error);
      return generateErrorResponse(res, 500, 'Failed to mark notification as read', error.message);
    }
  }
}

module.exports = new CustomerController(); 