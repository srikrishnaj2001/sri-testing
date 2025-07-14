const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Table, TableOrder, Order, Branch, User } = require('../models');
const { paginate } = require('../utils/pagination');
const { formatResponse } = require('../utils/responseFormatter');

class TableBookingService {
  
  /**
   * Get all available tables for a branch
   * @param {number} branchId - Branch ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Tables with pagination
   */
  async getAvailableTables(branchId, options = {}) {
    const { page = 1, limit = 20, search = '', includeOccupied = false } = options;
    
    const whereClause = {
      branch_id: branchId,
      is_active: true
    };

    if (!includeOccupied) {
      whereClause.is_occupied = false;
    }

    if (search) {
      whereClause[Op.or] = [
        { number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } }
      ];
    }

    const tables = await Table.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name', 'address']
        },
        {
          model: Order,
          as: 'orders',
          where: {
            order_status: {
              [Op.in]: ['confirmed', 'cooking', 'done']
            }
          },
          required: false,
          include: [
            {
              model: TableOrder,
              as: 'table_order',
              where: {
                branch_table_token_is_expired: false
              },
              required: false
            }
          ]
        }
      ],
      order: [['number', 'ASC']],
      ...paginate(page, limit)
    });

    return {
      tables: tables.rows.map(table => ({
        ...table.toJSON(),
        hasActiveOrders: table.orders.length > 0,
        activeOrdersCount: table.orders.length
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: tables.count,
        totalPages: Math.ceil(tables.count / limit)
      }
    };
  }

  /**
   * Create a new table booking session
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} - Created table order
   */
  async createTableSession(bookingData) {
    const {
      table_id,
      branch_id,
      created_by,
      total_people,
      notes
    } = bookingData;

    // Validate table exists and is available
    const table = await Table.findOne({
      where: {
        id: table_id,
        branch_id: branch_id,
        is_active: true
      }
    });

    if (!table) {
      throw new Error('Table not found or not available');
    }

    // Check if table is already occupied
    const existingSession = await TableOrder.findOne({
      where: {
        table_id: table_id,
        branch_table_token_is_expired: false,
        status: 'active'
      }
    });

    if (existingSession) {
      throw new Error('Table is already occupied');
    }

    // Create new table session
    const tableOrder = await TableOrder.create({
      table_id,
      branch_id,
      created_by,
      total_people,
      notes,
      branch_table_token: this.generateTableToken(),
      branch_table_token_is_expired: false,
      session_start_time: new Date(),
      status: 'active'
    });

    // Mark table as occupied
    await table.update({ is_occupied: true });

    return await this.getTableSessionDetails(tableOrder.id);
  }

  /**
   * Get table session details
   * @param {number} tableOrderId - Table order ID
   * @returns {Promise<Object>} - Table session details
   */
  async getTableSessionDetails(tableOrderId) {
    const tableOrder = await TableOrder.findByPk(tableOrderId, {
      include: [
        {
          model: Table,
          as: 'table',
          include: [{
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'f_name', 'l_name', 'email']
        },
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!tableOrder) {
      throw new Error('Table session not found');
    }

    return {
      ...tableOrder.toJSON(),
      sessionDuration: this.calculateSessionDuration(tableOrder.session_start_time),
      totalOrders: tableOrder.orders.length,
      totalAmount: tableOrder.orders.reduce((sum, order) => sum + parseFloat(order.order_amount), 0)
    };
  }

  /**
   * Place order for a table
   * @param {string} tableToken - Table token
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} - Created order
   */
  async placeTableOrder(tableToken, orderData) {
    // Find active table session
    const tableOrder = await TableOrder.findOne({
      where: {
        branch_table_token: tableToken,
        branch_table_token_is_expired: false,
        status: 'active'
      },
      include: [
        {
          model: Table,
          as: 'table'
        }
      ]
    });

    if (!tableOrder) {
      throw new Error('Invalid table token or session expired');
    }

    // Create order with table reference
    const order = await Order.create({
      ...orderData,
      table_id: tableOrder.table_id,
      table_order_id: tableOrder.id,
      branch_id: tableOrder.branch_id,
      order_type: 'dine_in',
      number_of_people: orderData.number_of_people || tableOrder.total_people
    });

    return order;
  }

  /**
   * Get table orders by token
   * @param {string} tableToken - Table token
   * @returns {Promise<Array>} - Orders for the table
   */
  async getTableOrders(tableToken) {
    const tableOrder = await TableOrder.findOne({
      where: {
        branch_table_token: tableToken,
        branch_table_token_is_expired: false
      },
      include: [
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!tableOrder) {
      throw new Error('Table session not found');
    }

    return tableOrder.orders;
  }

  /**
   * Complete table session
   * @param {number} tableOrderId - Table order ID
   * @returns {Promise<Object>} - Updated table order
   */
  async completeTableSession(tableOrderId) {
    const tableOrder = await TableOrder.findByPk(tableOrderId, {
      include: [
        {
          model: Table,
          as: 'table'
        }
      ]
    });

    if (!tableOrder) {
      throw new Error('Table session not found');
    }

    // Update table session
    await tableOrder.update({
      status: 'completed',
      session_end_time: new Date(),
      branch_table_token_is_expired: true
    });

    // Mark table as available
    await tableOrder.table.update({ is_occupied: false });

    return await this.getTableSessionDetails(tableOrder.id);
  }

  /**
   * Cancel table session
   * @param {number} tableOrderId - Table order ID
   * @returns {Promise<Object>} - Updated table order
   */
  async cancelTableSession(tableOrderId) {
    const tableOrder = await TableOrder.findByPk(tableOrderId, {
      include: [
        {
          model: Table,
          as: 'table'
        }
      ]
    });

    if (!tableOrder) {
      throw new Error('Table session not found');
    }

    // Update table session
    await tableOrder.update({
      status: 'cancelled',
      session_end_time: new Date(),
      branch_table_token_is_expired: true
    });

    // Mark table as available
    await tableOrder.table.update({ is_occupied: false });

    return await this.getTableSessionDetails(tableOrder.id);
  }

  /**
   * Get running table orders for a branch
   * @param {number} branchId - Branch ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Running table orders
   */
  async getRunningTableOrders(branchId, options = {}) {
    const { page = 1, limit = 20, tableId = null } = options;

    const whereClause = {
      branch_id: branchId,
      branch_table_token_is_expired: false,
      status: 'active'
    };

    if (tableId) {
      whereClause.table_id = tableId;
    }

    const tableOrders = await TableOrder.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Table,
          as: 'table',
          attributes: ['id', 'number', 'capacity', 'position']
        },
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
            }
          ]
        }
      ],
      order: [['session_start_time', 'DESC']],
      ...paginate(page, limit)
    });

    return {
      tableOrders: tableOrders.rows.map(tableOrder => ({
        ...tableOrder.toJSON(),
        sessionDuration: this.calculateSessionDuration(tableOrder.session_start_time),
        totalOrders: tableOrder.orders.length,
        totalAmount: tableOrder.orders.reduce((sum, order) => sum + parseFloat(order.order_amount), 0)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: tableOrders.count,
        totalPages: Math.ceil(tableOrders.count / limit)
      }
    };
  }

  /**
   * Get table session invoice
   * @param {number} tableOrderId - Table order ID
   * @returns {Promise<Object>} - Invoice data
   */
  async getTableSessionInvoice(tableOrderId) {
    const tableOrder = await TableOrder.findByPk(tableOrderId, {
      include: [
        {
          model: Table,
          as: 'table',
          include: [{
            model: Branch,
            as: 'branch'
          }]
        },
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: User,
              as: 'customer',
              attributes: ['id', 'f_name', 'l_name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!tableOrder) {
      throw new Error('Table session not found');
    }

    const totalAmount = tableOrder.orders.reduce((sum, order) => sum + parseFloat(order.order_amount), 0);
    const totalTax = tableOrder.orders.reduce((sum, order) => sum + parseFloat(order.total_tax_amount), 0);
    const totalDiscount = tableOrder.orders.reduce((sum, order) => sum + parseFloat(order.coupon_discount_amount), 0);

    return {
      ...tableOrder.toJSON(),
      invoice: {
        totalAmount,
        totalTax,
        totalDiscount,
        finalAmount: totalAmount + totalTax - totalDiscount,
        orderCount: tableOrder.orders.length,
        sessionDuration: this.calculateSessionDuration(tableOrder.session_start_time)
      }
    };
  }

  /**
   * Update table session notes
   * @param {number} tableOrderId - Table order ID
   * @param {string} notes - New notes
   * @returns {Promise<Object>} - Updated table order
   */
  async updateTableSessionNotes(tableOrderId, notes) {
    const tableOrder = await TableOrder.findByPk(tableOrderId);

    if (!tableOrder) {
      throw new Error('Table session not found');
    }

    await tableOrder.update({ notes });

    return await this.getTableSessionDetails(tableOrder.id);
  }

  /**
   * Generate unique table token
   * @returns {string} - Generated token
   */
  generateTableToken() {
    return uuidv4().replace(/-/g, '');
  }

  /**
   * Calculate session duration
   * @param {Date} startTime - Session start time
   * @returns {string} - Duration in human readable format
   */
  calculateSessionDuration(startTime) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(startTime)) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Clean up expired table sessions
   * @returns {Promise<number>} - Number of sessions cleaned up
   */
  async cleanupExpiredSessions() {
    const expiredSessions = await TableOrder.findAll({
      where: {
        branch_table_token_is_expired: false,
        status: 'active',
        session_start_time: {
          [Op.lt]: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
        }
      },
      include: [
        {
          model: Table,
          as: 'table'
        }
      ]
    });

    for (const session of expiredSessions) {
      await session.update({
        status: 'cancelled',
        session_end_time: new Date(),
        branch_table_token_is_expired: true
      });

      await session.table.update({ is_occupied: false });
    }

    return expiredSessions.length;
  }
}

module.exports = new TableBookingService(); 