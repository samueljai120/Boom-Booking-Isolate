/**
 * API Contract Validation Utilities
 * 
 * Provides validation and monitoring for API response structures
 * to prevent data structure mismatches and infinite loops.
 */

/**
 * API Response Contract Definitions
 */
export const API_CONTRACTS = {
  bookings: {
    expectedStructure: {
      success: 'boolean',
      data: 'array'
    },
    nestedStructure: {
      success: 'boolean',
      data: {
        bookings: 'array',
        total: 'number'
      }
    },
    errorStructure: {
      success: 'boolean',
      error: 'string',
      message: 'string'
    }
  },
  rooms: {
    expectedStructure: {
      success: 'boolean',
      data: 'array'
    },
    errorStructure: {
      success: 'boolean',
      error: 'string',
      message: 'string'
    }
  },
  businessHours: {
    expectedStructure: {
      success: 'boolean',
      data: 'array'
    },
    errorStructure: {
      success: 'boolean',
      error: 'string',
      message: 'string'
    }
  }
};

/**
 * Validate API response against contract
 * 
 * @param {Object} response - API response to validate
 * @param {string} endpoint - API endpoint name (bookings, rooms, etc.)
 * @returns {Object} Validation result
 */
export const validateApiContract = (response, endpoint) => {
  const result = {
    isValid: false,
    hasError: false,
    structure: 'unknown',
    message: '',
    warnings: [],
    contract: endpoint
  };

  if (!response) {
    result.message = 'Response is null or undefined';
    return result;
  }

  const contract = API_CONTRACTS[endpoint];
  if (!contract) {
    result.message = `No contract defined for endpoint: ${endpoint}`;
    return result;
  }

  // Check for error structure
  if (response.success === false) {
    result.hasError = true;
    result.structure = 'error';
    result.isValid = true; // Error responses are valid
    result.message = 'Error response received';
    return result;
  }

  // Check for expected structure
  if (response.success === true && Array.isArray(response.data)) {
    result.isValid = true;
    result.structure = 'expected';
    result.message = 'Response matches expected structure';
    return result;
  }

  // Check for nested structure
  if (response.success === true && 
      response.data && 
      typeof response.data === 'object' && 
      Array.isArray(response.data.bookings)) {
    result.isValid = false; // This is a problematic structure
    result.structure = 'nested';
    result.message = 'Response has nested structure that can cause infinite loops';
    result.warnings.push('Nested structure detected - frontend may not handle this correctly');
    return result;
  }

  // Check for unexpected structure
  result.structure = 'unexpected';
  result.message = 'Response structure does not match any known contract';
  result.warnings.push('Unexpected response structure detected');

  return result;
};

/**
 * Monitor API responses and log contract violations
 * 
 * @param {Object} response - API response to monitor
 * @param {string} endpoint - API endpoint name
 * @param {string} componentName - Name of the component making the request
 */
export const monitorApiContract = (response, endpoint, componentName = 'Unknown') => {
  const validation = validateApiContract(response, endpoint);
  
  if (!validation.isValid) {
    console.warn(`🚨 API Contract Violation in ${componentName}:`, {
      endpoint,
      structure: validation.structure,
      message: validation.message,
      warnings: validation.warnings,
      response: response
    });
  }

  return validation;
};

/**
 * Create API contract middleware for React Query
 * 
 * @param {string} endpoint - API endpoint name
 * @param {string} componentName - Component name for logging
 * @returns {Function} Middleware function
 */
export const createApiContractMiddleware = (endpoint, componentName) => {
  return (response) => {
    monitorApiContract(response, endpoint, componentName);
    return response;
  };
};

/**
 * Validate multiple API responses
 * 
 * @param {Object} responses - Object with endpoint names as keys and responses as values
 * @returns {Object} Validation results for all endpoints
 */
export const validateAllApiContracts = (responses) => {
  const results = {};
  
  Object.keys(responses).forEach(endpoint => {
    results[endpoint] = validateApiContract(responses[endpoint], endpoint);
  });

  return results;
};

/**
 * Generate API contract report
 * 
 * @param {Object} validationResults - Results from validateAllApiContracts
 * @returns {Object} Formatted report
 */
export const generateContractReport = (validationResults) => {
  const report = {
    totalEndpoints: Object.keys(validationResults).length,
    validEndpoints: 0,
    invalidEndpoints: 0,
    errorEndpoints: 0,
    warnings: [],
    violations: []
  };

  Object.keys(validationResults).forEach(endpoint => {
    const result = validationResults[endpoint];
    
    if (result.hasError) {
      report.errorEndpoints++;
    } else if (result.isValid) {
      report.validEndpoints++;
    } else {
      report.invalidEndpoints++;
      report.violations.push({
        endpoint,
        structure: result.structure,
        message: result.message,
        warnings: result.warnings
      });
    }
    
    if (result.warnings.length > 0) {
      report.warnings.push(...result.warnings.map(warning => ({
        endpoint,
        warning
      })));
    }
  });

  return report;
};

export default {
  API_CONTRACTS,
  validateApiContract,
  monitorApiContract,
  createApiContractMiddleware,
  validateAllApiContracts,
  generateContractReport
};
