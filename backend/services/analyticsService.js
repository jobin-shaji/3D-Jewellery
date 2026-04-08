const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');

class AnalyticsService {
  /**
   * Get date range based on period
   * @param {string} period - '7d', '30d', '90d', '1y', 'all'
   * @returns {Object} { startDate, endDate }
   */
  getDateRange(period) {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(endDate.getDate() - 30); // Default to 30 days
    }

    return { startDate, endDate };
  }

  /**
   * Get overview statistics
   * @param {string} period - Time period
   * @returns {Object} Overview stats
   */
  async getOverview(period = '30d') {
    try {
      const { startDate, endDate } = this.getDateRange(period);

      // Total revenue from completed orders
      const revenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.paymentStatus': 'completed'
          }
        },
        {
          $addFields: {
            totalMaterialCost: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { 
                  $add: [
                    '$$value', 
                    { 
                      $multiply: [
                        '$$this.quantity', 
                        { $ifNull: ['$$this.variant.baseMaterialCost', { $ifNull: ['$$this.product.baseMaterialCost', 0] }] }
                      ] 
                    }
                  ] 
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$totalPrice' },
            totalProfit: { $sum: { $subtract: ['$subtotal', '$totalMaterialCost'] } }
          }
        }
      ]);

      // Previous period for comparison
      const prevStartDate = new Date(startDate);
      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      prevStartDate.setDate(prevStartDate.getDate() - diffDays);

      const prevRevenueData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: prevStartDate, $lt: startDate },
            'payment.paymentStatus': 'completed'
          }
        },
        {
          $addFields: {
            totalMaterialCost: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { 
                  $add: [
                    '$$value', 
                    { 
                      $multiply: [
                        '$$this.quantity', 
                        { $ifNull: ['$$this.variant.baseMaterialCost', { $ifNull: ['$$this.product.baseMaterialCost', 0] }] }
                      ] 
                    }
                  ] 
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalProfit: { $sum: { $subtract: ['$subtotal', '$totalMaterialCost'] } }
          }
        }
      ]);

      // Calculate revenue change
      const currentRevenue = revenueData[0]?.totalRevenue || 0;
      const prevRevenue = prevRevenueData[0]?.totalRevenue || 0;
      const revenueChange = prevRevenue > 0 
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;

      // Calculate profit change
      const currentProfit = revenueData[0]?.totalProfit || 0;
      const prevProfit = prevRevenueData[0]?.totalProfit || 0;
      const profitChange = prevProfit > 0 
        ? ((currentProfit - prevProfit) / prevProfit) * 100 
        : 0;

      // Total active users
      const totalUsers = await User.countDocuments({ isActive: true });

      // New users in period
      const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Previous period users for comparison
      const prevNewUsers = await User.countDocuments({
        createdAt: { $gte: prevStartDate, $lt: startDate }
      });

      const userGrowth = prevNewUsers > 0 
        ? ((newUsers - prevNewUsers) / prevNewUsers) * 100 
        : 0;

      // Inventory value (active products only)
      const inventoryData = await Product.aggregate([
        {
          $match: {
            is_active: true,
            is_deleted: false
          }
        },
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$makingPrice', '$stock_quantity'] } },
            totalProducts: { $sum: 1 },
            totalStock: { $sum: '$stock_quantity' }
          }
        }
      ]);

      return {
        revenue: {
          total: currentRevenue,
          change: revenueChange,
          avgOrderValue: revenueData[0]?.avgOrderValue || 0
        },
        profit: {
          total: currentProfit,
          change: profitChange
        },
        orders: {
          total: revenueData[0]?.totalOrders || 0,
          change: 0 // Can be calculated similar to revenue
        },
        users: {
          total: totalUsers,
          newUsers: newUsers,
          growth: userGrowth
        },
        inventory: {
          totalValue: inventoryData[0]?.totalValue || 0,
          totalProducts: inventoryData[0]?.totalProducts || 0,
          totalStock: inventoryData[0]?.totalStock || 0
        }
      };
    } catch (error) {
      console.error('Error fetching overview analytics:', error);
      throw error;
    }
  }

  /**
   * Get sales trends grouped by interval
   * @param {string} period - Time period
   * @param {string} interval - 'day', 'week', 'month'
   * @returns {Array} Sales trend data
   */
  async getSalesTrends(period = '30d', interval = 'day') {
    try {
      const { startDate, endDate } = this.getDateRange(period);

      // Determine grouping format based on interval
      let dateFormat;
      switch (interval) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-W%U'; // Year-Week
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      const salesData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.paymentStatus': 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            revenue: 1,
            orders: 1
          }
        }
      ]);

      return salesData;
    } catch (error) {
      console.error('Error fetching sales trends:', error);
      throw error;
    }
  }

  /**
   * Get user growth trends
   * @param {string} period - Time period
   * @param {string} interval - 'day', 'week', 'month'
   * @returns {Array} User growth data
   */
  async getUserGrowth(period = '30d', interval = 'day') {
    try {
      const { startDate, endDate } = this.getDateRange(period);

      let dateFormat;
      switch (interval) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-W%U';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      const userData = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            newUsers: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            newUsers: 1
          }
        }
      ]);

      return userData;
    } catch (error) {
      console.error('Error fetching user growth:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   * @returns {Object} Inventory stats
   */
  async getInventoryStats() {
    try {
      // Get all active products
      const products = await Product.find({ 
        is_active: true, 
        is_deleted: false 
      }).select('stock_quantity makingPrice name');

      const totalProducts = products.length;
      const inStock = products.filter(p => p.stock_quantity > 0).length;
      const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;
      const outOfStock = products.filter(p => p.stock_quantity === 0).length;

      const totalValue = products.reduce((sum, p) => {
        return sum + (p.makingPrice * p.stock_quantity);
      }, 0);

      return {
        total: totalProducts,
        inStock,
        lowStock,
        outOfStock,
        totalValue
      };
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  /**
   * Get best selling products
   * @param {string} period - Time period
   * @param {number} limit - Number of products to return
   * @returns {Array} Best selling products
   */
  async getBestSellers(period = '30d', limit = 5) {
    try {
      const { startDate, endDate } = this.getDateRange(period);

      const bestSellers = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'payment.paymentStatus': 'completed'
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product.id',
            productName: { $first: '$items.product.name' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            name: '$productName',
            sold: '$totalSold',
            revenue: '$totalRevenue'
          }
        }
      ]);

      return bestSellers;
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
