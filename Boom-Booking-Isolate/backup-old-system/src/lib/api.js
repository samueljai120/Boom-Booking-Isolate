import { mockAPI } from './mockData.js';
import FetchClient from './fetchClient.js';
import { API_CONFIG, FORCE_REAL_API, FALLBACK_TO_MOCK } from '../config/api.js';

// API configuration - smart fallback system
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL;
let isMockMode = false; // Start with real API, fallback to mock
let apiHealthChecked = false;
let apiHealthy = false;

// API configuration
console.log('🔧 API Mode:', isMockMode ? 'MOCK' : 'REAL', '| Base URL:', API_BASE_URL);

// Health check function with improved error handling and caching
const checkApiHealth = async (forceCheck = false) => {
  // Use cache unless forced to recheck
  if (!forceCheck && apiHealthChecked) return apiHealthy;
  
  try {
    // Standardize health endpoint - use consistent path
    const healthUrl = `${API_BASE_URL}/health`;
    
    const response = await fetch(healthUrl, { 
      method: 'GET',
      headers: API_CONFIG.HEADERS,
      signal: AbortSignal.timeout(5000), // Increased timeout
      cache: 'no-cache' // Prevent caching issues
    });
    
    if (response.ok) {
      apiHealthy = true;
      apiHealthChecked = true;
      console.log('🏥 API Health Check: ✅ HEALTHY via', healthUrl);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    apiHealthy = false;
    apiHealthChecked = true;
    console.log('🏥 API Health Check: ❌ FAILED for', `${API_BASE_URL}/health`, '-', error.message);
    return false;
  }
};

// Create fetch client for real API calls
const apiClient = new FetchClient(API_BASE_URL, API_CONFIG.HEADERS);

// Error handler for fetch responses
const handleApiError = (error) => {
  if (error.status === 403) {
    // Handle token errors
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (import.meta.env.MODE === 'development') {
      console.log('🔑 Token error detected, clearing auth data');
    }
  }
  throw error;
};

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

// Auth API with smart fallback
export const authAPI = {
  login: async (credentials) => {
    // Check if we should use real API first
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for login');
        try {
          const response = await apiClient.post('/auth/login', credentials);
          return response.data;
        } catch (error) {
          console.log('❌ Real API login failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.login(credentials);
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for login');
        return mockAPI.login(credentials);
      }
    }
    
    if (isMockMode) {
      return mockAPI.login(credentials);
    }
    
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.log('❌ Real API login failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.login(credentials);
      }
      throw error;
    }
  },
  
  logout: async () => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for logout');
        try {
          const response = await apiClient.post('/auth/logout');
          return response.data;
        } catch (error) {
          console.log('❌ Real API logout failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.logout();
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for logout');
        return mockAPI.logout();
      }
    }
    
    if (isMockMode) {
      return mockAPI.logout();
    }
    
    try {
      const response = await apiClient.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.log('❌ Real API logout failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.logout();
      }
      throw error;
    }
  },
  
  register: async (userData) => {
    // Check if we should use real API first
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for registration');
        try {
          const response = await apiClient.post('/auth/register', userData);
          return response.data;
        } catch (error) {
          console.log('❌ Real API register failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.register(userData);
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for registration');
        return mockAPI.register(userData);
      }
    }
    
    if (isMockMode) {
      return mockAPI.register(userData);
    }
    
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.log('❌ Real API register failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.register(userData);
      }
      throw error;
    }
  },
  
  getSession: async () => {
    // Check if we should use real API first
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for session check');
        try {
          const response = await apiClient.get('/auth/me');
          return response.data;
        } catch (error) {
          console.log('❌ Real API getSession failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getSession();
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for session check');
        return mockAPI.getSession();
      }
    }
    
    if (isMockMode) {
      return mockAPI.getSession();
    }
    
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.log('❌ Real API getSession failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getSession();
      }
      throw error;
    }
  },
  
  // Demo login for easy testing
  demoLogin: async () => {
    const demoCredentials = {
      email: 'demo@example.com',
      password: 'demo123'
    };
    return authAPI.login(demoCredentials);
  },
};

