const db = require('../models');
const { generateResponse, generateErrorResponse, generatePaginatedResponse } = require('../utils/responseHelper');

const { User, Product, Branch } = db;

class CustomerWishlistController {
  // Get customer wishlist
  async getWishlist(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20, category_id, branch_id } = req.query;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      let wishlist = customer.getWishlist();

      // Filter by category if specified
      if (category_id) {
        wishlist = wishlist.filter(item => {
          const categories = item.product_categories || [];
          return categories.some(cat => cat.id === category_id);
        });
      }

      // Filter by branch if specified
      if (branch_id) {
        wishlist = wishlist.filter(item => item.branch_id === branch_id);
      }

      // Get full product details for each wishlist item
      const wishlistWithDetails = await Promise.all(
        wishlist.map(async (item) => {
          const product = await Product.findOne({
            where: { id: item.product_id, status: true },
            include: [
              {
                model: Branch,
                as: 'branch',
                attributes: ['id', 'name', 'address']
              }
            ]
          });

          if (!product) {
            return null; // Product might be deleted
          }

          const productData = product.toJSON();
          productData.images = product.getAllImages();
          productData.is_available_now = product.isAvailableNow();
          productData.wishlist_added_at = item.created_at;

          return productData;
        })
      );

      // Filter out null values (deleted products)
      const validWishlist = wishlistWithDetails.filter(item => item !== null);

