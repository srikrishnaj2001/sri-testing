const jwt = require('jsonwebtoken');
const { clerkConfig } = require('../config/clerk');
const { Conversation, DcConversation, Message, User, DeliveryMan, Order } = require('../models');

// Store active connections
const activeConnections = new Map();
const userSockets = new Map(); // userId -> socketId mapping
const roomUsers = new Map(); // roomId -> [userIds] mapping

// Socket.io initialization
module.exports = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, clerkConfig.jwtKey);
      
      socket.userId = decoded.sub;
      socket.userType = decoded.user_type;
      socket.email = decoded.email;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`📱 User connected: ${socket.userId} (${socket.userType})`);
    
    // Store active connection
    activeConnections.set(socket.id, {
      userId: socket.userId,
      userType: socket.userType,
      email: socket.email,
      connectedAt: new Date()
    });
    
    // Map user to socket
    userSockets.set(socket.userId, socket.id);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join user type specific room
    socket.join(`${socket.userType}_users`);

    // ======================= Chat Room Management =======================

    // Handle joining chat room for specific order
    socket.on('join_chat_room', ({ orderId, userType: _userType }) => {
      const roomId = `order_${orderId}`;
      socket.join(roomId);
      
      // Add user to room mapping
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, []);
      }
      const roomUserList = roomUsers.get(roomId);
      if (!roomUserList.includes(socket.userId)) {
        roomUserList.push(socket.userId);
      }

      console.log(`👥 User ${socket.userId} joined chat room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined_chat', {
        userId: socket.userId,
        userType: socket.userType,
        timestamp: new Date()
      });
    });

    // Handle leaving chat room
    socket.on('leave_chat_room', ({ orderId }) => {
      const roomId = `order_${orderId}`;
      socket.leave(roomId);
      
      // Remove user from room mapping
      if (roomUsers.has(roomId)) {
        const roomUserList = roomUsers.get(roomId);
        const index = roomUserList.indexOf(socket.userId);
        if (index > -1) {
          roomUserList.splice(index, 1);
        }
      }

      console.log(`👥 User ${socket.userId} left chat room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_left_chat', {
        userId: socket.userId,
        userType: socket.userType,
        timestamp: new Date()
      });
    });

    // ======================= Message Handling =======================

    // Handle sending chat messages for order-based conversations
    socket.on('send_message', async (data) => {
      try {
        const { orderId, message, type = 'text', attachments = [] } = data;
        const roomId = `order_${orderId}`;

        // Validate message data
        if (!orderId || (!message?.trim() && attachments.length === 0)) {
          socket.emit('message_error', { error: 'Invalid message data' });
          return;
        }

        // Get order details to validate authorization
        const order = await Order.findByPk(orderId, {
          include: [
            { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'email'] },
            { model: DeliveryMan, as: 'delivery_man', attributes: ['id', 'first_name', 'last_name', 'email'] }
          ]
        });

        if (!order) {
          socket.emit('message_error', { error: 'Order not found' });
          return;
        }

        // Validate sender authorization
        const isCustomer = socket.userType === 'customer' && socket.userId === order.customer_id;
        const isDeliveryMan = socket.userType === 'delivery_man' && socket.userId === order.delivery_man_id;

        if (!isCustomer && !isDeliveryMan) {
          socket.emit('message_error', { error: 'Unauthorized to send message for this order' });
          return;
        }

        // Create or get conversation
        const conversation = await DcConversation.createConversation(orderId);

        // Create message in database
        const messageData = {
          conversation_id: conversation.id,
          customer_id: isCustomer ? socket.userId : null,
          deliveryman_id: isDeliveryMan ? socket.userId : null,
          message: message?.trim() || null,
          attachments
        };

        const savedMessage = await Message.createMessage(messageData);

        // Load message with sender details
        const fullMessage = await Message.findByPk(savedMessage.id, {
          include: [
            { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'email', 'image'] },
            { model: DeliveryMan, as: 'delivery_man', attributes: ['id', 'first_name', 'last_name', 'email', 'image'] }
          ]
        });

        const messageResponse = {
          id: fullMessage.id,
          orderId,
          conversationId: conversation.id,
          senderId: socket.userId,
          senderType: socket.userType,
          senderData: isCustomer ? fullMessage.customer : fullMessage.delivery_man,
          message: fullMessage.message,
          attachments: fullMessage.getAttachments(),
          type,
          timestamp: fullMessage.created_at,
          isRead: fullMessage.is_read
        };

        // Emit message to all users in the room
        io.to(roomId).emit('new_message', messageResponse);

        // Send confirmation to sender
        socket.emit('message_sent', { 
          messageId: savedMessage.id,
          timestamp: savedMessage.created_at
        });

        console.log(`💬 Message sent in room ${roomId} by ${socket.userId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle sending admin messages
    socket.on('send_admin_message', async (data) => {
      try {
        const { message, attachments = [] } = data;

        // Validate message data
        if (!message?.trim() && attachments.length === 0) {
          socket.emit('message_error', { error: 'Message or attachments required' });
          return;
        }

        // Only customers can send admin messages
        if (socket.userType !== 'customer') {
          socket.emit('message_error', { error: 'Only customers can send admin messages' });
          return;
        }

        // Create admin conversation
        const conversation = await Conversation.createConversation({
          user_id: socket.userId,
          message: message?.trim(),
          images: attachments,
          sender: 'customer'
        });

        // Load conversation with user details
        const fullConversation = await Conversation.findByPk(conversation.id, {
          include: [
            { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'email', 'image'] }
          ]
        });

        const messageResponse = {
          id: fullConversation.id,
          userId: socket.userId,
          senderType: 'customer',
          senderData: fullConversation.customer,
          message: fullConversation.message,
          attachments: fullConversation.getImages(),
          timestamp: fullConversation.created_at
        };

        // Emit to admin room
        io.to('admin_users').emit('new_admin_message', messageResponse);

        // Send confirmation to sender
        socket.emit('admin_message_sent', { 
          messageId: conversation.id,
          timestamp: conversation.created_at
        });

        console.log(`💬 Admin message sent by customer ${socket.userId}`);

      } catch (error) {
        console.error('Error sending admin message:', error);
        socket.emit('message_error', { error: 'Failed to send admin message' });
      }
    });

    // ======================= Message Status Management =======================

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId, orderId } = data;

        const message = await Message.findByPk(messageId);
        if (!message) {
          socket.emit('message_error', { error: 'Message not found' });
          return;
        }

        // Only mark as read if user is the receiver
        const isReceiver = (socket.userType === 'customer' && message.customer_id !== socket.userId) ||
                          (socket.userType === 'delivery_man' && message.deliveryman_id !== socket.userId);

        if (isReceiver) {
          await message.markAsRead();
          
          const roomId = `order_${orderId}`;
          // Notify sender that message was read
          socket.to(roomId).emit('message_read', {
            messageId,
            readBy: socket.userId,
            readAt: new Date()
          });
        }

      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('message_error', { error: 'Failed to mark message as read' });
      }
    });

    // Mark all messages in conversation as read
    socket.on('mark_conversation_read', async (data) => {
      try {
        const { conversationId, orderId } = data;

        await Message.markMessagesAsRead(conversationId, socket.userId, socket.userType);

        const roomId = `order_${orderId}`;
        // Notify others in the room
        socket.to(roomId).emit('conversation_read', {
          conversationId,
          readBy: socket.userId,
          readAt: new Date()
        });

      } catch (error) {
        console.error('Error marking conversation as read:', error);
        socket.emit('message_error', { error: 'Failed to mark conversation as read' });
      }
    });

    // ======================= Typing Indicators =======================

    // Handle typing indicators
    socket.on('typing_start', ({ orderId }) => {
      const roomId = `order_${orderId}`;
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        userType: socket.userType,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ orderId }) => {
      const roomId = `order_${orderId}`;
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        userType: socket.userType,
        isTyping: false
      });
    });

    // ======================= Order Tracking Events =======================

    // Handle order status updates (for delivery tracking)
    socket.on('join_order_tracking', ({ orderId }) => {
      const trackingRoom = `tracking_${orderId}`;
      socket.join(trackingRoom);
      console.log(`📍 User ${socket.userId} joined order tracking: ${orderId}`);
    });

    // Handle delivery man location updates
    socket.on('update_location', (data) => {
      if (socket.userType === 'delivery_man') {
        const { orderId, latitude, longitude } = data;
        const trackingRoom = `tracking_${orderId}`;
        
        // Emit location update to customers tracking this order
        socket.to(trackingRoom).emit('delivery_location_update', {
          orderId,
          latitude,
          longitude,
          timestamp: new Date(),
          deliveryManId: socket.userId
        });

        console.log(`📍 Location updated for order ${orderId} by delivery man ${socket.userId}`);
      }
    });

    // Handle order status updates
    socket.on('order_status_update', (data) => {
      const { orderId, status, message } = data;
      const trackingRoom = `tracking_${orderId}`;
      
      // Emit status update to all tracking this order
      io.to(trackingRoom).emit('order_status_changed', {
        orderId,
        status,
        message,
        updatedBy: socket.userId,
        updatedByType: socket.userType,
        timestamp: new Date()
      });

      console.log(`📦 Order ${orderId} status updated to ${status} by ${socket.userId}`);
    });

    // ======================= Connection Management =======================

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`📱 User disconnected: ${socket.userId} (${socket.userType})`);
      
      // Remove from active connections
      activeConnections.delete(socket.id);
      userSockets.delete(socket.userId);
      
      // Remove from all room user mappings
      roomUsers.forEach((userList, roomId) => {
        const index = userList.indexOf(socket.userId);
        if (index > -1) {
          userList.splice(index, 1);
          // Notify others in the room
          socket.to(roomId).emit('user_left_chat', {
            userId: socket.userId,
            userType: socket.userType,
            timestamp: new Date()
          });
        }
      });
    });

    // Handle manual status updates
    socket.on('update_online_status', (data) => {
      const { isOnline } = data;
      
      // Update user's online status
      if (activeConnections.has(socket.id)) {
        const connection = activeConnections.get(socket.id);
        connection.isOnline = isOnline;
        connection.lastSeen = new Date();
      }

      // Notify relevant users about status change
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        userType: socket.userType,
        isOnline,
        timestamp: new Date()
      });
    });

    // ======================= Utility Functions =======================

    // Get online users in a room
    socket.on('get_room_users', ({ orderId }) => {
      const roomId = `order_${orderId}`;
      const roomUserList = roomUsers.get(roomId) || [];
      
      const onlineUsers = roomUserList.map(userId => {
        const socketId = userSockets.get(userId);
        const connection = socketId ? activeConnections.get(socketId) : null;
        
        return {
          userId,
          userType: connection?.userType,
          isOnline: !!connection,
          lastSeen: connection?.lastSeen || connection?.connectedAt
        };
      });

      socket.emit('room_users', { orderId, users: onlineUsers });
    });

    // Get unread message count
    socket.on('get_unread_count', async () => {
      try {
        const unreadCount = await Message.getUnreadCount(socket.userId, socket.userType);
        socket.emit('unread_count', { count: unreadCount });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('message_error', { error: 'Failed to get unread count' });
      }
    });
  });

  // ======================= Utility Functions =======================

  // Helper function to get user socket
  const getUserSocket = (userId) => {
    const socketId = userSockets.get(userId);
    return socketId ? io.sockets.sockets.get(socketId) : null;
  };

  // Helper function to send notification to user
  const sendNotificationToUser = (userId, notification) => {
    const userSocket = getUserSocket(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  };

  // Helper function to get active connections count
  const getActiveConnectionsCount = () => {
    return activeConnections.size;
  };

  // Helper function to get users in room
  const getUsersInRoom = (roomId) => {
    return roomUsers.get(roomId) || [];
  };

  // Export utility functions for use in other parts of the application
  io.chatUtils = {
    getUserSocket,
    sendNotificationToUser,
    getActiveConnectionsCount,
    getUsersInRoom
  };

  console.log('🔌 Chat Socket.io initialized successfully');
}; 