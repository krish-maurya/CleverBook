/**
 * Standardized API response format
 */

export function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
}

export function errorResponse(res, message = 'An error occurred', statusCode = 500, data = null) {
  return res.status(statusCode).json({
    success: false,
    data,
    message
  });
}

export function paginatedResponse(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    message
  });
}

export default {
  successResponse,
  errorResponse,
  paginatedResponse
};
