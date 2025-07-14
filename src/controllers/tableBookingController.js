const TableBookingService = require('../services/TableBookingService');
const { asyncHandler } = require('../utils/asyncHandler');
const { formatResponse } = require('../utils/responseFormatter');
const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

class TableBookingController {
  
  /**
   * Get available tables for a branch
   * GET /api/v1/table-booking/tables/:branchId
   */
  getAvailableTables = asyncHandler(async (req, res) => {
    const { branchId } = req.params;
    const { page = 1, limit = 20, search = '', includeOccupied = false } = req.query;

    const result = await TableBookingService.getAvailableTables(branchId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      includeOccupied: includeOccupied === 'true'
    });

    res.json(formatResponse(
      true,
      'Tables retrieved successfully',
      result
    ));
  });

  /**
   * Create a new table booking session
   * POST /api/v1/table-booking/sessions
   */
  createTableSession = asyncHandler(async (req, res) => {
    const { table_id, branch_id, total_people, notes } = req.body;
    const created_by = req.user.id;

    const tableOrder = await TableBookingService.createTableSession({
      table_id,
      branch_id,
      created_by,
      total_people,
      notes
    });

    res.status(201).json(formatResponse(
      true,
      'Table session created successfully',
      tableOrder
    ));
  });

  /**
   * Get table session details
   * GET /api/v1/table-booking/sessions/:sessionId
   */
  getTableSessionDetails = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const tableOrder = await TableBookingService.getTableSessionDetails(sessionId);

    res.json(formatResponse(
      true,
      'Table session details retrieved successfully',
      tableOrder
    ));
  });

  /**
   * Place order for a table
   * POST /api/v1/table-booking/orders
   */
  placeTableOrder = asyncHandler(async (req, res) => {
    const { 
      table_token, 
      order_amount, 
      items, 
      payment_method, 
      payment_status,
      number_of_people,
      order_note,
      coupon_code,
      coupon_discount_amount,
      delivery_date,
      delivery_time 
    } = req.body;

    const order = await TableBookingService.placeTableOrder(table_token, {
      user_id: req.user.id,
      order_amount,
      items,
      payment_method,
      payment_status: payment_status || 'unpaid',
      number_of_people,
      order_note,
      coupon_code,
      coupon_discount_amount: coupon_discount_amount || 0,
      delivery_date,
      delivery_time,
      order_status: 'confirmed'
    });

    res.status(201).json(formatResponse(
      true,
      'Order placed successfully',
      order
    ));
  });

  /**
   * Get orders for a table by token
   * GET /api/v1/table-booking/orders/:tableToken
   */
  getTableOrders = asyncHandler(async (req, res) => {
    const { tableToken } = req.params;

    const orders = await TableBookingService.getTableOrders(tableToken);

    res.json(formatResponse(
      true,
      'Table orders retrieved successfully',
      orders
    ));
  });

  /**
   * Complete table session
   * PUT /api/v1/table-booking/sessions/:sessionId/complete
   */
  completeTableSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const tableOrder = await TableBookingService.completeTableSession(sessionId);

    res.json(formatResponse(
      true,
      'Table session completed successfully',
      tableOrder
    ));
  });

  /**
   * Cancel table session
   * PUT /api/v1/table-booking/sessions/:sessionId/cancel
   */
  cancelTableSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const tableOrder = await TableBookingService.cancelTableSession(sessionId);

    res.json(formatResponse(
      true,
      'Table session cancelled successfully',
      tableOrder
    ));
  });

  /**
   * Get running table orders for a branch
   * GET /api/v1/table-booking/running-orders/:branchId
   */
  getRunningTableOrders = asyncHandler(async (req, res) => {
    const { branchId } = req.params;
    const { page = 1, limit = 20, tableId } = req.query;

    const result = await TableBookingService.getRunningTableOrders(branchId, {
      page: parseInt(page),
      limit: parseInt(limit),
      tableId: tableId ? parseInt(tableId) : null
    });

    res.json(formatResponse(
      true,
      'Running table orders retrieved successfully',
      result
    ));
  });

  /**
   * Get table session invoice
   * GET /api/v1/table-booking/sessions/:sessionId/invoice
   */
  getTableSessionInvoice = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const invoice = await TableBookingService.getTableSessionInvoice(sessionId);

    res.json(formatResponse(
      true,
      'Table session invoice retrieved successfully',
      invoice
    ));
  });

  /**
   * Update table session notes
   * PUT /api/v1/table-booking/sessions/:sessionId/notes
   */
  updateTableSessionNotes = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { notes } = req.body;

    const tableOrder = await TableBookingService.updateTableSessionNotes(sessionId, notes);

    res.json(formatResponse(
      true,
      'Table session notes updated successfully',
      tableOrder
    ));
  });

  /**
   * Get table list by branch (for admin/staff)
   * GET /api/v1/table-booking/admin/tables/:branchId
   */
  getTableListByBranch = asyncHandler(async (req, res) => {
    const { branchId } = req.params;
    const { includeRunning = true } = req.query;

    const result = await TableBookingService.getAvailableTables(branchId, {
      includeOccupied: true,
      includeRunning: includeRunning === 'true'
    });

    res.json(formatResponse(
      true,
      'Tables retrieved successfully',
      result
    ));
  });

  /**
   * Generate QR code for table
   * GET /api/v1/table-booking/qr/:tableId
   */
  generateTableQR = asyncHandler(async (req, res) => {
    const { tableId } = req.params;
    const { branchId } = req.query;

    // Create a QR code data object
    const qrData = {
      type: 'table_order',
      table_id: tableId,
      branch_id: branchId,
      url: `${process.env.FRONTEND_URL}/table-order/${tableId}?branch=${branchId}`,
      generated_at: new Date().toISOString()
    };

    res.json(formatResponse(
      true,
      'Table QR code generated successfully',
      { qrData }
    ));
  });

  /**
   * Get table booking statistics
   * GET /api/v1/table-booking/stats/:branchId
   */
  getTableBookingStats = asyncHandler(async (req, res) => {
    const { branchId } = req.params;
    const { startDate, endDate } = req.query;

    // This would typically involve complex queries
    // For now, return basic structure
    const stats = {
      totalTables: 0,
      occupiedTables: 0,
      availableTables: 0,
      totalSessions: 0,
      activeSessionsCount: 0,
      completedSessionsCount: 0,
      cancelledSessionsCount: 0,
      averageSessionDuration: 0,
      totalRevenue: 0
    };

    res.json(formatResponse(
      true,
      'Table booking statistics retrieved successfully',
      stats
    ));
  });

  /**
   * Clean up expired table sessions
   * POST /api/v1/table-booking/cleanup
   */
  cleanupExpiredSessions = asyncHandler(async (req, res) => {
    const cleanedCount = await TableBookingService.cleanupExpiredSessions();

    res.json(formatResponse(
      true,
      'Expired sessions cleaned up successfully',
      { cleanedCount }
    ));
  });
}

