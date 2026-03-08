/**
 * Pagination utilities for consistent pagination across all endpoints
 */

/**
 * Parse and validate pagination parameters from request
 * @param {number} page - Requested page number (default: 1)
 * @param {number} limit - Items per page (default: 50, max: 100)
 * @returns {Object} - { page, limit, offset }
 */
const getPaginationParams = (page = 1, limit = 50) => {
  let validPage = Math.max(1, parseInt(page) || 1);
  let validLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));

  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit
  };
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} - Pagination metadata
 */
const calculatePaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null
  };
};

/**
 * Build paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @param {string} message - Response message
 * @returns {Object} - Paginated response object
 */
const buildPaginatedResponse = (data, page, limit, total, message = 'Success') => {
  return {
    success: true,
    data,
    pagination: calculatePaginationMeta(page, limit, total),
    message,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  getPaginationParams,
  calculatePaginationMeta,
  buildPaginatedResponse
};
