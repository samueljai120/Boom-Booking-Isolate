import { mockAPI } from './mockData.js';

// Mock API configuration for standalone frontend
// This replaces the real API with mock data for demonstration purposes

// Auth API
export const authAPI = {
  login: (credentials) => mockAPI.login(credentials),
  logout: () => mockAPI.logout(),
  getSession: () => mockAPI.getSession(),
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
    console.log('🚀 API move called with data:', data);
    
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
      console.log('🔄 API updating target booking for swap:', data.targetBookingId);
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
  get: () => mockAPI.getBusinessHours(),
  update: (data) => mockAPI.updateBusinessHours(data),
  getExceptions: () => Promise.resolve({ data: [] }),
  createException: (data) => Promise.resolve({ data }),
  deleteException: (id) => Promise.resolve({ data: { message: 'Exception deleted' } }),
};

// Settings API
export const settingsAPI = {
  get: () => mockAPI.getSettings(),
  update: (data) => mockAPI.updateSettings(data),
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