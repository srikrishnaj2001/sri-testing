const db = require('../models');
const { generateResponse, generateErrorResponse, generatePaginatedResponse } = require('../utils/responseHelper');

const { User, Product, Branch } = db;

class DeliveryOrderController {
  // Get assigned orders for delivery man
  async getAssignedOrders(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20, status, date_from, date_to } = req.query;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      let orders = deliveryMan.getAssignedOrders();

      // Filter by status
      if (status) {
        orders = orders.filter(order => order.order_status === status);
      }

      // Filter by date range
      if (date_from || date_to) {
        orders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const fromDate = date_from ? new Date(date_from) : null;
          const toDate = date_to ? new Date(date_to) : null;

          if (fromDate && orderDate < fromDate) return false;
          if (toDate && orderDate > toDate) return false;
          return true;
        });
      }

      // Sort by created date (newest first)
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Add computed fields
      const ordersWithDetails = orders.map(order => {
        const orderData = { ...order };
        orderData.estimated_delivery_time = this.calculateEstimatedDeliveryTime(order);
        orderData.distance_to_pickup = this.calculateDistance(
          deliveryMan.getCurrentLocation(),
          order.restaurant_location
        );
        orderData.distance_to_customer = this.calculateDistance(
          order.restaurant_location,
          order.delivery_address
        );
        orderData.total_distance = orderData.distance_to_pickup + orderData.distance_to_customer;
        orderData.delivery_fee = this.calculateDeliveryFee(orderData.total_distance);
        return orderData;
      });

      // Pagination
      const total = ordersWithDetails.length;
      const offset = (page - 1) * limit;
      const paginatedOrders = ordersWithDetails.slice(offset, offset + parseInt(limit));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, paginatedOrders, pagination, 'Assigned orders retrieved successfully');

    } catch (error) {
      console.error('Get assigned orders error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve assigned orders', error.message);
    }
  }

  // Get single order details
  async getOrderDetails(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const order = orders.find(o => o.id === order_id);

      if (!order) {
        return generateErrorResponse(res, 404, 'Order not found or not assigned to you');
      }

      // Add detailed information
      const orderDetails = {
        ...order,
        delivery_instructions: order.delivery_instructions || 'No special instructions',
        customer_info: {
          name: order.customer_name,
          phone: order.customer_phone,
          alternate_phone: order.customer_alternate_phone
        },
        restaurant_info: {
          name: order.restaurant_name,
          phone: order.restaurant_phone,
          address: order.restaurant_address,
          location: order.restaurant_location
        },
        delivery_address: order.delivery_address,
        items: order.items || [],
        payment_info: {
          method: order.payment_method,
          status: order.payment_status,
          total_amount: order.total_amount,
          delivery_fee: order.delivery_fee
        },
        timeline: order.timeline || [],
        estimated_delivery_time: this.calculateEstimatedDeliveryTime(order),
        current_location: deliveryMan.getCurrentLocation()
      };

      return generateResponse(res, 200, 'Order details retrieved successfully', {
        order: orderDetails
      });

    } catch (error) {
      console.error('Get order details error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve order details', error.message);
    }
  }

  // Accept order assignment
  async acceptOrder(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      // Check if delivery man is available
      if (!deliveryMan.isAvailableForDelivery()) {
        return generateErrorResponse(res, 400, 'Delivery man is not available for new orders');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found or not assigned to you');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'assigned') {
        return generateErrorResponse(res, 400, 'Order cannot be accepted in current status');
      }

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'accepted',
        accepted_at: new Date(),
        timeline: [
          ...(order.timeline || []),
          {
            status: 'accepted',
            timestamp: new Date(),
            description: 'Order accepted by delivery man'
          }
        ]
      };

      // Update delivery man status
      await deliveryMan.update({
        assigned_orders: orders,
        is_available: false, // Mark as busy
        delivery_status: {
          status: 'busy',
          current_order_id: order_id,
          updated_at: new Date()
        }
      });

      return generateResponse(res, 200, 'Order accepted successfully', {
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Accept order error:', error);
      return generateErrorResponse(res, 500, 'Failed to accept order', error.message);
    }
  }

  // Start journey to pickup location
  async startPickupJourney(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'accepted') {
        return generateErrorResponse(res, 400, 'Order must be accepted before starting pickup journey');
      }

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'pickup_started',
        pickup_started_at: new Date(),
        timeline: [
          ...(order.timeline || []),
          {
            status: 'pickup_started',
            timestamp: new Date(),
            description: 'Delivery man started journey to pickup location'
          }
        ]
      };

      await deliveryMan.update({
        assigned_orders: orders
      });

      return generateResponse(res, 200, 'Pickup journey started successfully', {
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Start pickup journey error:', error);
      return generateErrorResponse(res, 500, 'Failed to start pickup journey', error.message);
    }
  }

  // Arrive at pickup location
  async arriveAtPickup(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'pickup_started') {
        return generateErrorResponse(res, 400, 'Invalid order status for arrival at pickup');
      }

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'arrived_at_pickup',
        arrived_at_pickup_at: new Date(),
        timeline: [
          ...(order.timeline || []),
          {
            status: 'arrived_at_pickup',
            timestamp: new Date(),
            description: 'Delivery man arrived at pickup location'
          }
        ]
      };

      await deliveryMan.update({
        assigned_orders: orders
      });

      return generateResponse(res, 200, 'Arrived at pickup location successfully', {
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Arrive at pickup error:', error);
      return generateErrorResponse(res, 500, 'Failed to mark arrival at pickup', error.message);
    }
  }

  // Pickup order from restaurant
  async pickupOrder(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;
      const { pickup_notes, items_verified } = req.body;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'arrived_at_pickup') {
        return generateErrorResponse(res, 400, 'Must arrive at pickup location first');
      }

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'picked_up',
        picked_up_at: new Date(),
        pickup_notes: pickup_notes || '',
        items_verified: items_verified !== false,
        timeline: [
          ...(order.timeline || []),
          {
            status: 'picked_up',
            timestamp: new Date(),
            description: `Order picked up from restaurant${pickup_notes ? `. Notes: ${pickup_notes}` : ''}`
          }
        ]
      };

      await deliveryMan.update({
        assigned_orders: orders
      });

      return generateResponse(res, 200, 'Order picked up successfully', {
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Pickup order error:', error);
      return generateErrorResponse(res, 500, 'Failed to pickup order', error.message);
    }
  }

  // Start delivery journey
  async startDeliveryJourney(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'picked_up') {
        return generateErrorResponse(res, 400, 'Order must be picked up before starting delivery');
      }

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'on_the_way',
        delivery_started_at: new Date(),
        timeline: [
          ...(order.timeline || []),
          {
            status: 'on_the_way',
            timestamp: new Date(),
            description: 'Delivery man started journey to customer location'
          }
        ]
      };

      await deliveryMan.update({
        assigned_orders: orders
      });

      return generateResponse(res, 200, 'Delivery journey started successfully', {
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Start delivery journey error:', error);
      return generateErrorResponse(res, 500, 'Failed to start delivery journey', error.message);
    }
  }

  // Arrive at delivery location
  async arriveAtDelivery(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'on_the_way') {
        return generateErrorResponse(res, 400, 'Invalid order status for arrival at delivery location');
      }

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'arrived_at_delivery',
        arrived_at_delivery_at: new Date(),
        timeline: [
          ...(order.timeline || []),
          {
            status: 'arrived_at_delivery',
            timestamp: new Date(),
            description: 'Delivery man arrived at customer location'
          }
        ]
      };

      await deliveryMan.update({
        assigned_orders: orders
      });

      return generateResponse(res, 200, 'Arrived at delivery location successfully', {
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Arrive at delivery error:', error);
      return generateErrorResponse(res, 500, 'Failed to mark arrival at delivery location', error.message);
    }
  }

  // Complete delivery
  async completeDelivery(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;
      const { delivery_notes, customer_rating, delivery_image } = req.body;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const order = orders[orderIndex];

      if (order.order_status !== 'arrived_at_delivery') {
        return generateErrorResponse(res, 400, 'Must arrive at delivery location first');
      }

      // Calculate delivery time
      const deliveryTime = new Date() - new Date(order.delivery_started_at);

      // Update order status
      orders[orderIndex] = {
        ...order,
        order_status: 'delivered',
        delivered_at: new Date(),
        delivery_notes: delivery_notes || '',
        delivery_time_minutes: Math.round(deliveryTime / (1000 * 60)),
        delivery_image,
        timeline: [
          ...(order.timeline || []),
          {
            status: 'delivered',
            timestamp: new Date(),
            description: `Order delivered successfully${delivery_notes ? `. Notes: ${delivery_notes}` : ''}`
          }
        ]
      };

      // Update delivery man availability
      await deliveryMan.update({
        assigned_orders: orders,
        is_available: true, // Mark as available for new orders
        delivery_status: {
          status: 'available',
          updated_at: new Date()
        }
      });

      // Calculate earnings
      const earnings = this.calculateDeliveryEarnings(orders[orderIndex]);

      return generateResponse(res, 200, 'Delivery completed successfully', {
        order: orders[orderIndex],
        earnings
      });

    } catch (error) {
      console.error('Complete delivery error:', error);
      return generateErrorResponse(res, 500, 'Failed to complete delivery', error.message);
    }
  }

  // Report delivery issue
  async reportIssue(req, res) {
    try {
      const { userId } = req.user;
      const { order_id } = req.params;
      const { issue_type, description, images } = req.body;

      if (!issue_type || !description) {
        return generateErrorResponse(res, 400, 'Issue type and description are required');
      }

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      const orders = deliveryMan.getAssignedOrders();
      const orderIndex = orders.findIndex(o => o.id === order_id);

      if (orderIndex === -1) {
        return generateErrorResponse(res, 404, 'Order not found');
      }

      const issue = {
        id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: issue_type,
        description,
        images: images || [],
        reported_at: new Date(),
        status: 'open'
      };

      // Add issue to order
      const order = orders[orderIndex];
      orders[orderIndex] = {
        ...order,
        issues: [...(order.issues || []), issue],
        timeline: [
          ...(order.timeline || []),
          {
            status: 'issue_reported',
            timestamp: new Date(),
            description: `Issue reported: ${issue_type} - ${description}`
          }
        ]
      };

      await deliveryMan.update({
        assigned_orders: orders
      });

      return generateResponse(res, 200, 'Issue reported successfully', {
        issue,
        order: orders[orderIndex]
      });

    } catch (error) {
      console.error('Report issue error:', error);
      return generateErrorResponse(res, 500, 'Failed to report issue', error.message);
    }
  }

  // Get delivery history
  async getDeliveryHistory(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20, status, date_from, date_to } = req.query;

      const deliveryMan = await User.findOne({
        where: { id: userId, user_type: 'delivery_man' }
      });

      if (!deliveryMan) {
        return generateErrorResponse(res, 404, 'Delivery man not found');
      }

      let deliveryHistory = deliveryMan.getDeliveryHistory();

      // Filter by status
      if (status) {
        deliveryHistory = deliveryHistory.filter(delivery => delivery.order_status === status);
      }

      // Filter by date range
      if (date_from || date_to) {
        deliveryHistory = deliveryHistory.filter(delivery => {
          const deliveryDate = new Date(delivery.delivered_at || delivery.created_at);
          const fromDate = date_from ? new Date(date_from) : null;
          const toDate = date_to ? new Date(date_to) : null;

          if (fromDate && deliveryDate < fromDate) return false;
          if (toDate && deliveryDate > toDate) return false;
          return true;
        });
      }

      // Sort by delivery date (newest first)
      deliveryHistory.sort((a, b) => new Date(b.delivered_at || b.created_at) - new Date(a.delivered_at || a.created_at));

      // Pagination
      const total = deliveryHistory.length;
      const offset = (page - 1) * limit;
      const paginatedHistory = deliveryHistory.slice(offset, offset + parseInt(limit));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, paginatedHistory, pagination, 'Delivery history retrieved successfully');

    } catch (error) {
      console.error('Get delivery history error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery history', error.message);
    }
  }

  // Helper methods
  calculateEstimatedDeliveryTime(order) {
    // Simple calculation based on distance and average speed
    const totalDistance = order.total_distance || 5; // km
    const averageSpeed = 25; // km/h
    const preparationTime = 15; // minutes
    
    const travelTime = (totalDistance / averageSpeed) * 60; // minutes
    return Math.round(preparationTime + travelTime);
  }

  calculateDistance(location1, location2) {
    if (!location1 || !location2 || !location1.latitude || !location2.latitude) {
      return 0;
    }

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  calculateDeliveryFee(distance) {
    const baseFee = 2.00; // Base delivery fee
    const perKmFee = 0.50; // Per km fee
    return baseFee + (distance * perKmFee);
  }

  calculateDeliveryEarnings(order) {
    const basePay = 3.00; // Base pay per delivery
    const distanceBonus = (order.total_distance || 0) * 0.30; // Distance bonus
    const timeBonusMultiplier = order.delivery_time_minutes <= 30 ? 1.2 : 1.0; // Time bonus

    const totalEarnings = (basePay + distanceBonus) * timeBonusMultiplier;
    
    return {
      base_pay: basePay,
      distance_bonus: distanceBonus,
      time_bonus: totalEarnings - basePay - distanceBonus,
      total: parseFloat(totalEarnings.toFixed(2))
    };
  }
}

module.exports = new DeliveryOrderController(); 