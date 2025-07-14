const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../../config/clerk');
const { validateRequest } = require('../../utils/validation');
const { body, query, param } = require('express-validator');
const { Conversation, DcConversation, Message, User, Order } = require('../../models');
const { successResponse, errorResponse } = require('../../utils/responses');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/conversations');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `conversation-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and documents are allowed'));
  }
});

// ======================= Customer-Admin Chat Routes =======================

/**
 * @route GET /api/v1/chat/admin/conversations
 * @desc Get customer-admin conversation list
 * @access Private (Customer)
 */
router.get('/admin/conversations', 
  requireAuth(['customer']),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const userId = req.user.id;

      const conversations = await Conversation.getConversationsByUser(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(successResponse(
        'Conversations retrieved successfully',
        {
          total_size: conversations.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          conversations: conversations.rows
        }
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

/**
 * @route POST /api/v1/chat/admin/send
 * @desc Send message to admin
 * @access Private (Customer)
 */
router.post('/admin/send',
  requireAuth(['customer']),
  upload.array('image', 5),
  [
    body('message').optional().isString().notEmpty()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user.id;
      const files = req.files || [];

      // Validate that either message or files are provided
      if (!message && files.length === 0) {
        return res.status(400).json(errorResponse('Message or files are required'));
      }

      // Process uploaded files
      const imageUrls = files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/conversations/${file.filename}`;
      });

      // Create conversation entry
      const conversation = await Conversation.createConversation({
        user_id: userId,
        message,
        images: imageUrls,
        sender: 'customer'
      });

      // TODO: Send push notification to admin
      
      res.json(successResponse('Message sent successfully', { conversation }));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// ======================= Customer-Delivery Man Chat Routes =======================

/**
 * @route GET /api/v1/chat/delivery/conversations
 * @desc Get customer-delivery man conversation list
 * @access Private (Customer)
 */
router.get('/delivery/conversations',
  requireAuth(['customer']),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('search').optional().isString()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { limit = 10, offset = 0, search } = req.query;
      const userId = req.user.id;

      const conversations = await DcConversation.getConversationsByCustomer(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        search
      });

      // Get admin last conversation for comparison
      const adminLastConversation = await Conversation.getLatestConversation(userId);

      res.json(successResponse(
        'Delivery conversations retrieved successfully',
        {
          total_size: conversations.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          admin_last_conversation: adminLastConversation,
          deliveryman_conversations: conversations.rows
        }
      ));
    } catch (error) {
      console.error('Error fetching delivery conversations:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

/**
 * @route GET /api/v1/chat/delivery/messages/:orderId
 * @desc Get messages for specific order
 * @access Private (Customer, Delivery Man)
 */
router.get('/delivery/messages/:orderId',
  requireAuth(['customer', 'delivery_man']),
  [
    param('orderId').isInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const conversation = await DcConversation.getConversationByOrder(orderId);
      
      if (!conversation) {
        return res.json(successResponse(
          'No conversation found',
          {
            total_size: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            messages: []
          }
        ));
      }

      const messages = await Message.getMessagesByConversation(conversation.id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(successResponse(
        'Messages retrieved successfully',
        {
          total_size: messages.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          messages: messages.rows
        }
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

/**
 * @route POST /api/v1/chat/delivery/send/:senderType
 * @desc Send message in delivery conversation
 * @access Private (Customer, Delivery Man)
 */
router.post('/delivery/send/:senderType',
  requireAuth(['customer', 'delivery_man']),
  upload.array('image', 5),
  [
    param('senderType').isIn(['customer', 'deliveryman']),
    body('order_id').isInt(),
    body('message').optional().isString().notEmpty()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { senderType } = req.params;
      const { order_id, message } = req.body;
      const files = req.files || [];

      // Validate that either message or files are provided
      if (!message && files.length === 0) {
        return res.status(400).json(errorResponse('Message or files are required'));
      }

      // Get order details
      const order = await Order.findByPk(order_id, {
        include: [
          { model: User, as: 'customer' },
          { model: User, as: 'delivery_man' }
        ]
      });

      if (!order) {
        return res.status(404).json(errorResponse('Order not found'));
      }

      // Validate sender authorization
      let senderId;
      if (senderType === 'customer') {
        if (req.user.id !== order.customer_id) {
          return res.status(403).json(errorResponse('Unauthorized'));
        }
        senderId = order.customer_id;
      } else if (senderType === 'deliveryman') {
        if (req.user.id !== order.delivery_man_id) {
          return res.status(403).json(errorResponse('Unauthorized'));
        }
        senderId = order.delivery_man_id;
      }

      // Process uploaded files
      const attachmentUrls = files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/conversations/${file.filename}`;
      });

      // Create or get conversation
      const conversation = await DcConversation.createConversation(order_id);

      // Create message
      const messageData = {
        conversation_id: conversation.id,
        customer_id: senderType === 'customer' ? senderId : null,
        deliveryman_id: senderType === 'deliveryman' ? senderId : null,
        message,
        attachments: attachmentUrls
      };

      const newMessage = await Message.createMessage(messageData);

      // TODO: Send push notification to receiver

      res.json(successResponse('Message sent successfully', { message: newMessage }));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// ======================= Message Management Routes =======================

/**
 * @route POST /api/v1/chat/messages/:messageId/read
 * @desc Mark message as read
 * @access Private
 */
router.post('/messages/:messageId/read',
  requireAuth(['customer', 'delivery_man']),
  [
    param('messageId').isInt()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      const userType = req.user.user_type;

      const message = await Message.findByPk(messageId);
      if (!message) {
        return res.status(404).json(errorResponse('Message not found'));
      }

      // Only mark as read if user is the receiver
      const isReceiver = (userType === 'customer' && message.customer_id !== userId) ||
                         (userType === 'delivery_man' && message.deliveryman_id !== userId);

      if (isReceiver) {
        await message.markAsRead();
      }

      res.json(successResponse('Message marked as read'));
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

/**
 * @route POST /api/v1/chat/conversations/:conversationId/read
 * @desc Mark all messages in conversation as read
 * @access Private
 */
router.post('/conversations/:conversationId/read',
  requireAuth(['customer', 'delivery_man']),
  [
    param('conversationId').isInt()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const userType = req.user.user_type;

      await Message.markMessagesAsRead(conversationId, userId, userType);

      res.json(successResponse('Messages marked as read'));
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

/**
 * @route GET /api/v1/chat/unread-count
 * @desc Get unread message count for user
 * @access Private
 */
router.get('/unread-count',
  requireAuth(['customer', 'delivery_man']),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.user_type;

      const unreadCount = await Message.getUnreadCount(userId, userType);

      res.json(successResponse('Unread count retrieved successfully', { unread_count: unreadCount }));
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

/**
 * @route GET /api/v1/chat/search
 * @desc Search messages
 * @access Private
 */
router.get('/search',
  requireAuth(['customer', 'delivery_man']),
  [
    query('q').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('conversation_id').optional().isInt()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { q, limit = 10, offset = 0, conversation_id } = req.query;

      const results = await Message.searchMessages(q, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        conversationId: conversation_id ? parseInt(conversation_id) : null
      });

      res.json(successResponse(
        'Search results retrieved successfully',
        {
          total_size: results.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          messages: results.rows
        }
      ));
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// ======================= Delivery Man Specific Routes =======================

/**
 * @route GET /api/v1/chat/delivery-man/messages/:orderId
 * @desc Get messages for delivery man (with token authentication)
 * @access Private (Delivery Man)
 */
router.get('/delivery-man/messages/:orderId',
  [
    param('orderId').isInt(),
    body('token').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { token } = req.body;
      const { limit = 10, offset = 0 } = req.query;

      // Verify delivery man token
      const deliveryMan = await User.findOne({ where: { auth_token: token } });
      if (!deliveryMan) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const conversation = await DcConversation.getConversationByOrder(orderId);
      
      if (!conversation) {
        return res.json(successResponse(
          'No conversation found',
          {
            total_size: 0,
            limit: parseInt(limit),
            offset: parseInt(offset),
            messages: []
          }
        ));
      }

      const messages = await Message.getMessagesByConversation(conversation.id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json(successResponse(
        'Messages retrieved successfully',
        {
          total_size: messages.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          messages: messages.rows
        }
      ));
    } catch (error) {
      console.error('Error fetching delivery man messages:', error);
      res.status(500).json(errorResponse(error.message));
    }
  }
);

module.exports = router; 