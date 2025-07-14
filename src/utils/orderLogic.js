/**
 * Order Logic Utilities
 * Converted from PHP CentralLogics/order.php to JavaScript
 */

const { Op } = require('sequelize');
const { 
  User, Order, OrderDetail, Product, Category, Coupon, 
  CustomerAddress, Branch, DeliveryCharge, BusinessSetting, 
  Notification, FcmNotification, Review, WishlistItem, 
  CartItem, OrderStatus, Track, Zone, DeliveryManWallet, 
  CustomerWallet, RestaurantWallet, LoyaltyPoint, Attribute, 
  AddOn, ItemCampaign, ConversationReply, NotificationReceiver, 
  CouponCustomer, BannerProduct, OfflineMethod, RestaurantSchedule, 
  RestaurantCoverageArea, DigitalPayment, GuestUser, FavoriteProduct, 
  OrderTransaction, DeliveryHistoryLog, RefundRequest, WithdrawRequest, 
  VendorEmployee, AccountingPayment, AccountingWithdraw, AccountingCategory, 
  AccountingTransaction, AccountingEarning, AccountingExpense, 
  AccountingLiability, AccountingReport, AccountingDashboard, 
  AccountingBalance, AccountingProfit, AccountingRevenueReport, 
  AccountingExpenseReport, AccountingIncomeReport, AccountingLossReport, 
  AccountingAnalytics, AccountingEntry, AccountingJournal, 
  AccountingLedger, AccountingTrialBalance, AccountingCashFlow, 
  AccountingBalanceSheet, AccountingProfitLoss, AccountingTax
} = require('../models');

const { 
  ORDER_STATUS, DELIVERY_STATUS, PAYMENT_METHOD, 
  NOTIFICATION_TYPE, BUSINESS_SETTINGS, CURRENCY_POSITION, 
  MAIL_CONFIG, IMAGE_PATH, STORAGE_TYPE, PAGINATION, 
  DELIVERY_TYPE, ORDER_TYPE, DISCOUNT_TYPE, COUPON_TYPE, 
  CUSTOMER_TYPE, DELIVERY_MAN_TYPE, ADMIN_TYPE, BRANCH_TYPE, 
  PRODUCT_TYPE, CATEGORY_TYPE, ADDON_TYPE, ATTRIBUTE_TYPE, 
  ZONE_TYPE, DELIVERY_CHARGE_TYPE, BUSINESS_SETTING_TYPE, 
  NOTIFICATION_SENDER_TYPE, NOTIFICATION_RECEIVER_TYPE, 
  REVIEW_TYPE, WISHLIST_TYPE, CART_TYPE, ORDER_DETAIL_TYPE, 
  TRACK_TYPE, LOYALTY_POINT_TYPE, WALLET_TYPE, CAMPAIGN_TYPE, 
  CONVERSATION_TYPE, COUPON_CUSTOMER_TYPE, BANNER_PRODUCT_TYPE, 
  OFFLINE_METHOD_TYPE, RESTAURANT_SCHEDULE_TYPE, RESTAURANT_COVERAGE_AREA_TYPE, 
  DIGITAL_PAYMENT_TYPE, GUEST_USER_TYPE, FAVORITE_PRODUCT_TYPE, 
  ORDER_TRANSACTION_TYPE, DELIVERY_HISTORY_LOG_TYPE, REFUND_REQUEST_TYPE, 
  WITHDRAW_REQUEST_TYPE, VENDOR_EMPLOYEE_TYPE, ACCOUNTING_PAYMENT_TYPE, 
  ACCOUNTING_WITHDRAW_TYPE, ACCOUNTING_CATEGORY_TYPE, ACCOUNTING_TRANSACTION_TYPE, 
  ACCOUNTING_EARNING_TYPE, ACCOUNTING_EXPENSE_TYPE, ACCOUNTING_LIABILITY_TYPE, 
  ACCOUNTING_REPORT_TYPE, ACCOUNTING_DASHBOARD_TYPE, ACCOUNTING_BALANCE_TYPE, 
  ACCOUNTING_PROFIT_TYPE, ACCOUNTING_REVENUE_REPORT_TYPE, ACCOUNTING_EXPENSE_REPORT_TYPE, 
  ACCOUNTING_INCOME_REPORT_TYPE, ACCOUNTING_LOSS_REPORT_TYPE, ACCOUNTING_ANALYTICS_TYPE, 
  ACCOUNTING_ENTRY_TYPE, ACCOUNTING_JOURNAL_TYPE, ACCOUNTING_LEDGER_TYPE, 
  ACCOUNTING_TRIAL_BALANCE_TYPE, ACCOUNTING_CASH_FLOW_TYPE, ACCOUNTING_BALANCE_SHEET_TYPE, 
  ACCOUNTING_PROFIT_LOSS_TYPE, ACCOUNTING_TAX_TYPE
} = require('./constants');

