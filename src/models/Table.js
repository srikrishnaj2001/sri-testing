const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Table = sequelize.define('Table', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Table number for identification'
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
      allowNull: false,
      comment: 'Number of people this table can accommodate'
    },
    branch_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'Branch this table belongs to'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether table is available for use'
    },
    is_occupied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether table is currently occupied'
    },
    qr_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'QR code for table ordering'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional table description or notes'
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Physical position of table (e.g., window, corner, center)'
    }
  }, {
    tableName: 'tables',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['branch_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_occupied']
      },
      {
        fields: ['number', 'branch_id'],
        unique: true
      }
    ]
  });

  // Define associations
  Table.associate = function(models) {
    Table.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch',
      onDelete: 'CASCADE'
    });
    
    Table.hasMany(models.Order, {
      foreignKey: 'table_id',
      as: 'orders'
    });
  };

  return Table;
}; 