/**
 * Category Logic Utilities
 * Converted from PHP CentralLogics/category.php to JavaScript
 */

const { Op } = require('sequelize');
const { Category, Product, BranchProduct, Branch, Review, ProductTag } = require('../models');
const { productDataFormatting } = require('./helpers');
const { PRODUCT_TYPES } = require('./constants');

/**
 * Get parent categories (categories with position 0)
 * @returns {Promise<Array>} Array of parent categories
 */
const getParentCategories = async () => {
    try {
        const parentCategories = await Category.findAll({
            where: { position: 0 },
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
        
        return parentCategories.map(category => category.toJSON());
    } catch (error) {
        console.error('Error getting parent categories:', error);
        return [];
    }
};

/**
 * Get child categories for a parent category
 * @param {number} parentId - Parent category ID
 * @returns {Promise<Array>} Array of child categories
 */
const getChildCategories = async (parentId) => {
    try {
        const childCategories = await Category.findAll({
            where: { parent_id: parentId },
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
        
        return childCategories.map(category => category.toJSON());
    } catch (error) {
        console.error('Error getting child categories:', error);
        return [];
    }
};

/**
 * Get all categories with their hierarchy
 * @returns {Promise<Array>} Array of categories with children
 */
const getCategoriesWithChildren = async () => {
    try {
        const parentCategories = await Category.findAll({
            where: { position: 0 },
            include: [
                {
                    model: Category,
                    as: 'children',
                    required: false,
                    order: [['sort_order', 'ASC'], ['name', 'ASC']]
                }
            ],
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
        
        return parentCategories.map(category => category.toJSON());
    } catch (error) {
        console.error('Error getting categories with children:', error);
        return [];
    }
};

/**
 * Get products by category with filters
 * @param {number} categoryId - Category ID
 * @param {string} type - Product type (veg/non_veg/all)
 * @param {string} name - Search term
 * @param {number} limit - Number of products to return
 * @param {number} offset - Page offset
 * @param {string} sortBy - Sort option
 * @returns {Promise<Object>} Paginated products result
 */
const getCategoryProducts = async (categoryId, type = 'all', name = '', limit = 10, offset = 1, sortBy = 'latest') => {
    try {
        const searchLimit = limit || 10;
        const searchOffset = offset || 1;
        
        // Build where conditions
        const whereConditions = {
            status: 1
        };
        
        // Product type filter
        if (type && type !== 'all') {
            const productType = (type === 'veg') ? PRODUCT_TYPES.VEG : PRODUCT_TYPES.NON_VEG;
            whereConditions.product_type = productType;
        }
        
        // Category filter
        if (categoryId) {
            whereConditions.category_ids = {
                [Op.contains]: [{ id: categoryId.toString() }]
            };
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
            case 'a_to_z':
                orderClause = [['name', 'ASC']];
                break;
            case 'z_to_a':
                orderClause = [['name', 'DESC']];
                break;
            case 'rating':
                orderClause = [['average_rating', 'DESC']];
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
        console.error('Error getting category products:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            products: []
        };
    }
};

/**
 * Get category by ID
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object|null>} Category object or null
 */
const getCategoryById = async (categoryId) => {
    try {
        const category = await Category.findByPk(categoryId, {
            include: [
                {
                    model: Category,
                    as: 'children',
                    required: false,
                    order: [['sort_order', 'ASC'], ['name', 'ASC']]
                },
                {
                    model: Category,
                    as: 'parent',
                    required: false
                }
            ]
        });
        
        return category ? category.toJSON() : null;
    } catch (error) {
        console.error('Error getting category by ID:', error);
        return null;
    }
};

/**
 * Get category with product count
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object|null>} Category with product count
 */
const getCategoryWithProductCount = async (categoryId) => {
    try {
        const category = await Category.findByPk(categoryId);
        
        if (!category) {
            return null;
        }
        
        // Count products in this category
        const productCount = await Product.count({
            where: {
                category_ids: {
                    [Op.contains]: [{ id: categoryId.toString() }]
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
                }
            ]
        });
        
        const categoryData = category.toJSON();
        categoryData.product_count = productCount;
        
        return categoryData;
    } catch (error) {
        console.error('Error getting category with product count:', error);
        return null;
    }
};

/**
 * Get featured categories
 * @param {number} limit - Number of categories to return
 * @returns {Promise<Array>} Array of featured categories
 */
const getFeaturedCategories = async (limit = 10) => {
    try {
        const featuredCategories = await Category.findAll({
            where: { 
                status: 1,
                is_featured: 1
            },
            order: [['sort_order', 'ASC'], ['name', 'ASC']],
            limit: limit || 10
        });
        
        // Get product count for each category
        const categoriesWithCount = await Promise.all(
            featuredCategories.map(async (category) => {
                const productCount = await Product.count({
                    where: {
                        category_ids: {
                            [Op.contains]: [{ id: category.id.toString() }]
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
                        }
                    ]
                });
                
                const categoryData = category.toJSON();
                categoryData.product_count = productCount;
                
                return categoryData;
            })
        );
        
        return categoriesWithCount;
    } catch (error) {
        console.error('Error getting featured categories:', error);
        return [];
    }
};

/**
 * Search categories by name
 * @param {string} searchTerm - Search term
 * @param {number} limit - Number of categories to return
 * @param {number} offset - Page offset
 * @returns {Promise<Object>} Search results
 */
const searchCategories = async (searchTerm, limit = 10, offset = 1) => {
    try {
        const searchLimit = limit || 10;
        const searchOffset = offset || 1;
        
        const whereConditions = {
            status: 1
        };
        
        if (searchTerm) {
            const keywords = searchTerm.trim().split(' ');
            const nameConditions = keywords.map(keyword => ({
                name: {
                    [Op.iLike]: `%${keyword}%`
                }
            }));
            
            whereConditions[Op.or] = nameConditions;
        }
        
        const { count, rows } = await Category.findAndCountAll({
            where: whereConditions,
            order: [['name', 'ASC']],
            limit: searchLimit,
            offset: (searchOffset - 1) * searchLimit
        });
        
        // Get product count for each category
        const categoriesWithCount = await Promise.all(
            rows.map(async (category) => {
                const productCount = await Product.count({
                    where: {
                        category_ids: {
                            [Op.contains]: [{ id: category.id.toString() }]
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
                        }
                    ]
                });
                
                const categoryData = category.toJSON();
                categoryData.product_count = productCount;
                
                return categoryData;
            })
        );
        
        return {
            total_size: count,
            limit: searchLimit,
            offset: searchOffset,
            categories: categoriesWithCount
        };
    } catch (error) {
        console.error('Error searching categories:', error);
        return {
            total_size: 0,
            limit: limit || 10,
            offset: offset || 1,
            categories: []
        };
    }
};

/**
 * Get category breadcrumb
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} Array of breadcrumb items
 */
const getCategoryBreadcrumb = async (categoryId) => {
    try {
        const breadcrumb = [];
        let currentCategory = await Category.findByPk(categoryId);
        
        while (currentCategory) {
            breadcrumb.unshift({
                id: currentCategory.id,
                name: currentCategory.name,
                slug: currentCategory.slug
            });
            
            if (currentCategory.parent_id) {
                currentCategory = await Category.findByPk(currentCategory.parent_id);
            } else {
                currentCategory = null;
            }
        }
        
        return breadcrumb;
    } catch (error) {
        console.error('Error getting category breadcrumb:', error);
        return [];
    }
};

/**
 * Get categories with their subcategories and product counts
 * @returns {Promise<Array>} Array of categories with hierarchy and counts
 */
const getCategoriesWithSubcategoriesAndCounts = async () => {
    try {
        const categories = await Category.findAll({
            where: { 
                status: 1,
                parent_id: null 
            },
            include: [
                {
                    model: Category,
                    as: 'children',
                    where: { status: 1 },
                    required: false,
                    order: [['sort_order', 'ASC'], ['name', 'ASC']]
                }
            ],
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
        
        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const categoryData = category.toJSON();
                
                // Get product count for parent category
                const parentProductCount = await Product.count({
                    where: {
                        category_ids: {
                            [Op.contains]: [{ id: category.id.toString() }]
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
                        }
                    ]
                });
                
                categoryData.product_count = parentProductCount;
                
                // Get product counts for child categories
                if (categoryData.children && categoryData.children.length > 0) {
                    categoryData.children = await Promise.all(
                        categoryData.children.map(async (child) => {
                            const childProductCount = await Product.count({
                                where: {
                                    category_ids: {
                                        [Op.contains]: [{ id: child.id.toString() }]
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
                                    }
                                ]
                            });
                            
                            return {
                                ...child,
                                product_count: childProductCount
                            };
                        })
                    );
                }
                
                return categoryData;
            })
        );
        
        return categoriesWithCounts;
    } catch (error) {
        console.error('Error getting categories with subcategories and counts:', error);
        return [];
    }
};

module.exports = {
    getParentCategories,
    getChildCategories,
    getCategoriesWithChildren,
    getCategoryProducts,
    getCategoryById,
    getCategoryWithProductCount,
    getFeaturedCategories,
    searchCategories,
    getCategoryBreadcrumb,
    getCategoriesWithSubcategoriesAndCounts
}; 