const { 
  calculateDistance, calculateDeliveryCharge, formatCurrency, 
  generateOrderNumber, generateInvoiceNumber, validateEmail, 
  validatePhoneNumber, sanitizeInput, generateSlug, sendNotification, 
  sendFCMNotification, calculateTax, calculateDiscount, 
  applyCouponDiscount, getCustomerAddresses, getCustomerDefaultAddress, 
  calculateOrderTotal, getOrderStatusText, canCancelOrder, 
  isOrderDelivered, addProductRating, addDeliveryManRating, 
  getTranslations, translate, getDistanceBetweenCoordinates, 
  isWithinDeliveryRadius, generateOTP, validateOTP, getPaginationInfo, 
  formatPaginationResponse
} = require('./helpers');

/**
 * Track order by ID
 * @param {number} orderId - Order ID
 * @returns {Promise<Object|null>} Order tracking information
 */
const trackOrder = async (orderId) => {
    try {
        const order = await Order.findOne({
            where: { id: orderId },
            include: [
                {
                    model: OrderDetail,
                    as: 'details',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['id', 'name', 'image', 'status']
                        }
                    ]
                },
                {
                    model: CustomerAddress,
                    as: 'delivery_address',
                    attributes: ['id', 'address', 'latitude', 'longitude', 'contact_person_name', 'contact_person_number']
                },
                {
                    model: User,
                    as: 'delivery_man',
                    attributes: ['id', 'f_name', 'l_name', 'phone', 'image'],
                    include: [
                        {
                            model: Review,
                            as: 'rating',
                            attributes: ['rating']
                        }
                    ]
                },
                {
                    model: OrderTransaction,
                    as: 'order_transactions',
                    attributes: ['id', 'paid_amount', 'paid_with', 'paid_at', 'transaction_reference']
                },
                {
                    model: Branch,
                    as: 'branch',
                    attributes: ['id', 'name', 'address', 'phone', 'email', 'latitude', 'longitude']
                },
                {
                    model: OfflineMethod,
                    as: 'offline_payment',
                    attributes: ['id', 'payment_info', 'status']
                }
            ]
        });
        
        if (!order) {
            return null;
        }
        
        // Check if products are still available
        const orderDetails = await OrderDetail.findOne({
            where: { order_id: order.id }
        });
        
        let isProductAvailable = 0;
        if (orderDetails && orderDetails.product_id) {
            const product = await Product.findByPk(orderDetails.product_id);
            isProductAvailable = product ? 1 : 0;
        }
        
        const orderData = order.toJSON();
        orderData.is_product_available = isProductAvailable;
        
        // Parse offline payment information
        if (orderData.offline_payment) {
            try {
                orderData.offline_payment_information = JSON.parse(orderData.offline_payment.payment_info || '{}');
            } catch (error) {
                orderData.offline_payment_information = null;
            }
        } else {
            orderData.offline_payment_information = null;
        }
        
        return orderDataFormatting(orderData, false);
    } catch (error) {
        console.error('Error tracking order:', error);
        return null;
    }
};

