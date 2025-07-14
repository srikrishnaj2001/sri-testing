/**
 * Product Logic Utilities
 * Converted from PHP CentralLogics/product.php to JavaScript
 */

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Product, BranchProduct, Branch, Review, Wishlist, User, Cuisine, ProductTag } = require('../models');
const { productDataFormatting } = require('./helpers');
const { PRODUCT_TYPES, DEFAULTS } = require('./constants');

/**
 * Get single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Object|null>} Product object or null
 */
const getProduct = async (id) => {
    try {
        const product = await Product.findOne({
            where: { 
                id,
                status: 1 
            },
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                }
            ]
        });

        if (product) {
            return await productDataFormatting(product.toJSON());
        }
        
        return null;
    } catch (error) {
        console.error('Error getting product:', error);
        return null;
    }
};

/**
 * Get latest products with filters
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @param {string} productType - Product type (veg/non_veg/all)
 * @param {string} name - Search term
 * @param {number} categoryIds - Category ID to filter by
 * @param {string} sortBy - Sort option
 * @returns {Promise<Object>} Paginated products result
 */
const getLatestProducts = async (limit = 10, offset = 1, productType = 'all', name = '', categoryIds = null, sortBy = 'latest') => {
    try {
        const searchLimit = limit || 10;
        const searchOffset = offset || 1;
        
        // Build where conditions
        const whereConditions = {
            status: 1
        };
        
        // Product type filter
        if (productType && productType !== 'all') {
            whereConditions.product_type = productType === 'veg' ? PRODUCT_TYPES.VEG : PRODUCT_TYPES.NON_VEG;
        }
        
        // Name search
        if (name) {
            const keywords = name.trim().split(' ');
            const nameConditions = keywords.map(keyword => ({
                name: {
                    [Op.iLike]: `%${keyword}%`
                }
            }));
            
            whereConditions[Op.or] = [
                { [Op.or]: nameConditions },
                {
                    '$tags.tag$': {
                        [Op.iLike]: `%${name}%`
                    }
                }
            ];
        }
        
        // Category filter
        if (categoryIds) {
            whereConditions.category_ids = {
                [Op.contains]: [{ id: categoryIds }]
            };
        }
        
        // Build order clause
        let orderClause = [['created_at', 'DESC']]; // Default sorting
        
        switch (sortBy) {
            case 'popular':
                orderClause = [['popularity_count', 'DESC']];
                break;
            case 'price_high_to_low':
                orderClause = [['price', 'DESC']];
                break;
            case 'price_low_to_high':
                orderClause = [['price', 'ASC']];
                break;
            case 'latest':
            default:
                orderClause = [['created_at', 'DESC']];
                break;
        }
        
        const { count, rows } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                },
                {
                    model: ProductTag,
                    as: 'tags',
                    attributes: ['tag'],
                    required: false
                }
            ],
            order: orderClause,
            limit: searchLimit,
            offset: (searchOffset - 1) * searchLimit,
            distinct: true
        });
        
        const formattedProducts = await productDataFormatting(rows.map(row => row.toJSON()), true);
        
        return {
            total_size: count,
            limit: searchLimit,
            offset: searchOffset,
            products: formattedProducts
        };
    } catch (error) {
        console.error('Error getting latest products:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            products: []
        };
    }
};

/**
 * Get wishlisted products for a user
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @param {Object} user - User object
 * @returns {Promise<Object>} Paginated wishlisted products
 */
const getWishlistedProducts = async (limit = 10, offset = 1, user) => {
    try {
        if (!user || !user.id) {
            return {
                total_size: 0,
                limit: limit || 10,
                offset: offset || 1,
                products: []
            };
        }
        
        // Get product IDs from wishlist
        const wishlistItems = await Wishlist.findAll({
            where: { user_id: user.id },
            attributes: ['product_id']
        });
        
        const productIds = wishlistItems.map(item => item.product_id);
        
        if (productIds.length === 0) {
            return {
                total_size: 0,
                limit: limit || 10,
                offset: offset || 1,
                products: []
            };
        }
        
        const { count, rows } = await Product.findAndCountAll({
            where: {
                id: {
                    [Op.in]: productIds
                },
                status: 1
            },
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: limit || 10,
            offset: ((offset || 1) - 1) * (limit || 10),
            distinct: true
        });
        
        const formattedProducts = await productDataFormatting(rows.map(row => row.toJSON()), true);
        
        return {
            total_size: count,
            limit: limit || 10,
            offset: offset || 1,
            products: formattedProducts
        };
    } catch (error) {
        console.error('Error getting wishlisted products:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            products: []
        };
    }
};

