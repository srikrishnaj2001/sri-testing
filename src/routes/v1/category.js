const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryController');
const { optionalAuth } = require('../../config/clerk');

// Public routes (no authentication required)

// Get all categories with pagination and filtering
router.get('/', optionalAuth, categoryController.getCategories);

// Get category tree structure
router.get('/tree', optionalAuth, categoryController.getCategoryTree);

// Get category hierarchy (flat structure with level info)
router.get('/hierarchy', optionalAuth, categoryController.getCategoryHierarchy);

// Get root categories (no parent)
router.get('/root', optionalAuth, categoryController.getRootCategories);

// Get featured categories
router.get('/featured', optionalAuth, categoryController.getFeaturedCategories);

// Search categories
router.get('/search', optionalAuth, categoryController.searchCategories);

// Get single category by ID
router.get('/:id', optionalAuth, categoryController.getCategory);

// Get category breadcrumb
router.get('/:id/breadcrumb', optionalAuth, categoryController.getCategoryBreadcrumb);

// Get children of a specific category
router.get('/:id/children', optionalAuth, categoryController.getCategoryChildren);

// Admin routes (authentication required)

// TODO: Add admin category management routes when implementing admin functionality
// router.post('/', requireAdmin(), categoryController.createCategory);
// router.put('/:id', requireAdmin(), categoryController.updateCategory);
// router.delete('/:id', requireAdmin(), categoryController.deleteCategory);
// router.patch('/:id/status', requireAdmin(), categoryController.updateCategoryStatus);
// router.patch('/:id/position', requireAdmin(), categoryController.updateCategoryPosition);

module.exports = router; 