/**
 * Place a new order
 * @param {number} customerId - Customer ID
 * @param {string} email - Customer email
 * @param {Object} customerInfo - Customer information
 * @param {Array} cart - Cart items
 * @param {string} paymentMethod - Payment method
 * @param {number} discount - Discount amount
 * @param {string} couponCode - Coupon code (optional)
 * @param {Object} additionalData - Additional order data
 * @returns {Promise<Object>} Order placement result
 */
const placeOrder = async (customerId, email, customerInfo, cart, paymentMethod, discount = 0, couponCode = null, additionalData = {}) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Generate order number
        const orderNumber = generateOrderNumber();
        
        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        const totalDiscount = discount || 0;
        let addonTotal = 0;
        
        // Calculate cart totals
        for (const item of cart) {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 1;
            const itemTotal = itemPrice * itemQuantity;
            
            subtotal += itemTotal;
            
            // Add addon prices
            if (item.addons && Array.isArray(item.addons)) {
                for (const addon of item.addons) {
                    const addonPrice = parseFloat(addon.price) || 0;
                    const addonQuantity = parseInt(addon.quantity) || 1;
                    addonTotal += addonPrice * addonQuantity * itemQuantity;
                }
            }
            
            // Calculate tax
            if (item.tax) {
                totalTax += calculateTax(itemTotal, item.tax);
            }
        }
        
        // Calculate delivery charge
        const deliveryCharge = await calculateDeliveryCharge(
            additionalData.distance || 0,
            additionalData.zone_id || null
        );
        
        // Calculate grand total
        const grandTotal = subtotal + addonTotal + totalTax + deliveryCharge - totalDiscount;
        
        // Create order
        const orderData = {
            order_number: orderNumber,
            customer_id: customerId,
            order_amount: grandTotal,
            payment_method: paymentMethod,
            order_status: ORDER_STATUS.PENDING,
            payment_status: 'pending',
            discount_amount: totalDiscount,
            discount_type: additionalData.discount_type || 'amount',
            coupon_code: couponCode,
            delivery_charge: deliveryCharge,
            order_type: additionalData.order_type || 'delivery',
            branch_id: additionalData.branch_id || null,
            delivery_address_id: additionalData.delivery_address_id || null,
            delivery_date: additionalData.delivery_date || null,
            delivery_time: additionalData.delivery_time || null,
            order_note: additionalData.order_note || null,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const order = await Order.create(orderData, { transaction });
        
        // Create order details
        for (const item of cart) {
            const detailData = {
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
                discount_on_product: item.discount || 0,
                discount_type: item.discount_type || 'amount',
                variant: JSON.stringify(item.variant || []),
                variation: JSON.stringify(item.variation || []),
                add_on_ids: JSON.stringify(item.addon_ids || []),
                add_on_qtys: JSON.stringify(item.addon_qtys || []),
                add_on_prices: JSON.stringify(item.addon_prices || []),
                add_on_taxes: JSON.stringify(item.addon_taxes || []),
                product_details: JSON.stringify(item.product_details || {}),
                created_at: new Date(),
                updated_at: new Date()
            };
            
            await OrderDetail.create(detailData, { transaction });
        }
        
        // Process coupon usage
        if (couponCode) {
            await CouponCustomer.create({
                coupon_id: additionalData.coupon_id,
                customer_id: customerId,
                order_id: order.id,
                used_at: new Date()
            }, { transaction });
        }
        
        // Create order transaction
        const transactionData = {
            order_id: order.id,
            payment_method: paymentMethod,
            reference: additionalData.payment_reference || null,
            amount: grandTotal,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
        };
        
        await OrderTransaction.create(transactionData, { transaction });
        
        // Send notifications
        await sendNotification(
            customerId,
            'Order Placed',
            `Your order #${orderNumber} has been placed successfully.`,
            'order_placed',
            { order_id: order.id, order_number: orderNumber }
        );
        
        await transaction.commit();
        
        return {
            success: true,
            orderId: order.id,
            orderNumber,
            grandTotal,
            totalDiscount
        };
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error placing order:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @param {number} userId - User ID making the change
 * @param {string} notes - Status change notes
 * @returns {Promise<Object>} Update result
 */
const updateOrderStatus = async (orderId, status, userId, notes = '') => {
    try {
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return {
                success: false,
                message: 'Order not found'
            };
        }
        
        // Validate status transition
        if (!isValidStatusTransition(order.order_status, status)) {
            return {
                success: false,
                message: 'Invalid status transition'
            };
        }
        
        // Update order status
        await order.update({
            order_status: status,
            updated_at: new Date()
        });
        
        // Log status change
        await logOrderStatusChange(orderId, order.order_status, status, userId, notes);
        
        return {
            success: true,
            message: 'Order status updated successfully',
            order_id: orderId,
            new_status: status
        };
    } catch (error) {
        console.error('Error updating order status:', error);
        return {
            success: false,
            message: 'Failed to update order status',
            error: error.message
        };
    }
};

