const { Product, Category, User, Table, Branch, Order } = require('../models');
const PosService = require('../services/PosService');
const { generateSuccessResponse, generateErrorResponse } = require('../utils/responses');
const { translateWithRequest } = require('../utils/translation');
const { Op } = require('sequelize');

/**
 * POS Dashboard - Get products, categories, and initial data
 */
const dashboard = async (req, res) => {
  try {
    const branchId = req.body.branch_id || req.user?.branch_id || 1;
    const categoryId = req.query.category_id || 0;
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get categories
    const categories = await Category.findAll({
      where: { 
        parent_id: null,
        status: true 
      },
      order: [['position', 'ASC'], ['name', 'ASC']]
    });

    // Build product query
    const productWhere = { status: 1 };
    
    if (categoryId && categoryId !== '0') {
      productWhere.category_ids = {
        [Op.like]: `%"id":"${categoryId}"%`
      };
    }

    if (keyword) {
      const keywords = keyword.split(' ');
      productWhere[Op.or] = keywords.map(word => ({
        name: { [Op.iLike]: `%${word}%` }
      }));
    }

    // Get products
    const products = await Product.findAndCountAll({
      where: productWhere,
      limit,
      offset,
      order: [['popularity_count', 'DESC'], ['name', 'ASC']],
      attributes: [
        'id', 'name', 'description', 'image', 'price', 
        'discount', 'discount_type', 'variations', 'add_ons',
        'tax', 'tax_type', 'status', 'is_recommended'
      ]
    });

    // Get tables for selected branch
    const tables = await PosService.getTablesByBranch(branchId);

    // Get session data if session_id is provided
    let sessionData = null;
    if (req.query.session_id) {
      try {
        sessionData = await PosService.getCart(req.query.session_id);
      } catch (error) {
        // Session might be expired or invalid, ignore error
      }
    }

    return generateSuccessResponse(res, {
      categories,
      products: {
        data: products.rows,
        total: products.count,
        page,
        limit,
        totalPages: Math.ceil(products.count / limit)
      },
      tables,
      session: sessionData,
      branch_id: branchId
    }, translateWithRequest(req, 'messages.data_retrieved'));

  } catch (error) {
    console.error('POS dashboard error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Create or get POS session
 */
const createSession = async (req, res) => {
  try {
    const branchId = req.body.branch_id || req.user?.branch_id || 1;
    const userId = req.user?.id;
    const sessionId = req.body.session_id;

    const session = await PosService.getOrCreateSession(sessionId, branchId, userId);

    return generateSuccessResponse(res, {
      session_id: session.id,
      branch_id: session.branch_id,
      expires_at: session.expires_at
    }, translateWithRequest(req, 'messages.session_created'));

  } catch (error) {
    console.error('Create POS session error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Get product details for quick view
 */
const quickView = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findByPk(productId, {
      attributes: [
        'id', 'name', 'description', 'image', 'price',
        'discount', 'discount_type', 'variations', 'add_ons',
        'tax', 'tax_type', 'choice_options', 'attributes'
      ]
    });

    if (!product) {
      return generateErrorResponse(res, 404, translateWithRequest(req, 'messages.product_not_found'));
    }

    return generateSuccessResponse(res, { product }, translateWithRequest(req, 'messages.data_retrieved'));

  } catch (error) {
    console.error('Product quick view error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Add item to cart
 */
const addToCart = async (req, res) => {
  try {
    const { session_id, product_id, quantity = 1, variations = [], add_ons = [] } = req.body;

    if (!session_id || !product_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_product_required'));
    }

    const cartItem = await PosService.addToCart(session_id, product_id, quantity, variations, add_ons);

    return generateSuccessResponse(res, { cart_item: cartItem }, translateWithRequest(req, 'messages.item_added_to_cart'));

  } catch (error) {
    console.error('Add to cart error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : error.message === 'Product not found'
      ? translateWithRequest(req, 'messages.product_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Remove item from cart
 */
const removeFromCart = async (req, res) => {
  try {
    const { session_id, item_id } = req.body;

    if (!session_id || !item_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_item_required'));
    }

    await PosService.removeFromCart(session_id, item_id);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.item_removed_from_cart'));

  } catch (error) {
    console.error('Remove from cart error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Update item quantity in cart
 */
const updateQuantity = async (req, res) => {
  try {
    const { session_id, item_id, quantity } = req.body;

    if (!session_id || !item_id || quantity === undefined) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_item_quantity_required'));
    }

    await PosService.updateQuantity(session_id, item_id, quantity);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.quantity_updated'));

  } catch (error) {
    console.error('Update quantity error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : error.message === 'Item not found in cart'
      ? translateWithRequest(req, 'messages.item_not_found_in_cart')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Get cart items
 */
const getCart = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    const cartData = await PosService.getCart(sessionId);

    return generateSuccessResponse(res, cartData, translateWithRequest(req, 'messages.data_retrieved'));

  } catch (error) {
    console.error('Get cart error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Empty cart
 */
const emptyCart = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_required'));
    }

    await PosService.emptyCart(session_id);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.cart_emptied'));

  } catch (error) {
    console.error('Empty cart error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Update tax
 */
const updateTax = async (req, res) => {
  try {
    const { session_id, tax_percentage } = req.body;

    if (!session_id || tax_percentage === undefined) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_tax_required'));
    }

    await PosService.updateTax(session_id, tax_percentage);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.tax_updated'));

  } catch (error) {
    console.error('Update tax error:', error);
    const message = error.message.includes('Tax percentage') 
      ? translateWithRequest(req, 'messages.invalid_tax_percentage')
      : error.message === 'Session not found'
      ? translateWithRequest(req, 'messages.session_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Update discount
 */
const updateDiscount = async (req, res) => {
  try {
    const { session_id, discount_type, discount_value } = req.body;

    if (!session_id || !discount_type || discount_value === undefined) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_discount_required'));
    }

    await PosService.updateDiscount(session_id, discount_type, discount_value);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.discount_updated'));

  } catch (error) {
    console.error('Update discount error:', error);
    const message = error.message.includes('Discount') 
      ? translateWithRequest(req, 'messages.invalid_discount_value')
      : error.message === 'Session not found'
      ? translateWithRequest(req, 'messages.session_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Search customers
 */
const searchCustomers = async (req, res) => {
  try {
    const keyword = req.query.q || '';
    
    if (!keyword || keyword.length < 2) {
      return generateSuccessResponse(res, [
        { id: null, text: translateWithRequest(req, 'messages.walk_in_customer') }
      ], translateWithRequest(req, 'messages.data_retrieved'));
    }

    const keywords = keyword.split(' ');
    const customers = await User.findAll({
      where: {
        [Op.and]: [
          { user_type: { [Op.or]: [null, 'customer'] } },
          {
            [Op.or]: keywords.map(word => ({
              [Op.or]: [
                { f_name: { [Op.iLike]: `%${word}%` } },
                { l_name: { [Op.iLike]: `%${word}%` } },
                { phone: { [Op.iLike]: `%${word}%` } }
              ]
            }))
          }
        ]
      },
      attributes: ['id', 'f_name', 'l_name', 'phone'],
      limit: 8
    });

    const customerOptions = customers.map(customer => ({
      id: customer.id,
      text: `${customer.f_name} ${customer.l_name} (${customer.phone})`
    }));

    // Add walk-in customer option
    customerOptions.push({
      id: null,
      text: translateWithRequest(req, 'messages.walk_in_customer')
    });

    return generateSuccessResponse(res, customerOptions, translateWithRequest(req, 'messages.data_retrieved'));

  } catch (error) {
    console.error('Search customers error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Set customer for session
 */
const setCustomer = async (req, res) => {
  try {
    const { session_id, customer_id } = req.body;

    if (!session_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_required'));
    }

    await PosService.setCustomer(session_id, customer_id);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.customer_set'));

  } catch (error) {
    console.error('Set customer error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Set table for session
 */
const setTable = async (req, res) => {
  try {
    const { session_id, table_id } = req.body;

    if (!session_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_required'));
    }

    await PosService.setTable(session_id, table_id);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.table_set'));

  } catch (error) {
    console.error('Set table error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : error.message === 'Table not found'
      ? translateWithRequest(req, 'messages.table_not_found')
      : error.message === 'Table is not active'
      ? translateWithRequest(req, 'messages.table_not_active')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Set order type for session
 */
const setOrderType = async (req, res) => {
  try {
    const { session_id, order_type } = req.body;

    if (!session_id || !order_type) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_order_type_required'));
    }

    await PosService.setOrderType(session_id, order_type);

    return generateSuccessResponse(res, { success: true }, translateWithRequest(req, 'messages.order_type_set'));

  } catch (error) {
    console.error('Set order type error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : error.message === 'Invalid order type'
      ? translateWithRequest(req, 'messages.invalid_order_type')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Get tables by branch
 */
const getTablesByBranch = async (req, res) => {
  try {
    const branchId = req.params.branchId || req.body.branch_id;

    if (!branchId) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.branch_id_required'));
    }

    const tables = await PosService.getTablesByBranch(branchId);

    return generateSuccessResponse(res, { tables }, translateWithRequest(req, 'messages.data_retrieved'));

  } catch (error) {
    console.error('Get tables error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

/**
 * Place order from POS
 */
const placeOrder = async (req, res) => {
  try {
    const { session_id, payment_method = 'cash' } = req.body;

    if (!session_id) {
      return generateErrorResponse(res, 400, translateWithRequest(req, 'messages.session_required'));
    }

    const orderResult = await PosService.placeOrder(session_id, payment_method);

    return generateSuccessResponse(res, orderResult, translateWithRequest(req, 'messages.order_placed_successfully'));

  } catch (error) {
    console.error('Place order error:', error);
    const message = error.message === 'Session not found' 
      ? translateWithRequest(req, 'messages.session_not_found')
      : error.message === 'Cart is empty'
      ? translateWithRequest(req, 'messages.cart_is_empty')
      : translateWithRequest(req, 'messages.server_error');
    return generateErrorResponse(res, 400, message);
  }
};

/**
 * Get POS orders
 */
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const branchId = req.query.branch_id || req.user?.branch_id;

    const whereClause = { is_pos: true };
    
    if (status) {
      whereClause.order_status = status;
    }
    
    if (branchId) {
      whereClause.branch_id = branchId;
    }

    const orders = await Order.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['id', 'f_name', 'l_name', 'phone'],
          required: false
        },
        {
          model: Table,
          as: 'table',
          attributes: ['id', 'number'],
          required: false
        }
      ]
    });

    return generateSuccessResponse(res, {
      orders: orders.rows,
      total: orders.count,
      page,
      limit,
      totalPages: Math.ceil(orders.count / limit)
    }, translateWithRequest(req, 'messages.data_retrieved'));

  } catch (error) {
    console.error('Get POS orders error:', error);
    return generateErrorResponse(res, 500, translateWithRequest(req, 'messages.server_error'));
  }
};

module.exports = {
  dashboard,
  createSession,
  quickView,
  addToCart,
  removeFromCart,
  updateQuantity,
  getCart,
  emptyCart,
  updateTax,
  updateDiscount,
  searchCustomers,
  setCustomer,
  setTable,
  setOrderType,
  getTablesByBranch,
  placeOrder,
  getOrders
}; 