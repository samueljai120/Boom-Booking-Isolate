import { getApiBaseUrl } from '../utils/apiConfig';

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Override the mock API detection
export const FORCE_REAL_API = true;