// Validation middleware
const createTableSessionValidation = [
  body('table_id').isInt().withMessage('Table ID must be a valid integer'),
  body('branch_id').isInt().withMessage('Branch ID must be a valid integer'),
  body('total_people').optional().isInt({ min: 1, max: 20 }).withMessage('Total people must be between 1 and 20'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  handleValidationErrors
];

const placeTableOrderValidation = [
  body('table_token').isString().notEmpty().withMessage('Table token is required'),
  body('order_amount').isFloat({ min: 0 }).withMessage('Order amount must be a valid positive number'),
  body('items').isArray().withMessage('Items must be an array'),
  body('payment_method').isString().notEmpty().withMessage('Payment method is required'),
  body('payment_status').optional().isIn(['paid', 'unpaid']).withMessage('Payment status must be paid or unpaid'),
  body('number_of_people').optional().isInt({ min: 1 }).withMessage('Number of people must be at least 1'),
  handleValidationErrors
];

const updateNotesValidation = [
  body('notes').isString().withMessage('Notes must be a string'),
  handleValidationErrors
];

const paramValidation = [
  param('sessionId').isInt().withMessage('Session ID must be a valid integer'),
  param('branchId').isInt().withMessage('Branch ID must be a valid integer'),
  param('tableId').isInt().withMessage('Table ID must be a valid integer'),
  param('tableToken').isString().notEmpty().withMessage('Table token is required'),
  handleValidationErrors
];

module.exports = {
  TableBookingController: new TableBookingController(),
  createTableSessionValidation,
  placeTableOrderValidation,
  updateNotesValidation,
  paramValidation
}; 