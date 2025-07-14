const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { Order, User, Branch } = db;

class OrderTrackingController {
  // Update order status (for admin/restaurant staff)
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, notes, estimated_time } = req.body;
      const { userId, userType } = req.user;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      if (!status) {
        return generateErrorResponse(res, 400, 'Status is required');
      }

      // Valid status transitions
      const validStatuses = [
        'pending', 'confirmed', 'preparing', 'ready_for_pickup', 
        'picked_up', 'on_the_way', 'delivered', 'cancelled'
      ];

      if (!validStatuses.includes(status)) {
        return generateErrorResponse(res, 400, 'Invalid status provided');
      }

      // Find order
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'email']
          },
          {
            model: User,
            as: 'deliveryMan',
            attributes: ['id', 'f_name', 'l_name', 'phone'],
            required: false
          }
        ]
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      // Validate status transition
      const validTransition = this.validateStatusTransition(order.order_status, status);
      if (!validTransition) {
        return generateErrorResponse(res, 400, `Invalid status transition from ${order.order_status} to ${status}`);
      }

      // Update order status
      const updateData = {
        order_status: status,
        updated_by: userId
      };

      // Add estimated time if provided
      if (estimated_time) {
        updateData.estimated_delivery_time = new Date(estimated_time);
      }

      // Add notes to tracking info
      if (notes) {
        const trackingInfo = order.tracking_info || {};
        trackingInfo.status_updates = trackingInfo.status_updates || [];
        trackingInfo.status_updates.push({
          status,
          notes,
          updated_by: userId,
          updated_at: new Date()
        });
        updateData.tracking_info = trackingInfo;
      }

      await order.update(updateData);

      // Get updated order with all details
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone', 'email']
          },
          {
            model: User,
            as: 'deliveryMan',
            attributes: ['id', 'f_name', 'l_name', 'phone'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          }
        ]
      });

      return generateResponse(res, 200, 'Order status updated successfully', {
        order: updatedOrder,
        previous_status: order.order_status,
        new_status: status,
        status_timeline: updatedOrder.getStatusTimeline()
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
      const { userId } = req.user;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      if (!delivery_man_id) {
        return generateErrorResponse(res, 400, 'Delivery man ID is required');
      }

      // Find order
      const order = await Order.findByPk(orderId);
      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      // Verify delivery man exists and is available
      const deliveryMan = await User.findOne({
        where: { 
          id: delivery_man_id,
          user_type: 'delivery_man'
        }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Check if delivery man is available
      if (!deliveryMan.isAvailableForDelivery()) {
        return generateErrorResponse(res, 400, 'Delivery man is not available');
      }

      // Assign delivery man
      await order.update({
        delivery_man_id: delivery_man_id,
        order_status: order.order_status === 'pending' ? 'confirmed' : order.order_status,
        updated_by: userId
      });

      // Update tracking info
      const trackingInfo = order.tracking_info || {};
      trackingInfo.delivery_assigned = {
        delivery_man_id,
        assigned_by: userId,
        assigned_at: new Date()
      };
      await order.update({ tracking_info: trackingInfo });

      return generateResponse(res, 200, 'Delivery man assigned successfully', {
        order_id: orderId,
        delivery_man: {
          id: deliveryMan.id,
          name: deliveryMan.getFullName(),
          phone: deliveryMan.phone
        },
        assigned_at: new Date()
      });

    } catch (error) {
      console.error('Assign delivery man error:', error);
      return generateErrorResponse(res, 500, 'Failed to assign delivery man', error.message);
    }
  }

  // Get real-time order tracking
  async getRealTimeTracking(req, res) {
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
            attributes: ['id', 'f_name', 'l_name', 'phone']
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
            attributes: ['id', 'name', 'address', 'latitude', 'longitude']
          }
        ]
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      // Calculate delivery progress
      const progress = this.calculateDeliveryProgress(order.order_status);
      
      // Get estimated time remaining
      const timeRemaining = this.calculateTimeRemaining(order);

      const trackingData = {
        order_id: order.id,
        order_number: order.order_number,
        current_status: order.order_status,
        progress_percentage: progress,
        estimated_delivery_time: order.estimated_delivery_time,
        time_remaining: timeRemaining,
        status_timeline: order.getStatusTimeline(),
        delivery_man: order.deliveryMan ? {
          id: order.deliveryMan.id,
          name: order.deliveryMan.getFullName(),
          phone: order.deliveryMan.phone,
          current_location: order.deliveryMan.current_location,
          is_online: order.deliveryMan.is_online
        } : null,
        branch_location: order.branch ? {
          name: order.branch.name,
          address: order.branch.address,
          latitude: order.branch.latitude,
          longitude: order.branch.longitude
        } : null,
        delivery_address: order.delivery_address,
        tracking_info: order.tracking_info || {},
        can_cancel: order.canBeCancelled(),
        is_active: order.isActive(),
        last_updated: order.updated_at
      };

      return generateResponse(res, 200, 'Real-time tracking data retrieved successfully', {
        tracking: trackingData
      });

    } catch (error) {
      console.error('Get real-time tracking error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve tracking data', error.message);
    }
  }

  // Update delivery location (for delivery man)
  async updateDeliveryLocation(req, res) {
    try {
      const { orderId } = req.params;
      const { latitude, longitude } = req.body;
      const { userId } = req.user;

      if (!orderId) {
        return generateErrorResponse(res, 400, 'Order ID is required');
      }

      if (!latitude || !longitude) {
        return generateErrorResponse(res, 400, 'Latitude and longitude are required');
      }

      // Find order assigned to this delivery man
      const order = await Order.findOne({
        where: { 
          id: orderId,
          delivery_man_id: userId
        }
      });

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found or not assigned to you');
      }

      // Update delivery man's current location
      await User.update(
        { 
          current_location: { latitude, longitude },
          last_location_update: new Date()
        },
        { where: { id: userId } }
      );

      // Update tracking info
      const trackingInfo = order.tracking_info || {};
      trackingInfo.location_updates = trackingInfo.location_updates || [];
      trackingInfo.location_updates.push({
        latitude,
        longitude,
        timestamp: new Date()
      });

      await order.update({ tracking_info: trackingInfo });

      return generateResponse(res, 200, 'Location updated successfully', {
        order_id: orderId,
        location: { latitude, longitude },
        updated_at: new Date()
      });

    } catch (error) {
      console.error('Update delivery location error:', error);
      return generateErrorResponse(res, 500, 'Failed to update location', error.message);
    }
  }

  // Get orders by status
  async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const { userType } = req.user;

      if (!status) {
        return generateErrorResponse(res, 400, 'Status is required');
      }

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = { order_status: status };

      // Get orders
      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'customer',
            attributes: ['id', 'f_name', 'l_name', 'phone']
          },
          {
            model: User,
            as: 'deliveryMan',
            attributes: ['id', 'f_name', 'l_name', 'phone'],
            required: false
          },
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      return generateResponse(res, 200, `Orders with status '${status}' retrieved successfully`, {
        orders,
        status,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Get orders by status error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve orders', error.message);
    }
  }

  // Helper methods
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready_for_pickup', 'cancelled'],
      'ready_for_pickup': ['picked_up', 'cancelled'],
      'picked_up': ['on_the_way', 'cancelled'],
      'on_the_way': ['delivered', 'cancelled'],
      'delivered': [], // Final status
      'cancelled': [] // Final status
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  calculateDeliveryProgress(status) {
    const statusProgress = {
      'pending': 10,
      'confirmed': 20,
      'preparing': 40,
      'ready_for_pickup': 60,
      'picked_up': 70,
      'on_the_way': 90,
      'delivered': 100,
      'cancelled': 0
    };

    return statusProgress[status] || 0;
  }

  calculateTimeRemaining(order) {
    if (!order.estimated_delivery_time) return null;

    const now = new Date();
    const estimatedTime = new Date(order.estimated_delivery_time);
    const diffInMinutes = Math.max(0, Math.ceil((estimatedTime - now) / (1000 * 60)));

    return diffInMinutes;
  }
}

module.exports = new OrderTrackingController(); 