// Utility function to get API base URL from environment variables
export const getApiBaseUrl = () => {
  // Check for production backend URL first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're in production (Vercel deployment)
  if (import.meta.env.PROD) {
    // Try Railway backend URL (you'll need to update this with your actual Railway URL)
    return 'https://boom-booking-backend-production.up.railway.app/api';
  }
  
  // Development fallback
  return 'http://localhost:5001/api';
};

// Utility function to get WebSocket URL from environment variables
export const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  if (import.meta.env.PROD) {
    return 'https://boom-booking-backend-production.up.railway.app';
  }
  
  return 'http://localhost:5001';
};
