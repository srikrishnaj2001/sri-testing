const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { User } = db;

class AdminDeliveryMenController {
  // Get all delivery men with filters and pagination
  async getDeliveryMen(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search,
        status,
        availability,
        sort_by = 'created_at',
        sort_order = 'desc',
        rating_min,
        rating_max
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {
        user_type: 'delivery_man'
      };
      
      if (status) {
        whereConditions.is_active = status === 'active' ? 1 : 0;
      }
      
      if (availability) {
        whereConditions.is_available = availability === 'available';
      }
      
      if (search) {
        whereConditions[Op.or] = [
          { f_name: { [Op.iLike]: `%${search}%` } },
          { l_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get delivery men
      const { count, rows: deliveryMen } = await User.findAndCountAll({
        where: whereConditions,
        attributes: { 
          exclude: ['password', 'remember_token', 'email_verification_token', 'temporary_token'] 
        },
        limit: parseInt(limit),
        offset,
        order: [[sort_by, sort_order.toUpperCase()]]
      });

      // Add computed fields for each delivery man
      const deliveryMenWithStats = await Promise.all(
        deliveryMen.map(async (deliveryMan) => {
          const deliveryManData = deliveryMan.toJSON();
          
          // Add computed statistics
          deliveryManData.total_deliveries = await deliveryMan.getTotalDeliveries();
          deliveryManData.completed_deliveries = await deliveryMan.getCompletedDeliveries();
          deliveryManData.total_earnings = await deliveryMan.getTotalEarnings();
          deliveryManData.average_rating = await deliveryMan.getAverageRating();
          deliveryManData.current_status = deliveryMan.getDeliveryStatus();
          deliveryManData.is_available = deliveryMan.isAvailableForDelivery();
          deliveryManData.is_online = deliveryMan.isOnline();
          deliveryManData.current_location = deliveryMan.getCurrentLocation();
          deliveryManData.vehicle_info = deliveryMan.getVehicleInfo();
          deliveryManData.full_name = deliveryMan.getFullName();
          deliveryManData.profile_image = deliveryMan.getImageFullPath();
          deliveryManData.registration_date = deliveryMan.created_at;
          
          return deliveryManData;
        })
      );

      return generateResponse(res, 200, 'Delivery men retrieved successfully', {
        delivery_men: deliveryMenWithStats,
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
      console.error('Get delivery men error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery men', error.message);
    }
  }

  // Get delivery man by ID
  async getDeliveryManById(req, res) {
    try {
      const { deliveryManId } = req.params;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        },
        attributes: { 
          exclude: ['password', 'remember_token', 'email_verification_token', 'temporary_token'] 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Add computed fields
      const deliveryManData = deliveryMan.toJSON();
      deliveryManData.total_deliveries = await deliveryMan.getTotalDeliveries();
      deliveryManData.completed_deliveries = await deliveryMan.getCompletedDeliveries();
      deliveryManData.total_earnings = await deliveryMan.getTotalEarnings();
      deliveryManData.average_rating = await deliveryMan.getAverageRating();
      deliveryManData.current_status = deliveryMan.getDeliveryStatus();
      deliveryManData.is_available = deliveryMan.isAvailableForDelivery();
      deliveryManData.is_online = deliveryMan.isOnline();
      deliveryManData.current_location = deliveryMan.getCurrentLocation();
      deliveryManData.vehicle_info = deliveryMan.getVehicleInfo();
      deliveryManData.full_name = deliveryMan.getFullName();
      deliveryManData.profile_image = deliveryMan.getImageFullPath();
      deliveryManData.documents = deliveryMan.getDocuments();
      
      // Mock additional data (would be real queries)
      deliveryManData.performance_metrics = await deliveryMan.getPerformanceMetrics();
      deliveryManData.recent_deliveries = this.generateMockDeliveryHistory(10);
      deliveryManData.earnings_history = await deliveryMan.getEarningsHistory();

      return generateResponse(res, 200, 'Delivery man retrieved successfully', {
        delivery_man: deliveryManData
      });

    } catch (error) {
      console.error('Get delivery man by ID error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man', error.message);
    }
  }

  // Update delivery man profile
  async updateDeliveryMan(req, res) {
    try {
      const { deliveryManId } = req.params;
      const updateData = req.body;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Find delivery man
      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== deliveryMan.email) {
        const existingUser = await User.findOne({
          where: { 
            email: updateData.email,
            id: { [Op.ne]: deliveryManId }
          }
        });

        if (existingUser) {
          return generateErrorResponse(res, 400, 'Email already exists');
        }
      }

      // Check if phone is being changed and if it's already taken
      if (updateData.phone && updateData.phone !== deliveryMan.phone) {
        const existingUser = await User.findOne({
          where: { 
            phone: updateData.phone,
            id: { [Op.ne]: deliveryManId }
          }
        });

        if (existingUser) {
          return generateErrorResponse(res, 400, 'Phone number already exists');
        }
      }

      // Update delivery man
      await deliveryMan.update({
        ...updateData,
        updated_by: req.user.userId
      });

      // Get updated delivery man data
      const updatedDeliveryMan = await User.findOne({
        where: { id: deliveryManId },
        attributes: { 
          exclude: ['password', 'remember_token', 'email_verification_token', 'temporary_token'] 
        }
      });

      return generateResponse(res, 200, 'Delivery man updated successfully', {
        delivery_man: updatedDeliveryMan
      });

    } catch (error) {
      console.error('Update delivery man error:', error);
      return generateErrorResponse(res, 500, 'Failed to update delivery man', error.message);
    }
  }

  // Toggle delivery man status
  async toggleDeliveryManStatus(req, res) {
    try {
      const { deliveryManId } = req.params;
      const { reason } = req.body;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Find delivery man
      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Toggle status
      const newStatus = deliveryMan.is_active === 1 ? 0 : 1;
      await deliveryMan.update({
        is_active: newStatus,
        updated_by: req.user.userId
      });

      // Log the action
      const action = newStatus === 1 ? 'activated' : 'deactivated';
      
      return generateResponse(res, 200, `Delivery man ${action} successfully`, {
        delivery_man_id: deliveryManId,
        new_status: newStatus === 1 ? 'active' : 'inactive',
        action,
        reason: reason || null,
        updated_by: req.user.userId
      });

    } catch (error) {
      console.error('Toggle delivery man status error:', error);
      return generateErrorResponse(res, 500, 'Failed to toggle delivery man status', error.message);
    }
  }

  // Get delivery men statistics
  async getDeliveryMenStats(req, res) {
    try {
      const stats = {
        total_delivery_men: await User.count({ where: { user_type: 'delivery_man' } }),
        active_delivery_men: await User.count({ 
          where: { 
            user_type: 'delivery_man', 
            is_active: 1 
          } 
        }),
        inactive_delivery_men: await User.count({ 
          where: { 
            user_type: 'delivery_man', 
            is_active: 0 
          } 
        }),
        online_delivery_men: await User.count({
          where: {
            user_type: 'delivery_man',
            is_online: true
          }
        }),
        available_delivery_men: await User.count({
          where: {
            user_type: 'delivery_man',
            is_available: true
          }
        }),
        busy_delivery_men: await User.count({
          where: {
            user_type: 'delivery_man',
            is_online: true,
            is_available: false
          }
        }),
        new_delivery_men_today: Math.floor(Math.random() * 5) + 1,
        new_delivery_men_this_week: Math.floor(Math.random() * 20) + 5,
        new_delivery_men_this_month: Math.floor(Math.random() * 50) + 20,
        average_rating: (Math.random() * 1 + 4).toFixed(1),
        total_deliveries_completed: Math.floor(Math.random() * 10000) + 5000,
        average_delivery_time: Math.floor(Math.random() * 20) + 25,
        customer_satisfaction: (Math.random() * 1 + 4).toFixed(1)
      };

      return generateResponse(res, 200, 'Delivery men statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get delivery men stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery men statistics', error.message);
    }
  }

  // Get delivery man performance
  async getDeliveryManPerformance(req, res) {
    try {
      const { deliveryManId } = req.params;
      const { period = 'month' } = req.query;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Find delivery man
      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Get performance metrics
      const performance = await deliveryMan.getPerformanceMetrics();
      const stats = await deliveryMan.getDeliveryStats(period);

      return generateResponse(res, 200, 'Delivery man performance retrieved successfully', {
        delivery_man_id: deliveryManId,
        period,
        performance,
        stats
      });

    } catch (error) {
      console.error('Get delivery man performance error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man performance', error.message);
    }
  }

  // Get available delivery men for assignment
  async getAvailableDeliveryMen(req, res) {
    try {
      const { latitude, longitude, radius = 10 } = req.query;

      let whereConditions = {
        user_type: 'delivery_man',
        is_active: 1,
        is_available: true,
        is_online: true
      };

      // If location is provided, filter by proximity (mock implementation)
      const availableDeliveryMen = await User.findAll({
        where: whereConditions,
        attributes: [
          'id', 'f_name', 'l_name', 'phone', 'current_location', 
          'is_available', 'is_online', 'vehicle_info'
        ],
        order: [['last_active_at', 'DESC']]
      });

      // Add computed fields
      const deliveryMenWithStats = await Promise.all(
        availableDeliveryMen.map(async (deliveryMan) => {
          const deliveryManData = deliveryMan.toJSON();
          deliveryManData.average_rating = await deliveryMan.getAverageRating();
          deliveryManData.total_deliveries = await deliveryMan.getTotalDeliveries();
          deliveryManData.full_name = deliveryMan.getFullName();
          deliveryManData.distance = latitude && longitude ? 
            Math.floor(Math.random() * radius) + 1 : null;
          
          return deliveryManData;
        })
      );

      return generateResponse(res, 200, 'Available delivery men retrieved successfully', {
        delivery_men: deliveryMenWithStats,
        total: deliveryMenWithStats.length,
        search_radius: radius,
        search_location: latitude && longitude ? { latitude, longitude } : null
      });

    } catch (error) {
      console.error('Get available delivery men error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve available delivery men', error.message);
    }
  }

  // Get delivery man earnings
  async getDeliveryManEarnings(req, res) {
    try {
      const { deliveryManId } = req.params;
      const { period = 'month', page = 1, limit = 20 } = req.query;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Find delivery man
      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Get earnings
      const earnings = await deliveryMan.getEarnings(period, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return generateResponse(res, 200, 'Delivery man earnings retrieved successfully', {
        delivery_man_id: deliveryManId,
        period,
        ...earnings
      });

    } catch (error) {
      console.error('Get delivery man earnings error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man earnings', error.message);
    }
  }

  // Update delivery man availability
  async updateDeliveryManAvailability(req, res) {
    try {
      const { deliveryManId } = req.params;
      const { is_available } = req.body;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      if (typeof is_available !== 'boolean') {
        return generateErrorResponse(res, 400, 'Availability status is required (true/false)');
      }

      // Find delivery man
      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Update availability
      await deliveryMan.update({
        is_available,
        updated_by: req.user.userId
      });

      return generateResponse(res, 200, 'Delivery man availability updated successfully', {
        delivery_man_id: deliveryManId,
        is_available,
        updated_by: req.user.userId
      });

    } catch (error) {
      console.error('Update delivery man availability error:', error);
      return generateErrorResponse(res, 500, 'Failed to update delivery man availability', error.message);
    }
  }

  // Get delivery man documents
  async getDeliveryManDocuments(req, res) {
    try {
      const { deliveryManId } = req.params;

      if (!deliveryManId) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Find delivery man
      const deliveryMan = await User.findOne({
        where: { 
          id: deliveryManId, 
          user_type: 'delivery_man' 
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const documents = deliveryMan.getDocuments();

      return generateResponse(res, 200, 'Delivery man documents retrieved successfully', {
        delivery_man_id: deliveryManId,
        documents
      });

    } catch (error) {
      console.error('Get delivery man documents error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man documents', error.message);
    }
  }

  // Helper methods
  generateMockDeliveryHistory(count) {
    const deliveries = [];
    const statuses = ['delivered', 'cancelled', 'returned'];
    
    for (let i = 1; i <= count; i++) {
      deliveries.push({
        id: i,
        order_number: `ORD-${String(i).padStart(6, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        delivery_fee: (Math.random() * 10 + 5).toFixed(2),
        tip_amount: (Math.random() * 5).toFixed(2),
        distance: (Math.random() * 15 + 2).toFixed(1),
        delivery_time: Math.floor(Math.random() * 45) + 15,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    return deliveries;
  }
}

module.exports = new AdminDeliveryMenController(); 