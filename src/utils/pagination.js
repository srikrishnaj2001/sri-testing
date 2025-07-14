/**
 * Pagination utility for Sequelize queries
 */

/**
 * Generate pagination options for Sequelize queries
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of items per page
 * @returns {Object} - Sequelize pagination options
 */
const paginate = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page
 * @returns {Object} - Pagination metadata
 */
const getPaginationMeta = (total, page = 1, limit = 20) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  
  return {
    total: parseInt(total),
    page: currentPage,
    limit: itemsPerPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    from: total > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
    to: Math.min(currentPage * itemsPerPage, total)
  };
};

/**
 * Format paginated response
 * @param {Array} data - Array of data items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} - Formatted response
 */
const formatPaginatedResponse = (data, pagination) => {
  return {
    data,
    pagination,
    success: true,
    message: `Retrieved ${data.length} items`
  };
};

/**
 * Validate pagination parameters
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} - Validated pagination parameters
 */
const validatePagination = (page, limit, maxLimit = 100) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.max(1, Math.min(maxLimit, parseInt(limit) || 20));
  
  return {
    page: validatedPage,
    limit: validatedLimit
  };
};

module.exports = {
  paginate,
  getPaginationMeta,
  formatPaginatedResponse,
  validatePagination
}; 