// Simple fetch-based HTTP client to replace axios
class FetchClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  async request(url, options = {}) {
    let fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Add tenant parameter to URL if not already present
    const currentTenant = localStorage.getItem('currentTenant');
    if (currentTenant && !url.includes('tenant=')) {
      try {
        const tenant = JSON.parse(currentTenant);
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl += `${separator}tenant=${tenant.slug}`;
      } catch (error) {
        console.error('Error parsing current tenant:', error);
      }
    }
    
    const config = {
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      },
      ...options
    };

    // Add auth token if available and valid
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      // Validate token format before sending
      const tokenParts = token.split('.');
      if (tokenParts.length === 3 || token.startsWith('mock-jwt-token-')) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ Invalid token format detected, skipping authorization header');
      }
    }

    // Add tenant context header
    if (currentTenant) {
      try {
        const tenant = JSON.parse(currentTenant);
        config.headers['X-Tenant-ID'] = tenant.id;
        config.headers['X-Tenant-Slug'] = tenant.slug;
      } catch (error) {
        console.error('Error adding tenant headers:', error);
      }
    }

    try {
      const response = await fetch(fullUrl, config);
      
      // Parse JSON response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.log('🔐 Authentication failed, clearing stored auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
        
        // Try to parse error response for better error messages
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = typeof data === 'string' ? JSON.parse(data) : data;
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Use default error message if parsing fails
        }
        
        // Create error with status code for better handling
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        throw error;
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

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

export default FetchClient;
