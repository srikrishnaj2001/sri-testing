const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const { validateDeliveryManUpdate } = require('../utils/validation');

const { User } = db;

class DeliveryManController {
  // Get delivery man profile
  async getProfile(req, res) {
    try {
      const { userId } = req.user;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' },
        attributes: { exclude: ['password', 'otp', 'otp_expires_at', 'login_hit_count', 'is_temp_blocked'] }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const deliveryManData = deliveryMan.toJSON();
      
      // Add computed fields
      deliveryManData.total_deliveries = await deliveryMan.getTotalDeliveries();
      deliveryManData.completed_deliveries = await deliveryMan.getCompletedDeliveries();
      deliveryManData.total_earnings = await deliveryMan.getTotalEarnings();
      deliveryManData.average_rating = await deliveryMan.getAverageRating();
      deliveryManData.current_status = deliveryMan.getDeliveryStatus();
      deliveryManData.is_available = deliveryMan.isAvailableForDelivery();
      deliveryManData.is_online = deliveryMan.isOnline();
      deliveryManData.current_location = deliveryMan.getCurrentLocation();
      deliveryManData.vehicle_info = deliveryMan.getVehicleInfo();

      return generateResponse(res, 200, 'Delivery man profile retrieved successfully', {
        delivery_man: deliveryManData
      });

    } catch (error) {
      console.error('Get delivery man profile error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery man profile', error.message);
    }
  }

  // Update delivery man profile
  async updateProfile(req, res) {
    try {
      const { userId } = req.user;
      const updateData = req.body;

      // Validate input
      const { error } = validateDeliveryManUpdate(updateData);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation error', error.details[0].message);
      }

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== deliveryMan.email) {
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
      if (updateData.phone && updateData.phone !== deliveryMan.phone) {
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

      // Update delivery man
      await deliveryMan.update(updateData);

      // Get updated delivery man data
      const updatedDeliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' },
        attributes: { exclude: ['password', 'otp', 'otp_expires_at', 'login_hit_count', 'is_temp_blocked'] }
      });

      const deliveryManData = updatedDeliveryMan.toJSON();
      deliveryManData.current_status = updatedDeliveryMan.getDeliveryStatus();

