const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productController');
const { optionalAuth } = require('../../config/clerk');

// Public routes (no authentication required)

// Get all products with filtering and pagination
router.get('/', optionalAuth, productController.getProducts);

// Search products
router.get('/search', optionalAuth, productController.searchProducts);

// Get recommended products
router.get('/recommended', optionalAuth, productController.getRecommendedProducts);

// Get popular products  
router.get('/popular', optionalAuth, productController.getPopularProducts);

// Get products by category
router.get('/category/:category_id', optionalAuth, productController.getProductsByCategory);

// Get products by branch
router.get('/branch/:branch_id', optionalAuth, productController.getProductsByBranch);

// Get single product by ID
router.get('/:id', optionalAuth, productController.getProduct);

// Get product variations
router.get('/:id/variations', optionalAuth, productController.getProductVariations);

// Get product addons
router.get('/:id/addons', optionalAuth, productController.getProductAddons);

// Admin routes (authentication required)

// TODO: Add admin product management routes when implementing admin functionality
// router.post('/', requireAdmin(), productController.createProduct);
// router.put('/:id', requireAdmin(), productController.updateProduct);
// router.delete('/:id', requireAdmin(), productController.deleteProduct);
// router.patch('/:id/status', requireAdmin(), productController.updateProductStatus);

module.exports = router; 