/**
 * Assign delivery man to order
 * @param {number} orderId - Order ID
 * @param {number} deliveryManId - Delivery man ID
 * @returns {Promise<Object>} Assignment result
 */
const assignDeliveryMan = async (orderId, deliveryManId) => {
    try {
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            return {
                success: false,
                message: 'Order not found'
            };
        }
        
        const deliveryMan = await User.findOne({
            where: { 
                id: deliveryManId,
                user_type: 'delivery_man'
            }
        });
        
        if (!deliveryMan) {
            return {
                success: false,
                message: 'Delivery man not found'
            };
        }
        
        await order.update({
            delivery_man_id: deliveryManId,
            updated_at: new Date()
        });
        
        return {
            success: true,
            message: 'Delivery man assigned successfully',
            order_id: orderId,
            delivery_man_id: deliveryManId
        };
    } catch (error) {
        console.error('Error assigning delivery man:', error);
        return {
            success: false,
            message: 'Failed to assign delivery man',
            error: error.message
        };
    }
};

/**
 * Get orders by status
 * @param {string} status - Order status
 * @param {number} limit - Number of orders to return
 * @param {number} offset - Page offset
 * @returns {Promise<Object>} Orders result
 */
const getOrdersByStatus = async (status, limit = 10, offset = 1) => {
    try {
        const { count, rows } = await Order.findAndCountAll({
            where: { order_status: status },
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['id', 'f_name', 'l_name', 'phone', 'email']
                },
                {
                    model: User,
                    as: 'delivery_man',
                    attributes: ['id', 'f_name', 'l_name', 'phone'],
                    required: false
                },
                {
                    model: Branch,
                    as: 'branch',
                    attributes: ['id', 'name', 'address']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: limit || 10,
            offset: ((offset || 1) - 1) * (limit || 10)
        });
        
        return {
            total_size: count,
            limit: limit || 10,
            offset: offset || 1,
            orders: rows.map(order => order.toJSON())
        };
    } catch (error) {
        console.error('Error getting orders by status:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            orders: []
        };
    }
};

/**
 * Cancel order
 * @param {number} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @param {number} userId - User ID cancelling the order
 * @returns {Promise<Object>} Cancellation result
 */