/**
 * Get popular products
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @param {string} productType - Product type (veg/non_veg/all)
 * @param {string} name - Search term
 * @returns {Promise<Object>} Paginated popular products
 */
const getPopularProducts = async (limit = null, offset = 1, productType = 'all', name = '') => {
    try {
        const searchLimit = limit || DEFAULTS.PAGINATION_LIMIT;
        const searchOffset = offset || 1;
        
        // Build where conditions
        const whereConditions = {
            status: 1
        };
        
        // Product type filter
        if (productType && productType !== 'all') {
            whereConditions.product_type = productType === 'veg' ? PRODUCT_TYPES.VEG : PRODUCT_TYPES.NON_VEG;
        }
        
        // Name search
        if (name) {
            const keywords = name.trim().split(' ');
            const nameConditions = keywords.map(keyword => ({
                name: {
                    [Op.iLike]: `%${keyword}%`
                }
            }));
            
            whereConditions[Op.or] = [
                { [Op.or]: nameConditions },
                {
                    '$tags.tag$': {
                        [Op.iLike]: `%${name}%`
                    }
                }
            ];
        }
        
        const { count, rows } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                },
                {
                    model: ProductTag,
                    as: 'tags',
                    attributes: ['tag'],
                    required: false
                }
            ],
            order: [['popularity_count', 'DESC']],
            limit: searchLimit,
            offset: (searchOffset - 1) * searchLimit,
            distinct: true
        });
        
        const formattedProducts = await productDataFormatting(rows.map(row => row.toJSON()), true);
        
        return {
            total_size: count,
            limit: searchLimit,
            offset: searchOffset,
            products: formattedProducts
        };
    } catch (error) {
        console.error('Error getting popular products:', error);
        return {
            total_size: 0,
            limit: limit || DEFAULTS.PAGINATION_LIMIT,
            offset: offset || 1,
            products: []
        };
    }
};

/**
 * Get related products for a product
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Array of related products
 */
const getRelatedProducts = async (productId) => {
    try {
        const product = await Product.findByPk(productId);
        if (!product) {
            return [];
        }
        
        const relatedProducts = await Product.findAll({
            where: {
                category_ids: product.category_ids,
                id: {
                    [Op.ne]: productId
                },
                status: 1
            },
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                }
            ],
            limit: 10
        });
        
        return await productDataFormatting(relatedProducts.map(product => product.toJSON()), true);
    } catch (error) {
        console.error('Error getting related products:', error);
        return [];
    }
};

/**
 * Search products with advanced filters
 * @param {string} name - Search term
 * @param {number} rating - Minimum rating
 * @param {Array|string} categoryId - Category ID(s)
 * @param {Array|string} cuisineId - Cuisine ID(s)
 * @param {string} productType - Product type
 * @param {string} sortBy - Sort option
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Promise<Object>} Search results
 */
