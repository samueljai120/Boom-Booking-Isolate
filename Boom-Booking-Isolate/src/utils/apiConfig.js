// Utility function to get API base URL from environment variables
export const getApiBaseUrl = () => {
  // Check for production backend URL first
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're in production (Vercel deployment)
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    // Use Vercel API routes (same domain)
    return '/api';
  }
  
  // Development - use direct backend URL on port 3000
  return 'http://localhost:3000/api';
};

// Utility function to get WebSocket URL from environment variables
export const getWebSocketUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    // Use same domain for WebSocket (Vercel doesn't support WebSocket, so disable for now)
    return '';
  }
  
  return 'http://localhost:3000';
};
