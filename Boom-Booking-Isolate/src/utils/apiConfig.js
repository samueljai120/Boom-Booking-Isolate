// Utility function to get API base URL from environment variables
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
};

// Utility function to get WebSocket URL from environment variables
export const getWebSocketUrl = () => {
  return import.meta.env.VITE_WS_URL || 'http://localhost:5001';
};
