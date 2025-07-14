const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
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
    reply: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of image URLs'
    },
    is_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    sender: {
      type: DataTypes.ENUM('customer', 'admin'),
      allowNull: true
    }
  }, {
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['sender']
      }
    ]
  });

  // Instance methods
  Conversation.prototype.getImages = function() {
    if (!this.image) return [];
    try {
      return JSON.parse(this.image);
    } catch (error) {
      return [];
    }
  };

  Conversation.prototype.setImages = function(images) {
    this.image = JSON.stringify(images);
  };

  // Static methods
  Conversation.getConversationsByUser = async function(userId, options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    return await this.findAndCountAll({
      where: { user_id: userId },
      order: [[orderBy, orderDirection]],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.User,
          as: 'customer',
          attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
        }
      ]
    });
  };

  Conversation.createConversation = async function(data) {
    const { user_id, message, reply, images = [], sender = 'customer' } = data;
    
    return await this.create({
      user_id,
      message,
      reply,
      image: JSON.stringify(images),
      sender
    });
  };

  Conversation.getLatestConversation = async function(userId) {
    return await this.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: sequelize.models.User,
          as: 'customer',
          attributes: ['id', 'f_name', 'l_name', 'email', 'phone', 'image']
        }
      ]
    });
  };

  // Associations
  Conversation.associate = function(models) {
    Conversation.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'customer'
    });
  };

  return Conversation;
}; 