// Rooms API
export const roomsAPI = {
  getAll: async (params = {}) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for rooms');
        try {
          const response = await apiClient.get('/rooms', { params });
          return response.data;
        } catch (error) {
          console.log('❌ Real API rooms failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getRooms(params);
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for rooms');
        return mockAPI.getRooms(params);
      }
    }
    
    if (isMockMode) {
      return mockAPI.getRooms(params);
    }
    
    try {
      const response = await apiClient.get('/rooms', { params });
      return response.data;
    } catch (error) {
      console.log('❌ Real API rooms failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getRooms(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.get(`/rooms/${id}`);
          return response.data;
        } catch (error) {
          console.log('❌ Real API room by ID failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getRooms().then(response => 
              response.data.find(room => room.id === id)
            );
          }
          throw error;
        }
      } else {
        return mockAPI.getRooms().then(response => 
          response.data.find(room => room.id === id)
        );
      }
    }
    
    if (isMockMode) {
      return mockAPI.getRooms().then(response => 
        response.data.find(room => room.id === id)
      );
    }
    
    try {
      const response = await apiClient.get(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      console.log('❌ Real API room by ID failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getRooms().then(response => 
          response.data.find(room => room.id === id)
        );
      }
      throw error;
    }
  },
  
  create: async (data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.post('/rooms', data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API create room failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.createRoom(data);
          }
          throw error;
        }
      } else {
        return mockAPI.createRoom(data);
      }
    }
    
    if (isMockMode) {
      return mockAPI.createRoom(data);
    }
    
    try {
      const response = await apiClient.post('/rooms', data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API create room failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.createRoom(data);
      }
      throw error;
    }
  },
  
  update: async (id, data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.put(`/rooms/${id}`, data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API update room failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.updateRoom(id, data);
          }
          throw error;
        }
      } else {
        return mockAPI.updateRoom(id, data);
      }
    }
    
    if (isMockMode) {
      return mockAPI.updateRoom(id, data);
    }
    
    try {
      const response = await apiClient.put(`/rooms/${id}`, data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API update room failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.updateRoom(id, data);
      }
      throw error;
    }
  },
  
  delete: async (id) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.delete(`/rooms/${id}`);
          return response.data;
        } catch (error) {
          console.log('❌ Real API delete room failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.deleteRoom(id);
          }
          throw error;
        }
      } else {
        return mockAPI.deleteRoom(id);
      }
    }
    
    if (isMockMode) {
      return mockAPI.deleteRoom(id);
    }
    
    try {
      const response = await apiClient.delete(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      console.log('❌ Real API delete room failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.deleteRoom(id);
      }
      throw error;
    }
  },
  
  getCategories: () => Promise.resolve({ 
    data: ['Standard', 'Premium', 'VIP'] 
  }),
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params = {}) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for bookings');
        try {
          const response = await apiClient.get('/bookings', { params });
          return response.data;
        } catch (error) {
          console.log('❌ Real API bookings failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getBookings(params);
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for bookings');
        return mockAPI.getBookings(params);
      }
    }
    
    if (isMockMode) {
      return mockAPI.getBookings(params);
    }
    
    try {
      const response = await apiClient.get('/bookings', { params });
      return response.data;
    } catch (error) {
      console.log('❌ Real API bookings failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getBookings(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.get(`/bookings/${id}`);
          return response.data;
        } catch (error) {
          console.log('❌ Real API booking by ID failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getBookings().then(response => 
              response.data.find(booking => booking.id === id)
            );
          }
          throw error;
        }
      } else {
        return mockAPI.getBookings().then(response => 
          response.data.find(booking => booking.id === id)
        );
      }
    }
    
    if (isMockMode) {
      return mockAPI.getBookings().then(response => 
        response.data.find(booking => booking.id === id)
      );
    }
    
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.log('❌ Real API booking by ID failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getBookings().then(response => 
          response.data.find(booking => booking.id === id)
        );
      }
      throw error;
    }
  },
  
  create: async (data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.post('/bookings', data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API create booking failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.createBooking(data);
          }
          throw error;
        }
      } else {
        return mockAPI.createBooking(data);
      }
    }
    
    if (isMockMode) {
      return mockAPI.createBooking(data);
    }
    
    try {
      const response = await apiClient.post('/bookings', data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API create booking failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.createBooking(data);
      }
      throw error;
    }
  },
  
  update: async (id, data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.put(`/bookings/${id}`, data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API update booking failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.updateBooking(id, data);
          }
          throw error;
        }
      } else {
        return mockAPI.updateBooking(id, data);
      }
    }
    
    if (isMockMode) {
      return mockAPI.updateBooking(id, data);
    }
    
    try {
      const response = await apiClient.put(`/bookings/${id}`, data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API update booking failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.updateBooking(id, data);
      }
      throw error;
    }
  },
  
  delete: async (id) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.delete(`/bookings/${id}`);
          return response.data;
        } catch (error) {
          console.log('❌ Real API delete booking failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.deleteBooking(id);
          }
          throw error;
        }
      } else {
        return mockAPI.deleteBooking(id);
      }
    }
    
    if (isMockMode) {
      return mockAPI.deleteBooking(id);
    }
    
    try {
      const response = await apiClient.delete(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.log('❌ Real API delete booking failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.deleteBooking(id);
      }
      throw error;
    }
  },
  
  cancel: async (id) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.put(`/bookings/${id}`, { status: 'cancelled' });
          return response.data;
        } catch (error) {
          console.log('❌ Real API cancel booking failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.updateBooking(id, { status: 'cancelled' });
          }
          throw error;
        }
      } else {
        return mockAPI.updateBooking(id, { status: 'cancelled' });
      }
    }
    
    if (isMockMode) {
      return mockAPI.updateBooking(id, { status: 'cancelled' });
    }
    
    try {
      const response = await apiClient.put(`/bookings/${id}`, { status: 'cancelled' });
      return response.data;
    } catch (error) {
      console.log('❌ Real API cancel booking failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.updateBooking(id, { status: 'cancelled' });
      }
      throw error;
    }
  },
  move: async (data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.put(`/bookings/${data.bookingId}/move`, data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API move booking failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            // Fallback to mock implementation
            const sourceResult = await mockAPI.updateBooking(data.bookingId, { 
              roomId: data.newRoomId,
              startTime: data.newTimeIn, 
              endTime: data.newTimeOut,
              timeIn: data.newTimeIn,
              timeOut: data.newTimeOut
            });
            
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
          }
          throw error;
        }
      } else {
        // Use mock implementation when API is unhealthy
        const sourceResult = await mockAPI.updateBooking(data.bookingId, { 
          roomId: data.newRoomId,
          startTime: data.newTimeIn, 
          endTime: data.newTimeOut,
          timeIn: data.newTimeIn,
          timeOut: data.newTimeOut
        });
        
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
      }
    }
    
    if (isMockMode) {
      // Use mock implementation
      const sourceResult = await mockAPI.updateBooking(data.bookingId, { 
        roomId: data.newRoomId,
        startTime: data.newTimeIn, 
        endTime: data.newTimeOut,
        timeIn: data.newTimeIn,
        timeOut: data.newTimeOut
      });
      
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
    }
    
    try {
      const response = await apiClient.put(`/bookings/${data.bookingId}/move`, data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API move booking failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        // Fallback to mock implementation
        const sourceResult = await mockAPI.updateBooking(data.bookingId, { 
          roomId: data.newRoomId,
          startTime: data.newTimeIn, 
          endTime: data.newTimeOut,
          timeIn: data.newTimeIn,
          timeOut: data.newTimeOut
        });
        
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
      }
      throw error;
    }
  },
  
  resize: async (data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.put(`/bookings/${data.bookingId}/resize`, data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API resize booking failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.updateBooking(data.bookingId, { 
              startTime: data.newStartTime, 
              endTime: data.newEndTime,
              timeIn: data.newStartTime,
              timeOut: data.newEndTime
            });
          }
          throw error;
        }
      } else {
        return mockAPI.updateBooking(data.bookingId, { 
          startTime: data.newStartTime, 
          endTime: data.newEndTime,
          timeIn: data.newStartTime,
          timeOut: data.newEndTime
        });
      }
    }
    
    if (isMockMode) {
      return mockAPI.updateBooking(data.bookingId, { 
        startTime: data.newStartTime, 
        endTime: data.newEndTime,
        timeIn: data.newStartTime,
        timeOut: data.newEndTime
      });
    }
    
    try {
      const response = await apiClient.put(`/bookings/${data.bookingId}/resize`, data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API resize booking failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.updateBooking(data.bookingId, { 
          startTime: data.newStartTime, 
          endTime: data.newEndTime,
          timeIn: data.newStartTime,
          timeOut: data.newEndTime
        });
      }
      throw error;
    }
  },
};

