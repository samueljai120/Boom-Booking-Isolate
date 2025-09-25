/**
 * Test Environment Utilities
 * 
 * Provides environment-aware implementations for testing contexts
 * where browser APIs like localStorage are not available.
 */

// Mock localStorage for Node.js testing environment
const mockLocalStorage = {
  data: new Map(),
  getItem(key) {
    return this.data.get(key) || null;
  },
  setItem(key, value) {
    this.data.set(key, String(value));
  },
  removeItem(key) {
    this.data.delete(key);
  },
  clear() {
    this.data.clear();
  }
};

// Environment detection
export const isNodeEnvironment = () => {
  return typeof window === 'undefined' || typeof localStorage === 'undefined';
};

// Environment-aware localStorage
export const getStorage = () => {
  if (isNodeEnvironment()) {
    return mockLocalStorage;
  }
  return localStorage;
};

// Environment-aware API base URL
export const getApiBaseUrl = () => {
  if (isNodeEnvironment()) {
    // For testing, use localhost or test server
    return process.env.TEST_API_BASE_URL || 'http://localhost:3000/api';
  }
  
  // For browser environment, use the configured base URL
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
};

// Mock fetch for testing if needed
export const getFetch = () => {
  if (isNodeEnvironment() && typeof fetch === 'undefined') {
    // Use node-fetch if available in Node.js environment
    try {
      return require('node-fetch');
    } catch (error) {
      console.warn('node-fetch not available, using mock fetch');
      return createMockFetch();
    }
  }
  return fetch;
};

// Create mock fetch for testing
const createMockFetch = () => {
  return async (url, options = {}) => {
    console.log(`Mock fetch: ${options.method || 'GET'} ${url}`);
    
    // Return mock successful response
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      json: async () => ({ success: true, data: [] }),
      text: async () => 'Mock response'
    };
  };
};

// Environment-aware console logging
export const getLogger = () => {
  if (isNodeEnvironment()) {
    return console;
  }
  return console;
};

export default {
  isNodeEnvironment,
  getStorage,
  getApiBaseUrl,
  getFetch,
  getLogger
};