const cancelOrder = async (orderId, reason, userId) => {
    const transaction = await sequelize.transaction();
    
    try {
        const order = await Order.findByPk(orderId);
        
        if (!order) {
            await transaction.rollback();
            return {
                success: false,
                message: 'Order not found'
            };
        }
        
        // Check if order can be cancelled
        if (!canOrderBeCancelled(order.order_status)) {
            await transaction.rollback();
            return {
                success: false,
                message: 'Order cannot be cancelled at this stage'
            };
        }
        
        // Update order status to cancelled
        await order.update({
            order_status: ORDER_STATUS.CANCELLED,
            cancellation_reason: reason,
            cancelled_by: userId,
            cancelled_at: new Date(),
            updated_at: new Date()
        }, { transaction });
        
        // Process refund if payment was completed
        if (order.payment_status === PAYMENT_STATUS.COMPLETED) {
            if (order.payment_method === PAYMENT_METHODS.WALLET) {
                // Refund to wallet
                const customer = await User.findByPk(order.customer_id);
                if (customer) {
                    await customer.update({
                        wallet_balance: customer.wallet_balance + order.order_amount
                    }, { transaction });
                }
            } else {
                // Mark for manual refund processing
                await order.update({
                    payment_status: PAYMENT_STATUS.REFUNDED,
                    refund_amount: order.order_amount,
                    refund_reason: reason,
                    refund_requested_at: new Date()
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        return {
            success: true,
            message: 'Order cancelled successfully',
            order_id: orderId,
            refund_amount: order.payment_status === PAYMENT_STATUS.COMPLETED ? order.order_amount : 0
        };
    } catch (error) {
        await transaction.rollback();
        console.error('Error cancelling order:', error);
        return {
            success: false,
            message: 'Failed to cancel order',
            error: error.message
        };
    }
};

/**
 * Get order statistics
 * @param {number} customerId - Customer ID (optional)
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Promise<Object>} Order statistics
 */
const getOrderStatistics = async (customerId = null, startDate = null, endDate = null) => {
    try {
        const whereConditions = {};
        
        if (customerId) {
            whereConditions.customer_id = customerId;
        }
        
        if (startDate && endDate) {
            whereConditions.created_at = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const [totalOrders, completedOrders, cancelledOrders, pendingOrders] = await Promise.all([
            Order.count({ where: whereConditions }),
            Order.count({ where: { ...whereConditions, order_status: ORDER_STATUS.DELIVERED } }),
            Order.count({ where: { ...whereConditions, order_status: ORDER_STATUS.CANCELLED } }),
            Order.count({ where: { ...whereConditions, order_status: ORDER_STATUS.PENDING } })
        ]);
        
        const totalRevenue = await Order.sum('order_amount', {
            where: { ...whereConditions, order_status: ORDER_STATUS.DELIVERED }
        });
        
        return {
            total_orders: totalOrders,
            completed_orders: completedOrders,
            cancelled_orders: cancelledOrders,
            pending_orders: pendingOrders,
            total_revenue: totalRevenue || 0,
            completion_rate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0,
            cancellation_rate: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(2) : 0
        };
    } catch (error) {
        console.error('Error getting order statistics:', error);
        return {
            total_orders: 0,
            completed_orders: 0,
            cancelled_orders: 0,
            pending_orders: 0,
            total_revenue: 0,
            completion_rate: 0,
            cancellation_rate: 0
        };
    }
};

/**
 * Helper function to validate status transitions
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - New order status
 * @returns {boolean} Is valid transition
 */
const isValidStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED],
        [ORDER_STATUS.PICKED_UP]: [ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.RETURNED],
        [ORDER_STATUS.ON_THE_WAY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.RETURNED],
        [ORDER_STATUS.DELIVERED]: [], // No further transitions
        [ORDER_STATUS.CANCELLED]: [], // No further transitions
        [ORDER_STATUS.RETURNED]: [] // No further transitions
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Helper function to check if order can be cancelled
 * @param {string} status - Order status
 * @returns {boolean} Can be cancelled
 */
const canOrderBeCancelled = (status) => {
    const cancellableStatuses = [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.PREPARING
    ];
    
    return cancellableStatuses.includes(status);
};

/**
 * Helper function to log order status changes
 * @param {number} orderId - Order ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {number} userId - User ID making the change
 * @param {string} notes - Change notes
 */
const logOrderStatusChange = async (orderId, oldStatus, newStatus, userId, notes) => {
    try {
        // Implementation would log to an order_status_logs table
        // For now, just log to console
        console.log(`Order ${orderId} status changed from ${oldStatus} to ${newStatus} by user ${userId}. Notes: ${notes}`);
    } catch (error) {
        console.error('Error logging order status change:', error);
    }
};

module.exports = {
    trackOrder,
    placeOrder,
    updateOrderStatus,
    assignDeliveryMan,
    getOrdersByStatus,
    cancelOrder,
    getOrderStatistics,
    isValidStatusTransition,
    canOrderBeCancelled
}; 