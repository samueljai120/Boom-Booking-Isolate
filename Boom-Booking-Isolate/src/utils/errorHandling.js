/**
 * Error Handling Utilities
 * Provides consistent error handling across the application
 */

/**
 * API Error Types
 */
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Parse API error response
 * @param {Error|Response} error - Error object or response
 * @returns {Object} Parsed error information
 */
export const parseApiError = (error) => {
  const baseError = {
    type: ERROR_TYPES.UNKNOWN_ERROR,
    severity: ERROR_SEVERITY.MEDIUM,
    message: 'An unexpected error occurred',
    details: null,
    timestamp: new Date().toISOString()
  };

  // Network errors
  if (!navigator.onLine) {
    return {
      ...baseError,
      type: ERROR_TYPES.NETWORK_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      message: 'No internet connection. Please check your network and try again.',
      details: { offline: true }
    };
  }

  // Fetch/HTTP errors
  if (error instanceof Response) {
    const status = error.status;
    let type = ERROR_TYPES.SERVER_ERROR;
    let severity = ERROR_SEVERITY.MEDIUM;
    let message = 'Server error occurred';

    switch (true) {
      case status >= 400 && status < 500:
        if (status === 401) {
          type = ERROR_TYPES.AUTHENTICATION_ERROR;
          severity = ERROR_SEVERITY.HIGH;
          message = 'Authentication required. Please log in again.';
        } else if (status === 403) {
          type = ERROR_TYPES.AUTHORIZATION_ERROR;
          severity = ERROR_SEVERITY.HIGH;
          message = 'You do not have permission to perform this action.';
        } else if (status === 404) {
          type = ERROR_TYPES.NOT_FOUND_ERROR;
          severity = ERROR_SEVERITY.MEDIUM;
          message = 'The requested resource was not found.';
        } else if (status === 422) {
          type = ERROR_TYPES.VALIDATION_ERROR;
          severity = ERROR_SEVERITY.MEDIUM;
          message = 'Please check your input and try again.';
        } else {
          type = ERROR_TYPES.VALIDATION_ERROR;
          severity = ERROR_SEVERITY.MEDIUM;
          message = 'Invalid request. Please check your input.';
        }
        break;
      case status >= 500:
        type = ERROR_TYPES.SERVER_ERROR;
        severity = ERROR_SEVERITY.HIGH;
        message = 'Server error. Please try again later.';
        break;
      default:
        type = ERROR_TYPES.UNKNOWN_ERROR;
        severity = ERROR_SEVERITY.MEDIUM;
        message = 'An unexpected error occurred.';
    }

    return {
      ...baseError,
      type,
      severity,
      message,
      details: { status, statusText: error.statusText }
    };
  }

  // JavaScript errors
  if (error instanceof Error) {
    let type = ERROR_TYPES.UNKNOWN_ERROR;
    let severity = ERROR_SEVERITY.MEDIUM;
    let message = error.message || 'An unexpected error occurred';

    // Parse common error patterns
    if (error.message.includes('fetch')) {
      type = ERROR_TYPES.NETWORK_ERROR;
      severity = ERROR_SEVERITY.HIGH;
      message = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('JSON')) {
      type = ERROR_TYPES.SERVER_ERROR;
      severity = ERROR_SEVERITY.MEDIUM;
      message = 'Invalid response from server. Please try again.';
    } else if (error.message.includes('timeout')) {
      type = ERROR_TYPES.NETWORK_ERROR;
      severity = ERROR_SEVERITY.HIGH;
      message = 'Request timed out. Please try again.';
    }

    return {
      ...baseError,
      type,
      severity,
      message,
      details: { 
        name: error.name, 
        stack: error.stack,
        cause: error.cause 
      }
    };
  }

  // String errors
  if (typeof error === 'string') {
    return {
      ...baseError,
      message: error,
      details: { originalError: error }
    };
  }

  return baseError;
};

/**
 * Handle API error with user-friendly message
 * @param {Error|Response} error - Error to handle
 * @param {Object} options - Handling options
 * @returns {Object} Error information for display
 */
export const handleApiError = (error, options = {}) => {
  const {
    fallbackMessage = 'Something went wrong. Please try again.',
    showToast = true,
    logError = true
  } = options;

  const parsedError = parseApiError(error);
  
  // Log error for debugging
  if (logError) {
    console.error('API Error:', {
      type: parsedError.type,
      severity: parsedError.severity,
      message: parsedError.message,
      details: parsedError.details,
      originalError: error
    });
  }

  // Show toast notification
  if (showToast && typeof window !== 'undefined' && window.toast) {
    const { toast } = window;
    if (parsedError.severity === ERROR_SEVERITY.CRITICAL || parsedError.severity === ERROR_SEVERITY.HIGH) {
      toast.error(parsedError.message);
    } else {
      toast.error(parsedError.message);
    }
  }

  return {
    ...parsedError,
    message: parsedError.message || fallbackMessage
  };
};

/**
 * Safe async function wrapper with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const handledError = handleApiError(error, options);
      throw handledError;
    }
  };
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves with function result
 */
export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      const parsedError = parseApiError(error);
      if (parsedError.type === ERROR_TYPES.AUTHENTICATION_ERROR || 
          parsedError.type === ERROR_TYPES.AUTHORIZATION_ERROR ||
          parsedError.type === ERROR_TYPES.VALIDATION_ERROR) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missing = [];
  const invalid = [];

  for (const field of requiredFields) {
    const value = data[field];
    
    if (value === undefined || value === null) {
      missing.push(field);
    } else if (typeof value === 'string' && value.trim() === '') {
      missing.push(field);
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(field);
    }
  }

  return {
    isValid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    message: missing.length > 0 
      ? `Missing required fields: ${missing.join(', ')}`
      : invalid.length > 0 
        ? `Invalid fields: ${invalid.join(', ')}`
        : null
  };
};

/**
 * Create error boundary component props
 * @param {Function} onError - Error callback
 * @returns {Object} Error boundary props
 */
export const createErrorBoundaryProps = (onError) => ({
  onError: (error, errorInfo) => {
    const handledError = handleApiError(error, { showToast: false });
    console.error('Error Boundary caught error:', {
      error: handledError,
      errorInfo,
      componentStack: errorInfo.componentStack
    });
    
    if (onError) {
      onError(handledError, errorInfo);
    }
  }
});
