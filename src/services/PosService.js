const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { PosSession, Table, Product, User, Order, OrderDetail, Category } = require('../models');
const { calculateTax, calculateDiscount, generateOrderNumber } = require('../utils/helpers');

class PosService {
  /**
   * Create a new POS session
   */
  async createSession(branchId, userId) {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Session expires in 24 hours

    const session = await PosSession.create({
      id: sessionId,
      branch_id: branchId,
      user_id: userId,
      cart_data: JSON.stringify([]),
      expires_at: expiresAt
    });

    return session;
  }

  /**
   * Get or create POS session
   */
  async getOrCreateSession(sessionId, branchId, userId) {
    let session = null;

    if (sessionId) {
      session = await PosSession.findOne({
        where: {
          id: sessionId,
          expires_at: { [Op.gt]: new Date() }
        },
        include: [
          { model: User, as: 'customer', attributes: ['id', 'f_name', 'l_name', 'phone'] },
          { model: Table, as: 'table', attributes: ['id', 'number', 'capacity'] }
        ]
      });
    }

    if (!session) {
      session = await this.createSession(branchId, userId);
    }

    return session;
  }

  /**
   * Get session cart data
   */
  async getCart(sessionId) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const cartData = JSON.parse(session.cart_data || '[]');
    return {
      items: cartData,
      tax_percentage: session.tax_percentage,
      discount_percentage: session.discount_percentage,
      discount_amount: session.discount_amount,
      subtotal: session.subtotal,
      total_amount: session.total_amount,
      customer: session.customer_id ? await User.findByPk(session.customer_id) : null,
      table: session.table_id ? await Table.findByPk(session.table_id) : null,
      order_type: session.order_type,
      notes: session.notes
    };
  }

  /**
   * Add item to cart
   */
  async addToCart(sessionId, productId, quantity = 1, variations = [], addOns = []) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const cartData = JSON.parse(session.cart_data || '[]');
    
    // Calculate item price with variations and add-ons
    let itemPrice = parseFloat(product.price);
    let variationText = '';
    let addOnTotal = 0;

    // Handle variations
    if (variations && variations.length > 0) {
      variations.forEach(variation => {
        if (variation.price) {
          itemPrice += parseFloat(variation.price);
        }
        variationText += `${variation.name}: ${variation.value}, `;
      });
      variationText = variationText.slice(0, -2); // Remove last comma
    }

    // Handle add-ons
    if (addOns && addOns.length > 0) {
      addOns.forEach(addOn => {
        addOnTotal += parseFloat(addOn.price || 0) * parseInt(addOn.quantity || 1);
      });
    }

    const totalItemPrice = (itemPrice + addOnTotal) * quantity;

    // Create cart item
    const cartItem = {
      id: `${productId}_${Date.now()}`,
      product_id: productId,
      name: product.name,
      price: itemPrice,
      quantity: parseInt(quantity),
      variations: variations || [],
      variation_text: variationText,
      add_ons: addOns || [],
      add_on_total: addOnTotal,
      total_price: totalItemPrice,
      image: product.image
    };

    // Check if same item already exists in cart
    const existingItemIndex = cartData.findIndex(item => 
      item.product_id === productId && 
      JSON.stringify(item.variations) === JSON.stringify(variations) &&
      JSON.stringify(item.add_ons) === JSON.stringify(addOns)
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      cartData[existingItemIndex].quantity += parseInt(quantity);
      cartData[existingItemIndex].total_price = 
        (cartData[existingItemIndex].price + cartData[existingItemIndex].add_on_total) * 
        cartData[existingItemIndex].quantity;
    } else {
      // Add new item
      cartData.push(cartItem);
    }

    // Update session
    await this.updateCartTotals(session, cartData);

    return cartItem;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(sessionId, itemId) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const cartData = JSON.parse(session.cart_data || '[]');
    const filteredCart = cartData.filter(item => item.id !== itemId);

    await this.updateCartTotals(session, filteredCart);

    return { success: true };
  }

  /**
   * Update item quantity in cart
   */
  async updateQuantity(sessionId, itemId, quantity) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const cartData = JSON.parse(session.cart_data || '[]');
    const itemIndex = cartData.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cartData.splice(itemIndex, 1);
    } else {
      // Update quantity and total price
      cartData[itemIndex].quantity = parseInt(quantity);
      cartData[itemIndex].total_price = 
        (cartData[itemIndex].price + cartData[itemIndex].add_on_total) * 
        cartData[itemIndex].quantity;
    }

    await this.updateCartTotals(session, cartData);

    return { success: true };
  }

  /**
   * Empty cart
   */
  async emptyCart(sessionId) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await this.updateCartTotals(session, []);

    return { success: true };
  }

  /**
   * Update tax percentage
   */
  async updateTax(sessionId, taxPercentage) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (taxPercentage < 0 || taxPercentage > 100) {
      throw new Error('Tax percentage must be between 0 and 100');
    }

    const cartData = JSON.parse(session.cart_data || '[]');
    session.tax_percentage = parseFloat(taxPercentage);

    await this.updateCartTotals(session, cartData);

    return { success: true };
  }

  /**
   * Update discount
   */
  async updateDiscount(sessionId, discountType, discountValue) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const cartData = JSON.parse(session.cart_data || '[]');

    if (discountType === 'percentage') {
      if (discountValue < 0 || discountValue > 100) {
        throw new Error('Discount percentage must be between 0 and 100');
      }
      session.discount_percentage = parseFloat(discountValue);
      session.discount_amount = 0;
    } else if (discountType === 'amount') {
      if (discountValue < 0) {
        throw new Error('Discount amount cannot be negative');
      }
      session.discount_amount = parseFloat(discountValue);
      session.discount_percentage = 0;
    }

    await this.updateCartTotals(session, cartData);

    return { success: true };
  }

  /**
   * Set customer for the session
   */
  async setCustomer(sessionId, customerId) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.customer_id = customerId;
    await session.save();

    return { success: true };
  }

  /**
   * Set table for the session
   */
  async setTable(sessionId, tableId) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if table is available
    if (tableId) {
      const table = await Table.findByPk(tableId);
      if (!table) {
        throw new Error('Table not found');
      }
      if (!table.is_active) {
        throw new Error('Table is not active');
      }
    }

    session.table_id = tableId;
    session.order_type = tableId ? 'dine_in' : 'take_away';
    await session.save();

    return { success: true };
  }

  /**
   * Set order type
   */
  async setOrderType(sessionId, orderType) {
    const session = await PosSession.findByPk(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const validTypes = ['take_away', 'dine_in', 'delivery'];
    if (!validTypes.includes(orderType)) {
      throw new Error('Invalid order type');
    }

    session.order_type = orderType;
    await session.save();

    return { success: true };
  }

  /**
   * Update cart totals and save session
   */
  async updateCartTotals(session, cartData) {
    // Calculate subtotal
    const subtotal = cartData.reduce((sum, item) => sum + item.total_price, 0);

    // Calculate tax
    const taxAmount = calculateTax(subtotal, session.tax_percentage);

    // Calculate discount
    let discountAmount = 0;
    if (session.discount_percentage > 0) {
      discountAmount = calculateDiscount(subtotal, 'percentage', session.discount_percentage);
    } else if (session.discount_amount > 0) {
      discountAmount = Math.min(session.discount_amount, subtotal);
    }

    // Calculate final total
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Update session
    session.cart_data = JSON.stringify(cartData);
    session.subtotal = subtotal;
    session.total_amount = Math.max(0, totalAmount); // Ensure total is not negative

    await session.save();

    return {
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: session.total_amount
    };
  }

  /**
   * Place order from POS session
   */
  async placeOrder(sessionId, paymentMethod = 'cash') {
    const session = await PosSession.findOne({
      where: { id: sessionId },
      include: [
        { model: User, as: 'customer' },
        { model: Table, as: 'table' }
      ]
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const cartData = JSON.parse(session.cart_data || '[]');
    if (cartData.length === 0) {
      throw new Error('Cart is empty');
    }

    // Create order
    const orderData = {
      id: generateOrderNumber(),
      user_id: session.customer_id,
      order_amount: session.total_amount,
      payment_status: paymentMethod === 'cash' ? 'paid' : 'pending',
      order_status: 'confirmed',
      payment_method: paymentMethod,
      order_type: session.order_type,
      branch_id: session.branch_id,
      table_id: session.table_id,
      order_note: session.notes,
      coupon_discount_amount: session.discount_amount,
      coupon_discount_title: session.discount_percentage > 0 ? `${session.discount_percentage}% Discount` : null,
      delivery_address_id: null,
      delivery_charge: 0.00,
      is_pos: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const order = await Order.create(orderData);

    // Create order details
    for (const item of cartData) {
      await OrderDetail.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total_amount: item.total_price,
        variation: JSON.stringify(item.variations),
        add_on_ids: JSON.stringify(item.add_ons.map(addon => addon.id)),
        add_on_qtys: JSON.stringify(item.add_ons.map(addon => addon.quantity)),
        add_on_prices: JSON.stringify(item.add_ons.map(addon => addon.price)),
        add_on_taxes: JSON.stringify(item.add_ons.map(() => 0)),
        add_on_tax_amount: 0,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // Mark table as occupied if dine-in order
    if (session.table_id && session.order_type === 'dine_in') {
      await Table.update(
        { is_occupied: true },
        { where: { id: session.table_id } }
      );
    }

    // Clear session
    await this.emptyCart(sessionId);

    return {
      order,
      order_details: cartData,
      total_amount: session.total_amount
    };
  }

  /**
   * Get tables by branch
   */
  async getTablesByBranch(branchId) {
    return await Table.findAll({
      where: {
        branch_id: branchId,
        is_active: true
      },
      order: [['number', 'ASC']]
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    await PosSession.destroy({
      where: {
        expires_at: { [Op.lt]: new Date() }
      }
    });
  }
}

module.exports = new PosService(); 