// Availability API
export const availabilityAPI = {
  get: async (params = {}) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for availability');
        try {
          const response = await apiClient.get('/availability', { params });
          return response.data;
        } catch (error) {
          console.log('❌ Real API availability failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return Promise.resolve({ 
              data: { available: true, message: 'Mock availability data' } 
            });
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for availability');
        return Promise.resolve({ 
          data: { available: true, message: 'Mock availability data' } 
        });
      }
    }
    
    if (isMockMode) {
      return Promise.resolve({ 
        data: { available: true, message: 'Mock availability data' } 
      });
    }
    
    try {
      const response = await apiClient.get('/availability', { params });
      return response.data;
    } catch (error) {
      console.log('❌ Real API availability failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return Promise.resolve({ 
          data: { available: true, message: 'Mock availability data' } 
        });
      }
      throw error;
    }
  },
  
  findBest: async (params = {}) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        try {
          const response = await apiClient.get('/availability/best', { params });
          return response.data;
        } catch (error) {
          console.log('❌ Real API find best availability failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return Promise.resolve({ 
              data: { roomId: 1, available: true } 
            });
          }
          throw error;
        }
      } else {
        return Promise.resolve({ 
          data: { roomId: 1, available: true } 
        });
      }
    }
    
    if (isMockMode) {
      return Promise.resolve({ 
        data: { roomId: 1, available: true } 
      });
    }
    
    try {
      const response = await apiClient.get('/availability/best', { params });
      return response.data;
    } catch (error) {
      console.log('❌ Real API find best availability failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return Promise.resolve({ 
          data: { roomId: 1, available: true } 
        });
      }
      throw error;
    }
  },
};

