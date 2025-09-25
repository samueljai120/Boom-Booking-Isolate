// Authentication utility functions

/**
 * Clear all stored authentication data
 * This is useful when there are invalid tokens stored
 */
export const clearStoredAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('currentTenant');
  console.log('🧹 Cleared all stored authentication data');
};

/**
 * Check if a token is a mock token
 */
export const isMockToken = (token) => {
  return token && token.startsWith('mock-jwt-token-');
};

/**
 * Check if a token is a valid JWT token format
 */
export const isValidJWTFormat = (token) => {
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return false;
  }
  
  // Basic JWT format validation (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if parts are valid base64
  try {
    parts.forEach(part => {
      if (part.length === 0) throw new Error('Empty part');
      // Basic base64 validation
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a token is valid (either mock or JWT)
 */
export const isValidToken = (token) => {
  return isMockToken(token) || isValidJWTFormat(token);
};

/**
 * Force clear auth and reload the page
 * This is useful for development when there are auth issues
 */
export const forceAuthReset = () => {
  clearStoredAuth();
  window.location.reload();
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  window.clearStoredAuth = clearStoredAuth;
  window.forceAuthReset = forceAuthReset;
}
