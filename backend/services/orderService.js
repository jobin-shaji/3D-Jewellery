const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const CartService = require('./cartService');

class OrderService {
  /**
   * Create a new order from cart data
   * @param {string} userId - User ID
   * @param {Object} orderData - Order data from checkout
   * @returns {Object} - Created order
   */
  static async createOrder(userId, orderData) {
    try {
      const {
        address,
        paymentMethod,
        paymentDetails,
        notes,
        items,
        subtotal,
        tax,
        shipping,
        total
      } = orderData;

      // Validate user exists
      const user = await User.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.role === 'admin') {
        throw new Error('Admins cannot place orders');
      }

      // Validate cart items exist and are still available
      const validatedItems = await this.validateOrderItems(items);
      if (validatedItems.length === 0) {
        throw new Error('No valid items found in order');
      }

      // Create order items with product snapshots
      const orderItems = await this.createOrderItemsWithSnapshots(validatedItems);

      // Create the order
      const order = new Order({
        userId,
        shippingAddress: {
          name: address.name || `${address.firstName || ''} ${address.lastName || ''}`.trim(),
          street: address.street || `${address.addressLine1 || ''}, ${address.addressLine2 || ''}`.trim(),
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country || 'India',
          phone: address.phone
        },
        items: orderItems,
        subtotal: parseFloat(subtotal) || 0,
        tax: parseFloat(tax) || 0,
        shippingFee: parseFloat(shipping) || 0,
        totalPrice: parseFloat(total) || 0,
        payment: {
          method: this.mapPaymentMethod(paymentMethod),
          paymentStatus: 'pending',
          paidAt: null,
          transactionId: null
        },
        status: 'pending',
        orderHistory: [{
          status: 'pending',
          timestamp: new Date(),
          updatedBy: 'system',
          notes: 'Order created - awaiting payment'
        }],
        notes: {
          customerNotes: notes || '',
          adminNotes: '',
          specialInstructions: ''
        }
      });

      await order.save();

      // Note: Cart will be cleared after successful payment verification
      // Don't clear cart here as payment might fail

      console.log(`Order created successfully: ${order.orderId} for user ${userId}`);
      
      return order;

    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Validate that all order items are still available
   * @param {Array} items - Cart items
   * @returns {Array} - Valid items
   */
  static async validateOrderItems(items) {
    const validItems = [];

    for (const item of items) {
      try {
        // Use existing cart service validation
        const validation = await CartService.validateProductVariant(
          item.productId,
          item.variant_id,
          item.quantity
        );

        if (validation.isValid) {
          validItems.push({
            ...item,
            productData: validation.product,
            variantData: validation.variant
          });
        } else {
          console.warn(`Item ${item.productId} is no longer available: ${validation.error}`);
        }
      } catch (error) {
        console.warn(`Error validating item ${item.productId}:`, error.message);
      }
    }

    return validItems;
  }

  /**
   * Create order items with full product snapshots
   * @param {Array} validatedItems - Validated cart items with product data
   * @returns {Array} - Order items with snapshots
   */
  static async createOrderItemsWithSnapshots(validatedItems) {
    return validatedItems.map(item => ({
      product: {
        id: item.productData.id,
        name: item.productData.name,
        description: item.productData.description,
        category_id: item.productData.category_id,
        makingPrice: item.productData.makingPrice || 0,
        metals: item.productData.metals || [],
        gemstones: item.productData.gemstones || [],
        images: item.productData.images || [],
        model_3d_url: item.productData.model_3d_url || '',
        certificates: item.productData.certificates || [],
        totalPrice: item.productData.totalPrice || 0,
        baseMaterialCost: item.productData.baseMaterialCost || 0
      },
      variant: item.variantData ? {
        variant_id: item.variantData.variant_id,
        name: item.variantData.name,
        making_price: item.variantData.making_price || 0,
        metal: item.variantData.metal || [],
        totalPrice: item.variantData.totalPrice || 0,
        baseMaterialCost: item.variantData.baseMaterialCost || 0
      } : null,
      quantity: item.quantity,
      price: item.totalprice || item.variantData?.totalPrice || 0
    }));
  }

  /**
   * Map frontend payment method to backend enum
   * @param {string} paymentMethod - Frontend payment method
   * @returns {string} - Backend payment method
   */
  static mapPaymentMethod(paymentMethod) {
    const methodMap = {
      'card': 'credit_card',
      'upi': 'razorpay',
      'netbanking': 'razorpay',
      'cod': 'bank_transfer'
    };
    return methodMap[paymentMethod] || 'razorpay';
  }

  /**
   * Get orders for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} - User orders
   */
  static async getUserOrders(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query = { userId };
      if (status) {
        query.status = status;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const orders = await Order.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get total count for pagination
      const totalOrders = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get a specific order by order ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for security)
   * @returns {Object} - Order details
   */
  static async getOrderById(orderId, userId = null) {
    try {
      const query = { orderId };
      
      // If userId provided, add it to query for security
      if (userId) {
        query.userId = userId;
      }

      const order = await Order.findOne(query).lean();
      
      if (!order) {
        throw new Error('Order not found');
      }

      return order;

    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Update order status (admin functionality)
   * @param {string} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} updatedBy - Who updated the status
   * @param {string} notes - Optional notes
   * @returns {Object} - Updated order
   */
  static async updateOrderStatus(orderId, newStatus, updatedBy, notes = '') {
    try {
      const order = await Order.findOne({ orderId });
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate status transition
      const validStatuses = ['pending', 'placed', 'shipped', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Invalid order status');
      }

      // Use findOneAndUpdate to avoid validation issues with existing orders
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: { status: newStatus },
          $push: {
            orderHistory: {
              status: newStatus,
              timestamp: new Date(),
              updatedBy,
              notes
            }
          }
        },
        { 
          new: true, 
          runValidators: false // Skip validation to avoid issues with missing state field
        }
      );
      
      console.log(`Order ${orderId} status updated to ${newStatus} by ${updatedBy}`);
      
      return updatedOrder;

    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  /**
   * Get all orders (admin functionality)
   * @param {Object} options - Query options
   * @returns {Array} - All orders
   */
  static async getAllOrders(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        startDate,
        endDate
      } = options;

      // Build query
      const query = {};
      if (status) query.status = status;
      if (userId) query.userId = userId;
      
      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const orders = await Order.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const totalOrders = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get order statistics (admin dashboard)
   * @returns {Object} - Order statistics
   */
  static async getOrderStats() {
    try {

      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ status: 'pending' });
      const placedOrders = await Order.countDocuments({ status: 'placed' });
      const completedOrders = await Order.countDocuments({ status: 'completed' });
      const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

      // Calculate total revenue from shipped and completed orders
      const revenueResult = await Order.aggregate([
        { $match: { status: { $in: ['shipped', 'completed'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
      ]);

      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

      // Get recent orders
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return {
        totalOrders,
        pendingOrders,
        placedOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        recentOrders
      };

    } catch (error) {
      console.error('Error fetching order statistics:', error);
      throw new Error('Failed to fetch order statistics');
    }
  }

  /**
   * Update payment status for an order
   * @param {string} orderId - Order ID
   * @param {string} paymentStatus - New payment status
   * @param {string} notes - Optional notes
   * @returns {Object} - Updated order
   */
  static async updatePaymentStatus(orderId, paymentStatus, notes = '') {
    try {
      const order = await Order.findOne({ orderId });
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate payment status
      const validPaymentStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        throw new Error('Invalid payment status');
      }

      // Update payment status
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          $set: { 
            'payment.paymentStatus': paymentStatus,
            'payment.paidAt': paymentStatus === 'completed' ? new Date() : order.payment.paidAt
          },
          $push: {
            orderHistory: {
              status: `payment_${paymentStatus}`,
              timestamp: new Date(),
              updatedBy: 'system',
              notes: notes || `Payment status updated to ${paymentStatus}`
            }
          }
        },
        { 
          new: true, 
          runValidators: false
        }
      );
      
      console.log(`Order ${orderId} payment status updated to ${paymentStatus}`);
      
      return updatedOrder;

    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  /**
   * Handle successful payment completion
   * @param {string} orderId - Order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {Object} paymentDetails - Additional payment details
   * @returns {Object} - Updated order
   */
  static async handlePaymentSuccess(orderId, paymentId, paymentDetails = {}) {
    try {
      // Update payment status to completed
      await this.updatePaymentStatus(
        orderId,
        'completed',
        `Payment successful. Payment ID: ${paymentId}`
      );

      // Update order status to placed
      const updatedOrder = await this.updateOrderStatus(
        orderId,
        'placed',
        'system',
        'Payment completed successfully'
      );

      // Update transaction ID if not already set
      if (paymentId) {
        await Order.findOneAndUpdate(
          { orderId },
          { 'payment.transactionId': paymentId }
        );
      }

      // Clear the user's cart after successful payment
      const order = await Order.findOne({ orderId });
      if (order) {
        const CartService = require('./cartService');
        await CartService.clearCart(order.userId);
        console.log(`Cart cleared for user: ${order.userId} after successful payment`);
      }

      console.log(`Payment success handled for order: ${orderId}`);
      return updatedOrder;

    } catch (error) {
      console.error('Error handling payment success:', error);
      throw new Error(`Failed to handle payment success: ${error.message}`);
    }
  }

  /**
   * Handle failed payment
   * @param {string} orderId - Order ID
   * @param {string} reason - Failure reason
   * @returns {Object} - Updated order
   */
  static async handlePaymentFailure(orderId, reason = 'Payment failed') {
    try {
      // Update payment status to failed
      await this.updatePaymentStatus(orderId, 'failed', reason);

      // Update order status to cancelled
      const updatedOrder = await this.updateOrderStatus(
        orderId,
        'cancelled',
        'system',
        `Order cancelled due to payment failure: ${reason}`
      );

      console.log(`Payment failure handled for order: ${orderId}`);
      return updatedOrder;

    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw new Error(`Failed to handle payment failure: ${error.message}`);
    }
  }
}

module.exports = OrderService;