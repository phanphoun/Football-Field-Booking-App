/**
 * Standardized API Response Class
 * Ensures consistent response format across all endpoints
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Send standardized success response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Response message
 * @returns {Response}
 */
const sendSuccess = (res, statusCode, data, message = 'Success') => {
  return res.status(statusCode).json(
    new ApiResponse(statusCode, data, message)
  );
};

/**
 * Send standardized error response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Array of validation errors (optional)
 * @returns {Response}
 */
const sendError = (res, statusCode, message, errors = []) => {
  const response = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response with metadata
 * @param {Response} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Response message
 * @returns {Response}
 */
const sendPaginated = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  ApiResponse,
  sendSuccess,
  sendError,
  sendPaginated
};