// Business Hours API
export const businessHoursAPI = {
  get: async () => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for business hours');
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
          console.log('❌ Real API business hours failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getBusinessHours();
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for business hours');
        return mockAPI.getBusinessHours();
      }
    }
    
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
      console.log('❌ Real API business hours failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getBusinessHours();
      }
      throw error;
    }
  },
  
  update: async (data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for business hours update');
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
          console.log('❌ Real API business hours update failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.updateBusinessHours(data);
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for business hours update');
        return mockAPI.updateBusinessHours(data);
      }
    }
    
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
      console.log('❌ Real API business hours update failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
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
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for settings');
        try {
          const response = await apiClient.get('/settings');
          return response.data;
        } catch (error) {
          console.log('❌ Real API settings failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.getSettings();
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for settings');
        return mockAPI.getSettings();
      }
    }
    
    if (isMockMode) {
      return mockAPI.getSettings();
    }
    
    try {
      const response = await apiClient.get('/settings');
      return response.data;
    } catch (error) {
      console.log('❌ Real API settings failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.getSettings();
      }
      throw error;
    }
  },
  
  update: async (data) => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for settings update');
        try {
          const response = await apiClient.put('/settings', data);
          return response.data;
        } catch (error) {
          console.log('❌ Real API settings update failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.updateSettings(data);
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for settings update');
        return mockAPI.updateSettings(data);
      }
    }
    
    if (isMockMode) {
      return mockAPI.updateSettings(data);
    }
    
    try {
      const response = await apiClient.put('/settings', data);
      return response.data;
    } catch (error) {
      console.log('❌ Real API settings update failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.updateSettings(data);
      }
      throw error;
    }
  },
};

// Health API
export const healthAPI = {
  check: async () => {
    if (FORCE_REAL_API && FALLBACK_TO_MOCK) {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        console.log('🎯 Using real API for health check');
        try {
          const response = await apiClient.get('/health');
          return response.data;
        } catch (error) {
          console.log('❌ Real API health check failed, falling back to mock:', error.message);
          if (FALLBACK_TO_MOCK) {
            return mockAPI.healthCheck();
          }
          throw error;
        }
      } else {
        console.log('🔄 API unhealthy, falling back to mock for health check');
        return mockAPI.healthCheck();
      }
    }
    
    if (isMockMode) {
      return mockAPI.healthCheck();
    }
    
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.log('❌ Real API health check failed, falling back to mock:', error.message);
      if (FALLBACK_TO_MOCK) {
        return mockAPI.healthCheck();
      }
      throw error;
    }
  },
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