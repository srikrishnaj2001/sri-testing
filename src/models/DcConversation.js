const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const DcConversation = sequelize.define('DcConversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'dc_conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['order_id'],
        unique: true
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Static methods
  DcConversation.getConversationByOrder = async function(orderId) {
    return await this.findOne({
      where: { order_id: orderId },
      include: [
        {
          model: sequelize.models.Order,
          as: 'order',
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
          ]
        },
        {
          model: sequelize.models.Message,
          as: 'messages',
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
          ]
        }
      ]
    });
  };

  DcConversation.getConversationsByDeliveryMan = async function(deliveryManId, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    return await this.findAndCountAll({
      include: [
        {
          model: sequelize.models.Order,
          as: 'order',
          where: { delivery_man_id: deliveryManId },
          include: [
            {
              model: sequelize.models.User,
              as: 'customer',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
            }
          ]
        },
        {
          model: sequelize.models.Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
  };

  DcConversation.getConversationsByCustomer = async function(customerId, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    return await this.findAndCountAll({
      include: [
        {
          model: sequelize.models.Order,
          as: 'order',
          where: { customer_id: customerId },
          include: [
            {
              model: sequelize.models.User,
              as: 'delivery_man',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
            }
          ]
        },
        {
          model: sequelize.models.Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
  };

  DcConversation.createConversation = async function(orderId) {
    const [conversation] = await this.findOrCreate({
      where: { order_id: orderId },
      defaults: { order_id: orderId }
    });
    
    return conversation;
  };

  DcConversation.getActiveConversations = async function(options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    return await this.findAndCountAll({
      include: [
        {
          model: sequelize.models.Order,
          as: 'order',
          where: {
            order_status: {
              [Op.in]: ['confirmed', 'processing', 'out_for_delivery']
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
            }
          ]
        },
        {
          model: sequelize.models.Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
  };

  DcConversation.searchConversations = async function(searchTerm, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    return await this.findAndCountAll({
      include: [
        {
          model: sequelize.models.Order,
          as: 'order',
          include: [
            {
              model: sequelize.models.User,
              as: 'customer',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image'],
              where: {
                [Op.or]: [
                  { f_name: { [Op.iLike]: `%${searchTerm}%` } },
                  { l_name: { [Op.iLike]: `%${searchTerm}%` } },
                  { phone: { [Op.iLike]: `%${searchTerm}%` } }
                ]
              }
            },
            {
              model: sequelize.models.User,
              as: 'delivery_man',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
            }
          ]
        },
        {
          model: sequelize.models.Message,
          as: 'messages',
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset
    });
  };

  // Associations
  DcConversation.associate = function(models) {
    DcConversation.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order'
    });

    DcConversation.hasMany(models.Message, {
      foreignKey: 'conversation_id',
      as: 'messages'
    });
  };

  return DcConversation;
}; 