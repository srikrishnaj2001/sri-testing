const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { Product, Category } = db;

class AdminProductsController {
  // Get all products with filters and pagination
  async getProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category_id, 
        status, 
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
        price_min,
        price_max,
        in_stock
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {};
      
      if (category_id) {
        whereConditions.category_id = category_id;
      }
      
      if (status) {
        whereConditions.status = status === 'active';
      }
      
      if (in_stock !== undefined) {
        whereConditions.stock_quantity = { [Op.gt]: 0 };
      }
      
      if (price_min || price_max) {
        whereConditions.price = {};
        if (price_min) {
          whereConditions.price[Op.gte] = parseFloat(price_min);
        }
        if (price_max) {
          whereConditions.price[Op.lte] = parseFloat(price_max);
        }
      }
      
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get products with category information
      const { count, rows: products } = await Product.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [[sort_by, sort_order.toUpperCase()]],
        distinct: true
      });

      return generateResponse(res, 200, 'Products retrieved successfully', {
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit),
          has_next: page * limit < count,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Get products error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve products', error.message);
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      const product = await Product.findByPk(productId, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'image']
          }
        ]
      });

      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      return generateResponse(res, 200, 'Product retrieved successfully', {
        product
      });

    } catch (error) {
      console.error('Get product by ID error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve product', error.message);
    }
  }

  // Create new product
  async createProduct(req, res) {
    try {
      const productData = req.body;

      // Validate required fields
      if (!productData.name || !productData.category_id || !productData.price) {
        return generateErrorResponse(res, 400, 'Name, category_id, and price are required');
      }

      // Check if category exists
      const category = await Category.findByPk(productData.category_id);
      if (!category) {
        return generateErrorResponse(res, 404, 'Category not found');
      }

      // Create product
      const product = await Product.create({
        ...productData,
        created_by: req.user.userId
      });

      // Get product with category information
      const createdProduct = await Product.findByPk(product.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'image']
          }
        ]
      });

      return generateResponse(res, 201, 'Product created successfully', {
        product: createdProduct
      });

    } catch (error) {
      console.error('Create product error:', error);
      return generateErrorResponse(res, 500, 'Failed to create product', error.message);
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const { productId } = req.params;
      const updateData = req.body;

      if (!productId) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      // Find product
      const product = await Product.findByPk(productId);
      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      // If category_id is being updated, check if it exists
      if (updateData.category_id) {
        const category = await Category.findByPk(updateData.category_id);
        if (!category) {
          return generateErrorResponse(res, 404, 'Category not found');
        }
      }

      // Update product
      await product.update({
        ...updateData,
        updated_by: req.user.userId
      });

      // Get updated product with category information
      const updatedProduct = await Product.findByPk(productId, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'image']
          }
        ]
      });

      return generateResponse(res, 200, 'Product updated successfully', {
        product: updatedProduct
      });

    } catch (error) {
      console.error('Update product error:', error);
      return generateErrorResponse(res, 500, 'Failed to update product', error.message);
    }
  }

  // Delete product
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      // Find product
      const product = await Product.findByPk(productId);
      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      // Soft delete (update status to inactive)
      await product.update({
        status: false,
        deleted_at: new Date(),
        deleted_by: req.user.userId
      });

      return generateResponse(res, 200, 'Product deleted successfully', {
        product_id: productId
      });

    } catch (error) {
      console.error('Delete product error:', error);
      return generateErrorResponse(res, 500, 'Failed to delete product', error.message);
    }
  }

  // Bulk update products
  async bulkUpdateProducts(req, res) {
    try {
      const { product_ids, update_data } = req.body;

      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        return generateErrorResponse(res, 400, 'Product IDs array is required');
      }

      if (!update_data || typeof update_data !== 'object') {
        return generateErrorResponse(res, 400, 'Update data is required');
      }

      // Update products
      const [updatedCount] = await Product.update(
        {
          ...update_data,
          updated_by: req.user.userId
        },
        {
          where: {
            id: {
              [Op.in]: product_ids
            }
          }
        }
      );

      return generateResponse(res, 200, 'Products updated successfully', {
        updated_count: updatedCount,
        product_ids
      });

    } catch (error) {
      console.error('Bulk update products error:', error);
      return generateErrorResponse(res, 500, 'Failed to update products', error.message);
    }
  }

  // Update product stock
  async updateProductStock(req, res) {
    try {
      const { productId } = req.params;
      const { stock_quantity, operation = 'set' } = req.body;

      if (!productId) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      if (stock_quantity === undefined) {
        return generateErrorResponse(res, 400, 'Stock quantity is required');
      }

      // Find product
      const product = await Product.findByPk(productId);
      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      let newStock;
      switch (operation) {
        case 'add':
          newStock = product.stock_quantity + parseInt(stock_quantity);
          break;
        case 'subtract':
          newStock = product.stock_quantity - parseInt(stock_quantity);
          break;
        case 'set':
        default:
          newStock = parseInt(stock_quantity);
          break;
      }

      // Ensure stock doesn't go negative
      newStock = Math.max(0, newStock);

      // Update stock
      await product.update({
        stock_quantity: newStock,
        updated_by: req.user.userId
      });

      return generateResponse(res, 200, 'Product stock updated successfully', {
        product_id: productId,
        old_stock: product.stock_quantity,
        new_stock: newStock,
        operation
      });

    } catch (error) {
      console.error('Update product stock error:', error);
      return generateErrorResponse(res, 500, 'Failed to update product stock', error.message);
    }
  }

  // Get product statistics
  async getProductStats(req, res) {
    try {
      const stats = {
        total_products: await Product.count(),
        active_products: await Product.count({ where: { status: true } }),
        inactive_products: await Product.count({ where: { status: false } }),
        out_of_stock: await Product.count({
          where: {
            stock_quantity: 0,
            status: true
          }
        }),
        low_stock: await Product.count({
          where: {
            stock_quantity: { [Op.between]: [1, 10] },
            status: true
          }
        }),
        average_price: await Product.findAll({
          attributes: [
            [db.sequelize.fn('AVG', db.sequelize.col('price')), 'avg_price']
          ],
          where: { status: true },
          raw: true
        }).then(result => parseFloat(result[0].avg_price).toFixed(2)),
        total_inventory_value: await Product.findAll({
          attributes: [
            [db.sequelize.fn('SUM', db.sequelize.literal('price * stock_quantity')), 'total_value']
          ],
          where: { status: true },
          raw: true
        }).then(result => parseFloat(result[0].total_value).toFixed(2))
      };

      return generateResponse(res, 200, 'Product statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get product stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve product statistics', error.message);
    }
  }

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!categoryId) {
        return generateErrorResponse(res, 400, 'Category ID is required');
      }

      // Check if category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return generateErrorResponse(res, 404, 'Category not found');
      }

      const offset = (page - 1) * limit;

      // Get products in category
      const { count, rows: products } = await Product.findAndCountAll({
        where: {
          category_id: categoryId,
          status: true
        },
        limit: parseInt(limit),
        offset,
        order: [['name', 'ASC']]
      });

      return generateResponse(res, 200, 'Products by category retrieved successfully', {
        category: {
          id: category.id,
          name: category.name
        },
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit),
          has_next: page * limit < count,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Get products by category error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve products by category', error.message);
    }
  }

  // Toggle product status
  async toggleProductStatus(req, res) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return generateErrorResponse(res, 400, 'Product ID is required');
      }

      // Find product
      const product = await Product.findByPk(productId);
      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      // Toggle status
      await product.update({
        status: !product.status,
        updated_by: req.user.userId
      });

      return generateResponse(res, 200, 'Product status toggled successfully', {
        product_id: productId,
        new_status: !product.status
      });

    } catch (error) {
      console.error('Toggle product status error:', error);
      return generateErrorResponse(res, 500, 'Failed to toggle product status', error.message);
    }
  }
}

module.exports = new AdminProductsController(); 