const searchProducts = async (name = '', rating = null, categoryId = null, cuisineId = null, productType = 'all', sortBy = null, limit = 10, offset = 1, minPrice = null, maxPrice = null) => {
    try {
        const searchLimit = limit || 10;
        const searchOffset = offset || 1;
        
        // Normalize product type
        const normalizedProductType = (productType !== 'veg' && productType !== 'non_veg') ? 'all' : productType;
        
        // Build where conditions
        const whereConditions = {
            status: 1
        };
        
        // Product type filter
        if (normalizedProductType !== 'all') {
            whereConditions.product_type = normalizedProductType === 'veg' ? PRODUCT_TYPES.VEG : PRODUCT_TYPES.NON_VEG;
        }
        
        // Name search
        if (name) {
            const keywords = name.trim().split(' ');
            const nameConditions = keywords.map(keyword => ({
                name: {
                    [Op.iLike]: `%${keyword}%`
                }
            }));
            
            whereConditions[Op.or] = [
                { [Op.or]: nameConditions },
                {
                    '$tags.tag$': {
                        [Op.iLike]: `%${name}%`
                    }
                },
                {
                    '$cuisines.name$': {
                        [Op.iLike]: `%${name}%`
                    }
                }
            ];
        }
        
        // Price filters
        if (minPrice !== null && maxPrice !== null) {
            whereConditions.price = {
                [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)]
            };
        } else if (maxPrice !== null) {
            whereConditions.price = {
                [Op.lte]: parseFloat(maxPrice)
            };
        } else if (minPrice !== null) {
            whereConditions.price = {
                [Op.gte]: parseFloat(minPrice)
            };
        }
        
        // Category filter
        if (categoryId) {
            const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId];
            const categoryConditions = categoryIds.map(id => ({
                category_ids: {
                    [Op.contains]: [{ id: id.toString() }]
                }
            }));
            
            if (whereConditions[Op.or]) {
                whereConditions[Op.and] = [
                    { [Op.or]: whereConditions[Op.or] },
                    { [Op.or]: categoryConditions }
                ];
                delete whereConditions[Op.or];
            } else {
                whereConditions[Op.or] = categoryConditions;
            }
        }
        
        // Build includes
        const includeArray = [
            {
                model: BranchProduct,
                as: 'branch_product',
                include: [
                    {
                        model: Branch,
                        as: 'branch',
                        where: { status: 1 }
                    }
                ],
                where: { is_available: 1 }
            },
            {
                model: Review,
                as: 'rating',
                attributes: ['rating', 'comment', 'customer_id', 'created_at']
            },
            {
                model: ProductTag,
                as: 'tags',
                attributes: ['tag'],
                required: false
            }
        ];
        
        // Add cuisine include if needed
        if (cuisineId || (name && name.trim())) {
            includeArray.push({
                model: Cuisine,
                as: 'cuisines',
                attributes: ['id', 'name'],
                required: false,
                where: cuisineId ? {
                    id: Array.isArray(cuisineId) ? cuisineId : [cuisineId]
                } : undefined
            });
        }
        
        // Build order clause
        let orderClause = [['created_at', 'DESC']]; // Default sorting
        
        switch (sortBy) {
            case 'new_arrival':
                orderClause = [['created_at', 'DESC']];
                break;
            case 'popular':
                orderClause = [['popularity_count', 'DESC']];
                break;
            case 'price_high_to_low':
                orderClause = [['price', 'DESC']];
                break;
            case 'price_low_to_high':
                orderClause = [['price', 'ASC']];
                break;
            case 'a_to_z':
                orderClause = [['name', 'ASC']];
                break;
            case 'z_to_a':
                orderClause = [['name', 'DESC']];
                break;
            default:
                if (name) {
                    // Custom relevance ordering for search
                    orderClause = [
                        ['name', 'ASC'], // This would need custom SQL for exact relevance matching
                        ['created_at', 'DESC']
                    ];
                }
                break;
        }
        
        // Get products matching rating criteria
        let ratingProductIds = [];
        if (rating !== null) {
            const ratingQuery = `
                SELECT product_id 
                FROM reviews 
                WHERE rating >= :rating 
                GROUP BY product_id 
                HAVING AVG(rating) >= :rating
            `;
            
            const ratingResults = await sequelize.query(ratingQuery, {
                replacements: { rating: parseFloat(rating) },
                type: sequelize.QueryTypes.SELECT
            });
            
            ratingProductIds = ratingResults.map(result => result.product_id);
            
            if (ratingProductIds.length === 0) {
                return {
                    total_size: 0,
                    limit: searchLimit,
                    offset: searchOffset,
                    products: []
                };
            }
            
            whereConditions.id = {
                [Op.in]: ratingProductIds
            };
        }
        
        const { count, rows } = await Product.findAndCountAll({
            where: whereConditions,
            include: includeArray,
            order: orderClause,
            limit: searchLimit,
            offset: (searchOffset - 1) * searchLimit,
            distinct: true
        });
        
        const formattedProducts = await productDataFormatting(rows.map(row => row.toJSON()), true);
        
        return {
            total_size: count,
            limit: searchLimit,
            offset: searchOffset,
            products: formattedProducts
        };
    } catch (error) {
        console.error('Error searching products:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            products: []
        };
    }
};

/**
 * Get product reviews
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Array of reviews
 */
