const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse, generatePaginatedResponse } = require('../utils/responseHelper');

const { Product, Branch } = db;

class ProductController {
  // Get all products with filtering and pagination
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category_id,
        branch_id,
        search,
        product_type,
        is_recommended,
        is_available,
        sort_by = 'created_at',
        sort_order = 'DESC',
        min_price,
        max_price
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { status: 1 }; // Only active products

      // Filter by category
      if (category_id) {
        whereClause.category_ids = {
          [Op.like]: `%"id":"${category_id}"%`
        };
      }

      // Filter by branch
      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      // Search in name and description
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Filter by product type
      if (product_type) {
        whereClause.product_type = product_type;
      }

      // Filter by recommended
      if (is_recommended !== undefined) {
        whereClause.is_recommended = is_recommended === 'true' ? 1 : 0;
      }

      // Filter by availability
      if (is_available !== undefined) {
        whereClause.status = is_available === 'true' ? 1 : 0;
      }

      // Price range filter
      if (min_price) {
        whereClause.price = { ...whereClause.price, [Op.gte]: parseFloat(min_price) };
      }
      if (max_price) {
        whereClause.price = { ...whereClause.price, [Op.lte]: parseFloat(max_price) };
      }

      // Sorting
      const validSortFields = ['name', 'price', 'created_at', 'total_sold'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address', 'phone']
          }
        ],
        order: [[sortField, sortDirection]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Add computed fields
      const productsWithExtras = products.map(product => {
        const productData = product.toJSON();
        productData.categories = product.getCategoryIds();
        productData.variations = product.getVariations();
        productData.addons = product.getAddons();
        productData.images = product.getAllImages();
        productData.is_available_now = product.isAvailableNow();
        return productData;
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, productsWithExtras, pagination, 'Products retrieved successfully');

    } catch (error) {
      console.error('Get products error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve products', error.message);
    }
  }

  // Get single product by ID
  async getProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        where: { id, status: 1 },
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address', 'phone', 'latitude', 'longitude']
          }
        ]
      });

      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      // Add computed fields
      const productData = product.toJSON();
      productData.categories = product.getCategoryIds();
      productData.variations = product.getVariations();
      productData.addons = product.getAddons();
      productData.images = product.getAllImages();
      productData.is_available_now = product.isAvailableNow();

      return generateResponse(res, 200, 'Product retrieved successfully', {
        product: productData
      });

    } catch (error) {
      console.error('Get product error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve product', error.message);
    }
  }

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { category_id } = req.params;
      const { page = 1, limit = 10, branch_id } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        status: 1,
        category_ids: {
          [Op.like]: `%"id":"${category_id}"%`
        }
      };

      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['position', 'ASC'], ['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const productsWithExtras = products.map(product => {
        const productData = product.toJSON();
        productData.categories = product.getCategoryIds();
        productData.images = product.getAllImages();
        return productData;
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, productsWithExtras, pagination, 'Category products retrieved successfully');

    } catch (error) {
      console.error('Get products by category error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category products', error.message);
    }
  }

  // Get recommended products
  async getRecommendedProducts(req, res) {
    try {
      const { limit = 10, branch_id } = req.query;

      const whereClause = {
        status: 1,
        is_recommended: 1
      };

      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      const products = await Product.findAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['total_sold', 'DESC'], ['created_at', 'DESC']],
        limit: parseInt(limit)
      });

      const productsWithExtras = products.map(product => {
        const productData = product.toJSON();
        productData.images = product.getAllImages();
        return productData;
      });

      return generateResponse(res, 200, 'Recommended products retrieved successfully', {
        products: productsWithExtras
      });

    } catch (error) {
      console.error('Get recommended products error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve recommended products', error.message);
    }
  }

  // Get popular products
  async getPopularProducts(req, res) {
    try {
      const { limit = 10, branch_id } = req.query;

      const whereClause = {
        status: 1
      };

      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      const products = await Product.findAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['total_sold', 'DESC'], ['rating', 'DESC']],
        limit: parseInt(limit)
      });

      const productsWithExtras = products.map(product => {
        const productData = product.toJSON();
        productData.images = product.getAllImages();
        return productData;
      });

      return generateResponse(res, 200, 'Popular products retrieved successfully', {
        products: productsWithExtras
      });

    } catch (error) {
      console.error('Get popular products error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve popular products', error.message);
    }
  }

  // Search products
  async searchProducts(req, res) {
    try {
      const { q: query, page = 1, limit = 10, branch_id } = req.query;

      if (!query || query.trim().length < 2) {
        return generateErrorResponse(res, 400, 'Search query must be at least 2 characters long');
      }

      const offset = (page - 1) * limit;
      const whereClause = {
        status: 1,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } }
        ]
      };

      if (branch_id) {
        whereClause.branch_id = branch_id;
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name']
          }
        ],
        order: [['total_sold', 'DESC'], ['rating', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const productsWithExtras = products.map(product => {
        const productData = product.toJSON();
        productData.images = product.getAllImages();
        return productData;
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, productsWithExtras, pagination, 'Search results retrieved successfully');

    } catch (error) {
      console.error('Search products error:', error);
      return generateErrorResponse(res, 500, 'Failed to search products', error.message);
    }
  }

  // Get product variations (for specific product)
  async getProductVariations(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        where: { id, status: 1 }
      });

      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      const variations = product.getVariations();

      return generateResponse(res, 200, 'Product variations retrieved successfully', {
        variations
      });

    } catch (error) {
      console.error('Get product variations error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve product variations', error.message);
    }
  }

  // Get product addons
  async getProductAddons(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        where: { id, status: 1 }
      });

      if (!product) {
        return generateErrorResponse(res, 404, 'Product not found');
      }

      const addons = product.getAddons();

      return generateResponse(res, 200, 'Product addons retrieved successfully', {
        addons
      });

    } catch (error) {
      console.error('Get product addons error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve product addons', error.message);
    }
  }

  // Get products by branch
  async getProductsByBranch(req, res) {
    try {
      const { branch_id } = req.params;
      const { page = 1, limit = 10, category_id } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {
        status: 1,
        branch_id
      };

      if (category_id) {
        whereClause.category_ids = {
          [Op.like]: `%"id":"${category_id}"%`
        };
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Branch,
            as: 'branch',
            attributes: ['id', 'name', 'address']
          }
        ],
        order: [['position', 'ASC'], ['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const productsWithExtras = products.map(product => {
        const productData = product.toJSON();
        productData.images = product.getAllImages();
        productData.categories = product.getCategoryIds();
        return productData;
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, productsWithExtras, pagination, 'Branch products retrieved successfully');

    } catch (error) {
      console.error('Get products by branch error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve branch products', error.message);
    }
  }
}

module.exports = new ProductController(); 