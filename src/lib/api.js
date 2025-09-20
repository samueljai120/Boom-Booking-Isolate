import { mockAPI } from './mockData.js';
import axios from 'axios';

// API configuration - switches between mock and real backend based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isMockMode = !API_BASE_URL || API_BASE_URL.includes('your-api-server.com') || API_BASE_URL.includes('localhost');

// API configuration (console.log removed for clean version)

// Create axios instance for real API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to convert frontend business hours format to backend format
const convertToBackendFormat = (businessHours) => {
  return businessHours.map(bh => ({
    day_of_week: bh.weekday,
    open_time: bh.openTime,
    close_time: bh.closeTime,
    is_closed: bh.isClosed || false
  }));
};

// Helper function to convert backend business hours format to frontend format
const convertToFrontendFormat = (backendHours) => {
  return backendHours.map(bh => ({
    weekday: bh.day_of_week,
    openTime: bh.open_time,
    closeTime: bh.close_time,
    isClosed: bh.is_closed || false
  }));
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    if (isMockMode) {
      return mockAPI.login(credentials);
    }
    
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      // console.error('Error logging in:', error);
      throw error;
    }
  },
  
  logout: async () => {
    if (isMockMode) {
      return mockAPI.logout();
    }
    
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      // console.error('Error logging out:', error);
      throw error;
    }
  },
  
  getSession: async () => {
    if (isMockMode) {
      return mockAPI.getSession();
    }
    
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      // console.error('Error getting session:', error);
      throw error;
    }
  },
};

// Rooms API
export const roomsAPI = {
  getAll: (params = {}) => mockAPI.getRooms(params),
  getById: (id) => mockAPI.getRooms().then(response => 
    response.data.find(room => room.id === id)
  ),
  create: (data) => mockAPI.createRoom(data),
  update: (id, data) => mockAPI.updateRoom(id, data),
  delete: (id) => mockAPI.deleteRoom(id),
  getCategories: () => Promise.resolve({ 
    data: ['Standard', 'Premium', 'VIP'] 
  }),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params = {}) => mockAPI.getBookings(params),
  getById: (id) => mockAPI.getBookings().then(response => 
    response.data.find(booking => booking.id === id)
  ),
  create: (data) => mockAPI.createBooking(data),
  update: (id, data) => mockAPI.updateBooking(id, data),
  delete: (id) => mockAPI.deleteBooking(id),
  cancel: (id) => mockAPI.updateBooking(id, { status: 'cancelled' }),
  move: async (data) => {
    
    // Update the source booking
    const sourceResult = await mockAPI.updateBooking(data.bookingId, { 
      roomId: data.newRoomId,
      startTime: data.newTimeIn, 
      endTime: data.newTimeOut,
      timeIn: data.newTimeIn,
      timeOut: data.newTimeOut
    });
    
    // If there's a target booking (swap), update it too
    if (data.targetBookingId && data.targetNewTimeIn && data.targetNewTimeOut) {
      const targetResult = await mockAPI.updateBooking(data.targetBookingId, {
        roomId: data.targetRoomId || data.newRoomId,
        startTime: data.targetNewTimeIn,
        endTime: data.targetNewTimeOut,
        timeIn: data.targetNewTimeIn,
        timeOut: data.targetNewTimeOut
      });
      
      return {
        data: {
          source: sourceResult.data.booking,
          target: targetResult.data.booking,
          type: 'swap'
        }
      };
    }
    
    return {
      data: {
        booking: sourceResult.data.booking,
        type: 'move'
      }
    };
  },
  resize: (data) => mockAPI.updateBooking(data.bookingId, { 
    startTime: data.newStartTime, 
    endTime: data.newEndTime,
    timeIn: data.newStartTime,
    timeOut: data.newEndTime
  }),
};

// Availability API (simplified for mock)
export const availabilityAPI = {
  get: (params = {}) => Promise.resolve({ 
    data: { available: true, message: 'Mock availability data' } 
  }),
  findBest: (params = {}) => Promise.resolve({ 
    data: { roomId: 1, available: true } 
  }),
};

// Business Hours API
export const businessHoursAPI = {
  get: async () => {
    if (isMockMode) {
      return mockAPI.getBusinessHours();
    }
    
    try {
      const response = await apiClient.get('/business-hours');
      
      // Convert backend format to frontend format
      const frontendHours = convertToFrontendFormat(response.data.data || []);
      
      return {
        data: {
          success: true,
          businessHours: frontendHours
        }
      };
    } catch (error) {
      // Error fetching business hours - logging removed for clean version
      
      // Enhanced error logging
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        // Network error details - logging removed for clean version
        
        // Fallback to mock mode for network errors
        return mockAPI.getBusinessHours();
      }
      
      throw error;
    }
  },
  
  update: async (data) => {
    if (isMockMode) {
      return mockAPI.updateBusinessHours(data);
    }
    
    try {
      
      // Convert frontend format to backend format
      const backendHours = convertToBackendFormat(data.businessHours || data);
      
      const response = await apiClient.put('/business-hours', {
        hours: backendHours
      });
      
      // Convert response back to frontend format
      const frontendHours = convertToFrontendFormat(response.data.data || []);
      
      return {
        data: {
          success: true,
          businessHours: frontendHours
        }
      };
    } catch (error) {
      // Error updating business hours - logging removed for clean version
      
      // Enhanced error logging
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        // Network error details - logging removed for clean version
        
        // Fallback to mock mode for network errors
        return mockAPI.updateBusinessHours(data);
      }
      
      throw error;
    }
  },
  
  getExceptions: () => Promise.resolve({ data: [] }),
  createException: (data) => Promise.resolve({ data }),
  deleteException: (id) => Promise.resolve({ data: { message: 'Exception deleted' } }),
};

// Settings API
export const settingsAPI = {
  get: async () => {
    if (isMockMode) {
      return mockAPI.getSettings();
    }
    
    try {
      const response = await apiClient.get('/settings');
      return response.data;
    } catch (error) {
      // console.error('Error fetching settings:', error);
      throw error;
    }
  },
  
  update: async (data) => {
    if (isMockMode) {
      return mockAPI.updateSettings(data);
    }
    
    try {
      const response = await apiClient.put('/settings', data);
      return response.data;
    } catch (error) {
      // console.error('Error updating settings:', error);
      throw error;
    }
  },
};

// Health API
export const healthAPI = {
  check: () => mockAPI.healthCheck(),
};

// Default export for backward compatibility
export default {
  authAPI,
  roomsAPI,
  bookingsAPI,
  availabilityAPI,
  businessHoursAPI,
  settingsAPI,
  healthAPI
};