const getProductReviews = async (productId) => {
    try {
        const reviews = await Review.findAll({
            where: { product_id: productId },
            include: [
                {
                    model: User,
                    as: 'customer',
                    attributes: ['id', 'f_name', 'l_name', 'image']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        
        return reviews.map(review => review.toJSON());
    } catch (error) {
        console.error('Error getting product reviews:', error);
        return [];
    }
};

/**
 * Get rating statistics for reviews
 * @param {Array} reviews - Array of review objects
 * @returns {Object} Rating statistics
 */
const getRating = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        return {
            total_size: 0,
            average: 0,
            five_star: 0,
            four_star: 0,
            three_star: 0,
            two_star: 0,
            one_star: 0
        };
    }
    
    const ratingCounts = {
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
    };
    
    let totalRating = 0;
    
    reviews.forEach(review => {
        const rating = parseInt(review.rating) || 0;
        totalRating += rating;
        
        switch (rating) {
            case 5:
                ratingCounts.five_star++;
                break;
            case 4:
                ratingCounts.four_star++;
                break;
            case 3:
                ratingCounts.three_star++;
                break;
            case 2:
                ratingCounts.two_star++;
                break;
            case 1:
                ratingCounts.one_star++;
                break;
        }
    });
    
    const average = reviews.length > 0 ? (totalRating / reviews.length).toFixed(2) : 0;
    
    return {
        total_size: reviews.length,
        average: parseFloat(average),
        ...ratingCounts
    };
};

/**
 * Get overall rating for a product
 * @param {Array} reviews - Array of review objects
 * @returns {number} Overall rating
 */
const getOverallRating = (reviews) => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        return 0;
    }
    
    const totalRating = reviews.reduce((sum, review) => {
        return sum + (parseInt(review.rating) || 0);
    }, 0);
    
    return parseFloat((totalRating / reviews.length).toFixed(2));
};

/**
 * Get recommended products
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @param {string} name - Search term
 * @returns {Promise<Object>} Recommended products
 */
const getRecommendedProducts = async (limit = 10, offset = 1, name = '') => {
    try {
        // Implementation based on popularity, rating, and recent orders
        const whereConditions = {
            status: 1,
            popularity_count: {
                [Op.gt]: 0
            }
        };
        
        // Name search
        if (name) {
            const keywords = name.trim().split(' ');
            const nameConditions = keywords.map(keyword => ({
                name: {
                    [Op.iLike]: `%${keyword}%`
                }
            }));
            
            whereConditions[Op.or] = nameConditions;
        }
        
        const { count, rows } = await Product.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                }
            ],
            order: [
                ['popularity_count', 'DESC'],
                ['created_at', 'DESC']
            ],
            limit: limit || 10,
            offset: ((offset || 1) - 1) * (limit || 10),
            distinct: true
        });
        
        const formattedProducts = await productDataFormatting(rows.map(row => row.toJSON()), true);
        
        return {
            total_size: count,
            limit: limit || 10,
            offset: offset || 1,
            products: formattedProducts
        };
    } catch (error) {
        console.error('Error getting recommended products:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            products: []
        };
    }
};

/**
 * Get frequently bought products
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @returns {Promise<Object>} Frequently bought products
 */
const getFrequentlyBoughtProducts = async (limit = 10, offset = 1) => {
    try {
        // Implementation based on order frequency
        const { count, rows } = await Product.findAndCountAll({
            where: {
                status: 1,
                order_count: {
                    [Op.gt]: 0
                }
            },
            include: [
                {
                    model: BranchProduct,
                    as: 'branch_product',
                    include: [
                        {
                            model: Branch,
                            as: 'branch',
                            where: { status: 1 }
                        }
                    ],
                    where: { is_available: 1 }
                },
                {
                    model: Review,
                    as: 'rating',
                    attributes: ['rating', 'comment', 'customer_id', 'created_at']
                }
            ],
            order: [
                ['order_count', 'DESC'],
                ['created_at', 'DESC']
            ],
            limit: limit || 10,
            offset: ((offset || 1) - 1) * (limit || 10),
            distinct: true
        });
        
        const formattedProducts = await productDataFormatting(rows.map(row => row.toJSON()), true);
        
        return {
            total_size: count,
            limit: limit || 10,
            offset: offset || 1,
            products: formattedProducts
        };
    } catch (error) {
        console.error('Error getting frequently bought products:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            products: []
        };
    }
};

module.exports = {
    getProduct,
    getLatestProducts,
    getWishlistedProducts,
    getPopularProducts,
    getRelatedProducts,
    searchProducts,
    getProductReviews,
    getRating,
    getOverallRating,
    getRecommendedProducts,
    getFrequentlyBoughtProducts
}; 