      return generateResponse(res, 200, 'Delivery man profile updated successfully', {
        delivery_man: deliveryManData
      });

    } catch (error) {
      console.error('Update delivery man profile error:', error);
      return generateErrorResponse(res, 500, 'Failed to update delivery man profile', error.message);
    }
  }

  // Update availability status
  async updateAvailability(req, res) {
    try {
      const { userId } = req.user;
      const { is_available, current_location } = req.body;

      if (typeof is_available !== 'boolean') {
        return generateErrorResponse(res, 400, 'Availability status is required (true/false)');
      }

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const updateData = {
        is_available,
        last_location_update: new Date()
      };

      // Update location if provided
      if (current_location && current_location.latitude && current_location.longitude) {
        updateData.current_location = current_location;
      }

      // Update online status
      updateData.is_online = is_available;
      updateData.last_active_at = new Date();

      await deliveryMan.update(updateData);

      return generateResponse(res, 200, 'Availability status updated successfully', {
        is_available,
        is_online: updateData.is_online,
        current_location: updateData.current_location,
        last_update: updateData.last_location_update
      });

    } catch (error) {
      console.error('Update availability error:', error);
      return generateErrorResponse(res, 500, 'Failed to update availability status', error.message);
    }
  }

  // Update current location
  async updateLocation(req, res) {
    try {
      const { userId } = req.user;
      const { latitude, longitude, accuracy, speed, heading } = req.body;

      if (!latitude || !longitude) {
        return generateErrorResponse(res, 400, 'Latitude and longitude are required');
      }

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const locationData = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        timestamp: new Date()
      };

      // Update location and mark as online
      await deliveryMan.update({
        current_location: locationData,
        last_location_update: new Date(),
        is_online: true,
        last_active_at: new Date()
      });

      return generateResponse(res, 200, 'Location updated successfully', {
        location: locationData
      });

    } catch (error) {
      console.error('Update location error:', error);
      return generateErrorResponse(res, 500, 'Failed to update location', error.message);
    }
  }

  // Get delivery statistics
  async getDeliveryStats(req, res) {
    try {
      const { userId } = req.user;
      const { period = 'month' } = req.query;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const now = new Date();
      let startDate;

      // Calculate period start date
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const stats = {
        period,
        total_deliveries: await deliveryMan.getTotalDeliveries(startDate),
        completed_deliveries: await deliveryMan.getCompletedDeliveries(startDate),
        cancelled_deliveries: await deliveryMan.getCancelledDeliveries(startDate),
        total_earnings: await deliveryMan.getTotalEarnings(startDate),
        average_delivery_time: await deliveryMan.getAverageDeliveryTime(startDate),
        average_rating: await deliveryMan.getAverageRating(startDate),
        total_distance: await deliveryMan.getTotalDistance(startDate),
        fuel_cost: await deliveryMan.getFuelCost(startDate),
        net_earnings: 0,
        delivery_success_rate: 0,
        on_time_delivery_rate: await deliveryMan.getOnTimeDeliveryRate(startDate)
      };

      // Calculate derived stats
      stats.net_earnings = stats.total_earnings - stats.fuel_cost;
      stats.delivery_success_rate = stats.total_deliveries > 0 
        ? (stats.completed_deliveries / stats.total_deliveries * 100).toFixed(2)
        : 0;

      return generateResponse(res, 200, 'Delivery statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get delivery stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery statistics', error.message);
    }
  }

  // Update vehicle information
  async updateVehicleInfo(req, res) {
    try {
      const { userId } = req.user;
      const vehicleInfo = req.body;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Get current vehicle info and merge with new data
      const currentVehicleInfo = deliveryMan.getVehicleInfo() || {};
      const updatedVehicleInfo = { ...currentVehicleInfo, ...vehicleInfo };

      await deliveryMan.update({ vehicle_info: updatedVehicleInfo });

      return generateResponse(res, 200, 'Vehicle information updated successfully', {
        vehicle_info: updatedVehicleInfo
      });

    } catch (error) {
      console.error('Update vehicle info error:', error);
      return generateErrorResponse(res, 500, 'Failed to update vehicle information', error.message);
    }
  }

  // Get delivery man earnings
  async getEarnings(req, res) {
    try {
      const { userId } = req.user;
      const { period = 'month', page = 1, limit = 20 } = req.query;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const earnings = await deliveryMan.getEarningsHistory(period, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return generateResponse(res, 200, 'Earnings retrieved successfully', earnings);

    } catch (error) {
      console.error('Get earnings error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve earnings', error.message);
    }
  }

  // Update delivery status
  async updateDeliveryStatus(req, res) {
    try {
      const { userId } = req.user;
      const { status, reason } = req.body;

      const validStatuses = ['available', 'busy', 'offline', 'on_break'];
      
      if (!status || !validStatuses.includes(status)) {
        return generateErrorResponse(res, 400, `Invalid status. Valid options: ${validStatuses.join(', ')}`);
      }

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const statusData = {
        status,
        reason: reason || null,
        updated_at: new Date()
      };

      // Update availability based on status
      const isAvailable = status === 'available';
      const isOnline = ['available', 'busy', 'on_break'].includes(status);

      await deliveryMan.update({
        delivery_status: statusData,
        is_available: isAvailable,
        is_online: isOnline,
        last_active_at: new Date()
      });

      return generateResponse(res, 200, 'Delivery status updated successfully', {
        status: statusData,
        is_available: isAvailable,
        is_online: isOnline
      });

    } catch (error) {
      console.error('Update delivery status error:', error);
      return generateErrorResponse(res, 500, 'Failed to update delivery status', error.message);
    }
  }

  // Get nearby delivery opportunities
  async getNearbyDeliveries(req, res) {
    try {
      const { userId } = req.user;
      const { radius = 10 } = req.query;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const currentLocation = deliveryMan.getCurrentLocation();
      
      if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
        return generateErrorResponse(res, 400, 'Current location not available. Please update your location first.');
      }

      // This would typically query available orders within radius
      // For now, return mock data
      const nearbyDeliveries = [];

      return generateResponse(res, 200, 'Nearby deliveries retrieved successfully', {
        deliveries: nearbyDeliveries,
        total: nearbyDeliveries.length,
        radius: parseFloat(radius),
        current_location: currentLocation
      });

    } catch (error) {
      console.error('Get nearby deliveries error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve nearby deliveries', error.message);
    }
  }

  // Get delivery man performance metrics
  async getPerformanceMetrics(req, res) {
    try {
      const { userId } = req.user;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const metrics = {
        overall_rating: await deliveryMan.getAverageRating(),
        total_deliveries: await deliveryMan.getTotalDeliveries(),
        success_rate: await deliveryMan.getDeliverySuccessRate(),
        on_time_rate: await deliveryMan.getOnTimeDeliveryRate(),
        customer_satisfaction: await deliveryMan.getCustomerSatisfactionScore(),
        average_delivery_time: await deliveryMan.getAverageDeliveryTime(),
        total_distance: await deliveryMan.getTotalDistance(),
        fuel_efficiency: await deliveryMan.getFuelEfficiency(),
        earnings_per_delivery: await deliveryMan.getEarningsPerDelivery(),
        active_days: await deliveryMan.getActiveDaysCount(),
        peak_hours_performance: await deliveryMan.getPeakHoursPerformance(),
        cancellation_rate: await deliveryMan.getCancellationRate()
      };

      return generateResponse(res, 200, 'Performance metrics retrieved successfully', {
        metrics
      });

    } catch (error) {
      console.error('Get performance metrics error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve performance metrics', error.message);
    }
  }

  // Upload delivery man documents
  async uploadDocument(req, res) {
    try {
      const { userId } = req.user;
      const { document_type } = req.body;

      if (!req.file) {
        return generateErrorResponse(res, 400, 'No document file provided');
      }

      if (!document_type) {
        return generateErrorResponse(res, 400, 'Document type is required');
      }

      const validDocumentTypes = ['driving_license', 'identity_card', 'vehicle_registration', 'insurance'];
      
      if (!validDocumentTypes.includes(document_type)) {
        return generateErrorResponse(res, 400, 'Invalid document type');
      }

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Get current documents
      const currentDocuments = deliveryMan.getDocuments() || {};
      
      // Add new document
      const documentPath = `/uploads/delivery_man_docs/${req.file.filename}`;
      currentDocuments[document_type] = {
        file_path: documentPath,
        uploaded_at: new Date(),
        status: 'pending_verification'
      };

      await deliveryMan.update({ documents: currentDocuments });

      return generateResponse(res, 200, 'Document uploaded successfully', {
        document_type,
        file_path: documentPath,
        status: 'pending_verification'
      });

    } catch (error) {
      console.error('Upload document error:', error);
      return generateErrorResponse(res, 500, 'Failed to upload document', error.message);
    }
  }
}

module.exports = new DeliveryManController(); 