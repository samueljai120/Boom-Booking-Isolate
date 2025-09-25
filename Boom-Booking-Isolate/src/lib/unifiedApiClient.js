/**
 * Unified API Client - Simplified and Consistent API Layer
 * 
 * This replaces the complex fallback system with a clean, consistent API client
 * that handles errors gracefully and provides a uniform interface.
 */

import { getApiBaseUrl } from '../utils/apiConfig.js';
import { getStorage, getApiBaseUrl as getTestApiBaseUrl, isNodeEnvironment } from '../utils/testEnvironment.js';

// API Configuration
const API_BASE_URL = isNodeEnvironment() ? getTestApiBaseUrl() : getApiBaseUrl();
const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Request/Response interceptor types
const InterceptorType = {
  REQUEST: 'request',
  RESPONSE: 'response'
};

/**
 * Unified API Client Class
 */
class UnifiedApiClient {
  constructor(baseURL = API_BASE_URL, options = {}) {
    this.baseURL = baseURL;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.interceptors = {
      request: [],
      response: []
    };
    
    // Add default interceptors
    this._addDefaultInterceptors();
  }

  /**
   * Add request/response interceptors
   */
  addInterceptor(type, interceptor) {
    if (!this.interceptors[type]) {
      this.interceptors[type] = [];
    }
    this.interceptors[type].push(interceptor);
  }

  /**
   * Add default interceptors for authentication and error handling
   */
  _addDefaultInterceptors() {
    // Request interceptor - Add auth token
    this.addInterceptor(InterceptorType.REQUEST, (config) => {
      const storage = getStorage();
      const token = storage.getItem('authToken');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      // Add tenant context if available
      const currentTenant = storage.getItem('currentTenant');
      if (currentTenant) {
        try {
          const tenant = JSON.parse(currentTenant);
          config.headers = {
            ...config.headers,
            'X-Tenant-ID': tenant.id
          };
        } catch (error) {
          // If parsing fails, try using the value directly
          config.headers = {
            ...config.headers,
            'X-Tenant-ID': currentTenant
          };
        }
      }
      
      return config;
    });

    // Response interceptor - Handle errors
    this.addInterceptor(InterceptorType.RESPONSE, (response) => {
      // Handle authentication errors
      if (response.status === 401) {
        // Auth failure logging is now filtered in main.jsx
        console.log('🔐 Authentication failed, clearing stored auth data');
        const storage = getStorage();
        storage.removeItem('authToken');
        storage.removeItem('user');
        
        // Only redirect in browser environment
        if (!isNodeEnvironment() && typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      return response;
    });
  }

  /**
   * Apply request interceptors
   */
  _applyRequestInterceptors(config) {
    return this.interceptors.request.reduce((acc, interceptor) => {
      return interceptor(acc);
    }, config);
  }

  /**
   * Apply response interceptors
   */
  _applyResponseInterceptors(response) {
    return this.interceptors.response.reduce((acc, interceptor) => {
      return interceptor(acc);
    }, response);
  }

  /**
   * Make HTTP request with consistent error handling
   */
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Prepare request config
    let config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout),
      ...options
    };

    // Apply request interceptors
    config = this._applyRequestInterceptors(config);

    try {
      // API request logging is now filtered in main.jsx
      console.log(`🌐 API Request: ${config.method} ${fullUrl}`);
      
      const response = await fetch(fullUrl, config);
      
      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Create response object
      const responseObj = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: response.ok
      };

      // Apply response interceptors
      const processedResponse = this._applyResponseInterceptors(responseObj);

      if (!response.ok) {
        // Create error with response data
        const error = new Error(data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = data;
        throw error;
      }

      return processedResponse;
    } catch (error) {
      // API error logging is now filtered in main.jsx
      console.error('🌐 API Error:', error);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  }

  /**
   * HTTP Methods
   */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  async patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
}

// Create singleton instance
const apiClient = new UnifiedApiClient();

/**
 * Unified API Modules
 */

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getSession: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  demoLogin: async () => {
    return authAPI.login({
      email: 'demo@example.com',
      password: 'demo123'
    });
  }
};

// Rooms API
export const roomsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/rooms?${queryParams}` : '/rooms';
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/rooms', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/rooms/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/rooms/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/rooms/categories/list');
    return response.data;
  }
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/bookings?${queryParams}` : '/bookings';
    const response = await apiClient.get(url);
    // API returns { success: true, data: [...] }, so we need to return the full response
    // response.data is the full API response object
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (data) => {
    // Booking creation logging is now filtered in main.jsx
    console.log('🔍 API Client - Creating booking with data:', data);
    console.log('🔍 API Client - Required fields check:', {
      customer_name: data.customer_name,
      room_id: data.room_id,
      start_time: data.start_time,
      end_time: data.end_time
    });
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/bookings/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/bookings/${id}`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await apiClient.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  move: async (id, data) => {
    const response = await apiClient.put(`/bookings/${id}/move`, data);
    return response.data;
  },

  resize: async (id, data) => {
    const response = await apiClient.put(`/bookings/${id}/resize`, data);
    return response.data;
  }
};

// Business Hours API
export const businessHoursAPI = {
  get: async () => {
    const response = await apiClient.get('/business-hours');
    return response.data;
  },

  update: async (data) => {
    const response = await apiClient.put('/business-hours', data);
    return response.data;
  },

  getExceptions: async () => {
    const response = await apiClient.get('/business-hours/exceptions');
    return response.data;
  },

  createException: async (data) => {
    const response = await apiClient.post('/business-hours/exceptions', data);
    return response.data;
  },

  deleteException: async (id) => {
    const response = await apiClient.delete(`/business-hours/exceptions/${id}`);
    return response.data;
  }
};

// Settings API
export const settingsAPI = {
  get: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  update: async (data) => {
    const response = await apiClient.put('/settings', data);
    return response.data;
  }
};

// Health API
export const healthAPI = {
  check: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  }
};

// Availability API
export const availabilityAPI = {
  get: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `/availability?${queryParams}` : '/availability';
    const response = await apiClient.get(url);
    return response.data;
  }
};

// Export the client instance for custom requests
export { apiClient };

// Default export for backward compatibility
export default {
  authAPI,
  roomsAPI,
  bookingsAPI,
  businessHoursAPI,
  settingsAPI,
  healthAPI,
  availabilityAPI,
  apiClient
};
