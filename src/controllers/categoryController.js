const { Op } = require('sequelize');
const db = require('../models');
const { generateResponse, generateErrorResponse, generatePaginatedResponse } = require('../utils/responseHelper');

const { Category } = db;

class CategoryController {
  // Get all categories with pagination and filtering
  async getCategories(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        parent_id,
        status = 1,
        sort_by = 'position',
        sort_order = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { status: status === '1' ? true : false };

      // Filter by parent_id (null for root categories)
      if (parent_id !== undefined) {
        whereClause.parent_id = parent_id === 'null' ? null : parseInt(parent_id);
      }

      // Sorting
      const validSortFields = ['position', 'priority', 'name', 'created_at'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'position';
      const sortDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const { count, rows: categories } = await Category.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'children',
            where: { status: 1 },
            required: false,
            separate: true,
            order: [['position', 'ASC']]
          },
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [[sortField, sortDirection]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const categoriesWithExtras = categories.map(category => category.toJSON());

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, categoriesWithExtras, pagination, 'Categories retrieved successfully');

    } catch (error) {
      console.error('Get categories error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve categories', error.message);
    }
  }

  // Get single category by ID
  async getCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findOne({
        where: { id, status: true },
        include: [
          {
            model: Category,
            as: 'children',
            where: { status: true },
            required: false,
            order: [['position', 'ASC']]
          },
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      if (!category) {
        return generateErrorResponse(res, 404, 'Category not found');
      }

      const categoryData = category.toJSON();
      
      // Add breadcrumb
      try {
        categoryData.breadcrumb = await category.getBreadcrumb();
      } catch (breadcrumbError) {
        console.warn('Failed to get breadcrumb:', breadcrumbError);
        categoryData.breadcrumb = [];
      }

      return generateResponse(res, 200, 'Category retrieved successfully', {
        category: categoryData
      });

    } catch (error) {
      console.error('Get category error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category', error.message);
    }
  }

  // Get root categories (no parent)
  async getRootCategories(req, res) {
    try {
      const { limit = 20 } = req.query;

      const categories = await Category.findAll({
        where: { parent_id: null, status: true },
        include: [
          {
            model: Category,
            as: 'children',
            where: { status: true },
            required: false,
            attributes: ['id', 'name', 'image', 'position'],
            order: [['position', 'ASC']]
          }
        ],
        order: [['position', 'ASC'], ['priority', 'ASC']],
        limit: parseInt(limit)
      });

      const categoriesWithExtras = categories.map(category => category.toJSON());

      return generateResponse(res, 200, 'Root categories retrieved successfully', {
        categories: categoriesWithExtras
      });

    } catch (error) {
      console.error('Get root categories error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve root categories', error.message);
    }
  }

  // Get category tree structure
  async getCategoryTree(req, res) {
    try {
      const { max_depth = 3 } = req.query;

      const tree = await Category.buildTree(null, parseInt(max_depth));

      return generateResponse(res, 200, 'Category tree retrieved successfully', {
        tree
      });

    } catch (error) {
      console.error('Get category tree error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category tree', error.message);
    }
  }

  // Get category hierarchy (flat structure with level info)
  async getCategoryHierarchy(req, res) {
    try {
      const categories = await Category.findAll({
        where: { status: true },
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['position', 'ASC'], ['priority', 'ASC']]
      });

      const hierarchyData = categories.map(category => {
        const categoryData = category.toJSON();
        categoryData.level = category.getLevel();
        categoryData.is_root = category.isRoot();
        return categoryData;
      });

      return generateResponse(res, 200, 'Category hierarchy retrieved successfully', {
        categories: hierarchyData
      });

    } catch (error) {
      console.error('Get category hierarchy error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category hierarchy', error.message);
    }
  }

  // Get children of a specific category
  async getCategoryChildren(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows: categories } = await Category.findAndCountAll({
        where: { parent_id: id, status: true },
        order: [['position', 'ASC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const categoriesWithExtras = categories.map(category => category.toJSON());

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, categoriesWithExtras, pagination, 'Category children retrieved successfully');

    } catch (error) {
      console.error('Get category children error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category children', error.message);
    }
  }

  // Search categories
  async searchCategories(req, res) {
    try {
      const { q: query, page = 1, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        return generateErrorResponse(res, 400, 'Search query must be at least 2 characters long');
      }

      const offset = (page - 1) * limit;

      const { count, rows: categories } = await Category.findAndCountAll({
        where: {
          status: true,
          name: { [Op.iLike]: `%${query}%` }
        },
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['position', 'ASC'], ['name', 'ASC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const categoriesWithExtras = categories.map(category => {
        const categoryData = category.toJSON();
        categoryData.level = category.getLevel();
        return categoryData;
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        hasNext: (page * limit) < count,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, categoriesWithExtras, pagination, 'Search results retrieved successfully');

    } catch (error) {
      console.error('Search categories error:', error);
      return generateErrorResponse(res, 500, 'Failed to search categories', error.message);
    }
  }

  // Get category breadcrumb
  async getCategoryBreadcrumb(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findOne({
        where: { id, status: true }
      });

      if (!category) {
        return generateErrorResponse(res, 404, 'Category not found');
      }

      const breadcrumb = await category.getBreadcrumb();

      return generateResponse(res, 200, 'Category breadcrumb retrieved successfully', {
        breadcrumb
      });

    } catch (error) {
      console.error('Get category breadcrumb error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve category breadcrumb', error.message);
    }
  }

  // Get featured categories (with priority)
  async getFeaturedCategories(req, res) {
    try {
      const { limit = 10 } = req.query;

      const categories = await Category.findAll({
        where: { 
          status: true,
          priority: { [Op.not]: null }
        },
        order: [['priority', 'ASC'], ['position', 'ASC']],
        limit: parseInt(limit)
      });

      const categoriesWithExtras = categories.map(category => category.toJSON());

      return generateResponse(res, 200, 'Featured categories retrieved successfully', {
        categories: categoriesWithExtras
      });

    } catch (error) {
      console.error('Get featured categories error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve featured categories', error.message);
    }
  }
}

module.exports = new CategoryController(); 