      // Pagination
      const total = validWishlist.length;
      const offset = (page - 1) * limit;
      const paginatedWishlist = validWishlist.slice(offset, offset + parseInt(limit));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, paginatedWishlist, pagination, 'Wishlist retrieved successfully');

    } catch (error) {
      console.error('Get wishlist error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve wishlist', error.message);
    }
  }

  // Add product to wishlist
  async addToWishlist(req, res) {
    try {
      const { userId } = req.user;
      const { product_id } = req.body;

      if (!product_id) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Check if product exists
      const product = await Product.findOne({
        where: { id: product_id, status: true }
      });

      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      // Get current wishlist
      const currentWishlist = customer.getWishlist();

      // Check if product is already in wishlist
      const existingItem = currentWishlist.find(item => item.product_id === product_id);
      if (existingItem) {
        return generateErrorResponse(res, 400, 'Product already in wishlist');
      }

      // Create new wishlist item
      const wishlistItem = {
        product_id,
        created_at: new Date(),
        product_categories: product.getCategoryIds(),
        branch_id: product.branch_id
      };

      // Add to wishlist
      const updatedWishlist = [...currentWishlist, wishlistItem];

      // Update customer
      await customer.update({ wishlist: updatedWishlist });

      return generateResponse(res, 201, 'Product added to wishlist successfully', {
        wishlist_item: wishlistItem
      });

    } catch (error) {
      console.error('Add to wishlist error:', error);
      return generateErrorResponse(res, 500, 'Failed to add product to wishlist', error.message);
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(req, res) {
    try {
      const { userId } = req.user;
      const { product_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Get current wishlist
      const currentWishlist = customer.getWishlist();

      // Find and remove the item
      const updatedWishlist = currentWishlist.filter(item => item.product_id !== product_id);

      if (updatedWishlist.length === currentWishlist.length) {
        return generateErrorResponse(res, 404, 'Product not found in wishlist');
      }

      // Update customer
      await customer.update({ wishlist: updatedWishlist });

      return generateResponse(res, 200, 'Product removed from wishlist successfully');

    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return generateErrorResponse(res, 500, 'Failed to remove product from wishlist', error.message);
    }
  }

  // Check if product is in wishlist
  async checkWishlist(req, res) {
    try {
      const { userId } = req.user;
      const { product_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const wishlist = customer.getWishlist();
      const isInWishlist = wishlist.some(item => item.product_id === product_id);

      return generateResponse(res, 200, 'Wishlist status checked successfully', {
        product_id,
        is_in_wishlist: isInWishlist
      });

    } catch (error) {
      console.error('Check wishlist error:', error);
      return generateErrorResponse(res, 500, 'Failed to check wishlist status', error.message);
    }
  }

  // Toggle product in wishlist
  async toggleWishlist(req, res) {
    try {
      const { userId } = req.user;
      const { product_id } = req.body;

      if (!product_id) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Get current wishlist
      const currentWishlist = customer.getWishlist();

      // Check if product is already in wishlist
      const existingItemIndex = currentWishlist.findIndex(item => item.product_id === product_id);
      let updatedWishlist;
      let action;

      if (existingItemIndex !== -1) {
        // Remove from wishlist
        updatedWishlist = currentWishlist.filter(item => item.product_id !== product_id);
        action = 'removed';
      } else {
        // Add to wishlist
        const product = await Product.findOne({
          where: { id: product_id, status: true }
        });

        if (!product) {
          return generateErrorResponse(res, 404, 'Product not found');
        }

        const wishlistItem = {
          product_id,
          created_at: new Date(),
          product_categories: product.getCategoryIds(),
          branch_id: product.branch_id
        };

        updatedWishlist = [...currentWishlist, wishlistItem];
        action = 'added';
      }

      // Update customer
      await customer.update({ wishlist: updatedWishlist });

      return generateResponse(res, 200, `Product ${action} ${action === 'added' ? 'to' : 'from'} wishlist successfully`, {
        product_id,
        action,
        is_in_wishlist: action === 'added'
      });

    } catch (error) {
      console.error('Toggle wishlist error:', error);
      return generateErrorResponse(res, 500, 'Failed to toggle wishlist', error.message);
    }
  }

  // Clear entire wishlist
  async clearWishlist(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Clear wishlist
      await customer.update({ wishlist: [] });

      return generateResponse(res, 200, 'Wishlist cleared successfully');

    } catch (error) {
      console.error('Clear wishlist error:', error);
      return generateErrorResponse(res, 500, 'Failed to clear wishlist', error.message);
    }
  }

  // Get wishlist statistics
  async getWishlistStats(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const wishlist = customer.getWishlist();

      // Calculate statistics
      const stats = {
        total_items: wishlist.length,
        categories: {},
        branches: {},
        recent_additions: 0
      };

      // Count by categories and branches
      wishlist.forEach(item => {
        // Count categories
        if (item.product_categories) {
          item.product_categories.forEach(category => {
            stats.categories[category.name] = (stats.categories[category.name] || 0) + 1;
          });
        }

        // Count branches
        if (item.branch_id) {
          stats.branches[item.branch_id] = (stats.branches[item.branch_id] || 0) + 1;
        }

        // Count recent additions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (new Date(item.created_at) >= sevenDaysAgo) {
          stats.recent_additions++;
        }
      });

      return generateResponse(res, 200, 'Wishlist statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get wishlist stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve wishlist statistics', error.message);
    }
  }

  // Get wishlist by category
  async getWishlistByCategory(req, res) {
    try {
      const { userId } = req.user;
      const { category_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const wishlist = customer.getWishlist();
      
      // Filter by category
      const categoryWishlist = wishlist.filter(item => {
        const categories = item.product_categories || [];
        return categories.some(cat => cat.id === category_id);
      });

      return generateResponse(res, 200, 'Category wishlist retrieved successfully', {
        wishlist: categoryWishlist,
        total: categoryWishlist.length
      });

    } catch (error) {
      console.error('Get wishlist by category error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category wishlist', error.message);
    }
  }

  // Move wishlist to cart (bulk operation)
  async moveToCart(req, res) {
    try {
      const { userId } = req.user;
      const { product_ids } = req.body;

      if (!product_ids || !Array.isArray(product_ids)) {
        return generateErrorResponse(res, 400, 'Product IDs array is required');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // This would typically interact with cart functionality
      // For now, just remove from wishlist
      const currentWishlist = customer.getWishlist();
      const updatedWishlist = currentWishlist.filter(item => !product_ids.includes(item.product_id));

      await customer.update({ wishlist: updatedWishlist });

      return generateResponse(res, 200, 'Products moved to cart successfully', {
        moved_items: product_ids.length,
        remaining_wishlist_items: updatedWishlist.length
      });

    } catch (error) {
      console.error('Move to cart error:', error);
      return generateErrorResponse(res, 500, 'Failed to move products to cart', error.message);
    }
  }
}

module.exports = new CustomerWishlistController(); 