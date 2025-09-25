/**
 * Standardized API Response Utilities
 * 
 * Ensures consistent API response formats across all endpoints
 * and provides proper error handling.
 */

/**
 * Standard success response format
 */
export const createSuccessResponse = (data, message = null) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

/**
 * Standard error response format
 */
export const createErrorResponse = (error, code = null, details = null) => ({
  success: false,
  error: typeof error === 'string' ? error : error.message || 'An error occurred',
  code: code || 'UNKNOWN_ERROR',
  details,
  timestamp: new Date().toISOString()
});

/**
 * Standard validation error response format
 */
export const createValidationErrorResponse = (errors) => ({
  success: false,
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  details: errors,
  timestamp: new Date().toISOString()
});

/**
 * Standard authentication error response
 */
export const createAuthErrorResponse = (message = 'Authentication required') => ({
  success: false,
  error: message,
  code: 'AUTHENTICATION_ERROR',
  timestamp: new Date().toISOString()
});

/**
 * Standard authorization error response
 */
export const createAuthzErrorResponse = (message = 'Insufficient permissions') => ({
  success: false,
  error: message,
  code: 'AUTHORIZATION_ERROR',
  timestamp: new Date().toISOString()
});

/**
 * Standard not found error response
 */
export const createNotFoundResponse = (resource = 'Resource') => ({
  success: false,
  error: `${resource} not found`,
  code: 'NOT_FOUND',
  timestamp: new Date().toISOString()
});

/**
 * Standard conflict error response
 */
export const createConflictResponse = (message = 'Resource conflict') => ({
  success: false,
  error: message,
  code: 'CONFLICT',
  timestamp: new Date().toISOString()
});

/**
 * Standard rate limit error response
 */
export const createRateLimitResponse = (message = 'Rate limit exceeded') => ({
  success: false,
  error: message,
  code: 'RATE_LIMIT_EXCEEDED',
  timestamp: new Date().toISOString()
});

/**
 * Standard server error response
 */
export const createServerErrorResponse = (message = 'Internal server error') => ({
  success: false,
  error: message,
  code: 'INTERNAL_SERVER_ERROR',
  timestamp: new Date().toISOString()
});

/**
 * Validate response format
 */
export const validateResponseFormat = (response) => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  // Check required fields
  const hasRequiredFields = response.hasOwnProperty('success') && 
                           response.hasOwnProperty('timestamp');

  // Check success field type
  const hasValidSuccess = typeof response.success === 'boolean';

  // Check data field (should exist for success responses)
  const hasValidData = response.success ? 
    response.hasOwnProperty('data') : 
    response.hasOwnProperty('error');

  return hasRequiredFields && hasValidSuccess && hasValidData;
};

/**
 * Extract error message from response
 */
export const extractErrorMessage = (response) => {
  if (!response) return 'Unknown error';
  if (typeof response === 'string') return response;
  if (response.error) return response.error;
  if (response.message) return response.message;
  return 'An error occurred';
};

/**
 * Extract data from response
 */
export const extractData = (response) => {
  if (!response) return null;
  if (response.success && response.data !== undefined) return response.data;
  return null;
};

/**
 * Check if response is successful
 */
export const isSuccessResponse = (response) => {
  return response && response.success === true;
};

/**
 * Check if response is an error
 */
export const isErrorResponse = (response) => {
  return !response || response.success === false;
};

export default {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  createAuthzErrorResponse,
  createNotFoundResponse,
  createConflictResponse,
  createRateLimitResponse,
  createServerErrorResponse,
  validateResponseFormat,
  extractErrorMessage,
  extractData,
  isSuccessResponse,
  isErrorResponse
};
