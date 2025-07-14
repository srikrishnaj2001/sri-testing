const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'dc_conversations',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    deliveryman_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of attachment URLs'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['conversation_id']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['deliveryman_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['is_read']
      }
    ]
  });

  // Instance methods
  Message.prototype.getAttachments = function() {
    if (!this.attachment) return [];
    try {
      return JSON.parse(this.attachment);
    } catch (error) {
      return [];
    }
  };

  Message.prototype.setAttachments = function(attachments) {
    this.attachment = JSON.stringify(attachments);
  };

  Message.prototype.markAsRead = function() {
    this.is_read = true;
    this.read_at = new Date();
    return this.save();
  };

  // Static methods
  Message.createMessage = async function(data) {
    const {
      conversation_id,
      customer_id,
      deliveryman_id,
      message,
      attachments = []
    } = data;
    
    return await this.create({
      conversation_id,
      customer_id,
      deliveryman_id,
      message,
      attachment: JSON.stringify(attachments)
    });
  };

  Message.getConversationMessages = async function(conversationId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'ASC' } = options;
    
    return await this.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [
        {
          model: sequelize.models.User,
          as: 'customer',
          attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
        },
        {
          model: sequelize.models.User,
          as: 'delivery_man',
          attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
        }
      ],
      order: [[orderBy, orderDirection]],
      limit,
      offset
    });
  };

  Message.getUnreadMessages = async function(userId, userType) {
    const whereCondition = userType === 'customer' 
      ? { customer_id: userId, is_read: false }
      : { deliveryman_id: userId, is_read: false };
    
    return await this.findAll({
      where: whereCondition,
      include: [
        {
          model: sequelize.models.DcConversation,
          as: 'conversation',
          include: [
            {
              model: sequelize.models.Order,
              as: 'order'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  Message.markConversationAsRead = async function(conversationId, userId, userType) {
    const whereCondition = {
      conversation_id: conversationId,
      is_read: false
    };
    
    if (userType === 'customer') {
      whereCondition.deliveryman_id = { [Op.ne]: null };
    } else {
      whereCondition.customer_id = { [Op.ne]: null };
    }
    
    return await this.update(
      { 
        is_read: true, 
        read_at: new Date() 
      },
      { where: whereCondition }
    );
  };

  Message.searchMessages = async function(searchTerm, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    return await this.findAndCountAll({
      where: {
        message: {
          [Op.iLike]: `%${searchTerm}%`
        }
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'customer',
          attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
        },
        {
          model: sequelize.models.User,
          as: 'delivery_man',
          attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
        },
        {
          model: sequelize.models.DcConversation,
          as: 'conversation',
          include: [
            {
              model: sequelize.models.Order,
              as: 'order',
              attributes: ['id', 'order_amount', 'order_status']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  Message.getMessageStatistics = async function(conversationId) {
    const [totalMessages, unreadCount] = await Promise.all([
      this.count({ where: { conversation_id: conversationId } }),
      this.count({ 
        where: { 
          conversation_id: conversationId,
          is_read: false 
        }
      })
    ]);
    
    return {
      total_messages: totalMessages,
      unread_count: unreadCount,
      read_count: totalMessages - unreadCount
    };
  };

  Message.getLastMessage = async function(conversationId) {
    return await this.findOne({
      where: { conversation_id: conversationId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: sequelize.models.User,
          as: 'customer',
          attributes: ['id', 'f_name', 'l_name']
        },
        {
          model: sequelize.models.User,
          as: 'delivery_man',
          attributes: ['id', 'f_name', 'l_name']
        }
      ]
    });
  };

  // Associations
  Message.associate = function(models) {
    Message.belongsTo(models.DcConversation, {
      foreignKey: 'conversation_id',
      as: 'conversation'
    });

    Message.belongsTo(models.User, {
      foreignKey: 'customer_id',
      as: 'customer'
    });

    Message.belongsTo(models.User, {
      foreignKey: 'deliveryman_id',
      as: 'delivery_man'
    });
  };

  return Message;
}; 