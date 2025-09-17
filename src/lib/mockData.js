// Mock data for standalone frontend
export const mockData = {
  // Mock user data
  user: {
    id: 1,
    username: 'demo@example.com',
    name: 'Demo User',
    role: 'admin'
  },

  // Mock rooms data
  rooms: [
    {
      _id: 1,
      id: 1,
      name: 'Room A',
      capacity: 4,
      category: 'Standard',
      amenities: ['Microphone', 'TV', 'Sound System'],
      isActive: true,
      isBookable: true,
      status: 'active',
      color: '#3B82F6',
      hourlyRate: 25
    },
    {
      _id: 2,
      id: 2,
      name: 'Room B',
      capacity: 6,
      category: 'Premium',
      amenities: ['Microphone', 'TV', 'Sound System', 'Lighting'],
      isActive: true,
      isBookable: true,
      status: 'active',
      color: '#10B981',
      hourlyRate: 35
    },
    {
      _id: 3,
      id: 3,
      name: 'Room C',
      capacity: 8,
      category: 'VIP',
      amenities: ['Microphone', 'TV', 'Sound System', 'Lighting', 'Bar'],
      isActive: true,
      isBookable: true,
      status: 'active',
      color: '#F59E0B',
      hourlyRate: 50
    }
  ],

  // Mock bookings data
  bookings: [
    {
      _id: 1,
      id: 1,
      roomId: 1,
      room: 1,
      customerName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      startTime: new Date(2025, 8, 17, 18, 0, 0), // September 17, 2025 at 6 PM
      endTime: new Date(2025, 8, 17, 20, 0, 0), // September 17, 2025 at 8 PM
      timeIn: new Date(2025, 8, 17, 18, 0, 0),
      timeOut: new Date(2025, 8, 17, 20, 0, 0),
      status: 'confirmed',
      source: 'walk_in',
      priority: 'normal',
      partySize: 4,
      basePrice: 50.00,
      additionalFees: 0,
      discount: 0,
      totalPrice: 50.00,
      notes: 'Birthday party',
      specialRequests: 'Need extra chairs',
      confirmationCode: 'BK001',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 2,
      id: 2,
      roomId: 2,
      room: 2,
      customerName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      startTime: new Date(2025, 8, 17, 19, 0, 0), // September 17, 2025 at 7 PM
      endTime: new Date(2025, 8, 17, 21, 0, 0), // September 17, 2025 at 9 PM
      timeIn: new Date(2025, 8, 17, 19, 0, 0),
      timeOut: new Date(2025, 8, 17, 21, 0, 0),
      status: 'confirmed',
      source: 'phone',
      priority: 'high',
      partySize: 6,
      basePrice: 75.00,
      additionalFees: 10.00,
      discount: 5.00,
      totalPrice: 80.00,
      notes: 'Corporate event',
      specialRequests: 'AV equipment needed',
      confirmationCode: 'BK002',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 3,
      id: 3,
      roomId: 3,
      room: 3,
      customerName: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+1555123456',
      startTime: new Date(2025, 8, 17, 20, 0, 0), // September 17, 2025 at 8 PM
      endTime: new Date(2025, 8, 17, 22, 0, 0), // September 17, 2025 at 10 PM
      timeIn: new Date(2025, 8, 17, 20, 0, 0),
      timeOut: new Date(2025, 8, 17, 22, 0, 0),
      status: 'pending',
      source: 'online',
      priority: 'normal',
      partySize: 8,
      basePrice: 100.00,
      additionalFees: 0,
      discount: 0,
      totalPrice: 100.00,
      notes: 'Wedding reception',
      specialRequests: 'Catering setup required',
      confirmationCode: 'BK003',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],

  // Mock business hours
  businessHours: [
    { weekday: 1, openTime: '16:00', closeTime: '23:00', isClosed: false }, // Monday
    { weekday: 2, openTime: '16:00', closeTime: '23:00', isClosed: false }, // Tuesday
    { weekday: 3, openTime: '16:00', closeTime: '23:00', isClosed: false }, // Wednesday
    { weekday: 4, openTime: '16:00', closeTime: '23:00', isClosed: false }, // Thursday
    { weekday: 5, openTime: '16:00', closeTime: '23:00', isClosed: false }, // Friday
    { weekday: 6, openTime: '16:00', closeTime: '23:00', isClosed: false }, // Saturday
    { weekday: 0, openTime: '16:00', closeTime: '23:00', isClosed: false }  // Sunday
  ],

  // Mock settings
  settings: {
    timezone: 'America/New_York',
    bookingDuration: 60, // minutes
    maxAdvanceBooking: 30, // days
    minAdvanceBooking: 1, // hours
    allowCancellation: true,
    cancellationDeadline: 24 // hours
  }
};

// Mock API functions
export const mockAPI = {
  // Auth mock
  login: (credentials) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.username === 'demo@example.com' && credentials.password === 'demo123') {
          resolve({
            data: {
              user: mockData.user,
              token: 'mock-jwt-token-' + Date.now()
            }
          });
        } else {
          throw new Error('Invalid credentials');
        }
      }, 1000);
    });
  },

  logout: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { message: 'Logged out successfully' } });
      }, 500);
    });
  },

  getSession: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
          resolve({ data: { user: mockData.user, token } });
        } else {
          throw new Error('No active session');
        }
      }, 500);
    });
  },

  // Rooms mock
  getRooms: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: mockData.rooms });
      }, 500);
    });
  },

  createRoom: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate unique ID by finding the highest existing ID and adding 1
        const maxId = mockData.rooms.length > 0 ? Math.max(...mockData.rooms.map(r => r.id)) : 0;
        const newRoom = {
          id: maxId + 1,
          name: data.name,
          capacity: data.capacity,
          category: data.category,
          amenities: data.amenities || [],
          isActive: data.isActive !== false,
          color: data.color || '#3B82F6'
        };
        mockData.rooms.push(newRoom);
        resolve({ data: newRoom });
      }, 1000);
    });
  },

  updateRoom: (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockData.rooms.findIndex(r => r.id === id);
        if (index !== -1) {
          mockData.rooms[index] = { ...mockData.rooms[index], ...data };
          resolve({ data: mockData.rooms[index] });
        } else {
          throw new Error('Room not found');
        }
      }, 1000);
    });
  },

  deleteRoom: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockData.rooms.findIndex(r => r.id === id);
        if (index !== -1) {
          mockData.rooms.splice(index, 1);
          resolve({ data: { message: 'Room deleted successfully' } });
        } else {
          throw new Error('Room not found');
        }
      }, 1000);
    });
  },

  // Bookings mock
  getBookings: (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📥 Mock API: getBookings called with params:', params);
        console.log('📥 Mock API: Raw bookings data:', mockData.bookings);
        let filteredBookings = [...mockData.bookings];
        
        // Join room data with bookings
        filteredBookings = filteredBookings.map(booking => {
          // Handle both object and primitive roomId values
          let roomIdToMatch;
          if (typeof booking.roomId === 'object' && booking.roomId !== null) {
            roomIdToMatch = booking.roomId._id || booking.roomId.id;
          } else {
            roomIdToMatch = booking.roomId;
          }
          
          const room = mockData.rooms.find(r => r.id === roomIdToMatch);
          return {
            ...booking,
            roomId: {
              _id: room?.id,
              id: room?.id,
              name: room?.name,
              capacity: room?.capacity,
              color: room?.color,
              category: room?.category,
              amenities: room?.amenities,
              hourlyRate: room?.hourlyRate || 25 // Use room's hourly rate or default
            }
          };
        });
        
        // Apply filters
        if (params.room) {
          filteredBookings = filteredBookings.filter(b => b.roomId?._id === parseInt(params.room));
        }
        
        if (params.status && params.status !== 'all') {
          filteredBookings = filteredBookings.filter(b => b.status === params.status);
        }
        
        if (params.customer) {
          filteredBookings = filteredBookings.filter(b => 
            b.customerName.toLowerCase().includes(params.customer.toLowerCase())
          );
        }
        
        if (params.date) {
          const selectedDate = new Date(params.date);
          const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
          
          filteredBookings = filteredBookings.filter(b => {
            const bookingStart = new Date(b.startTime);
            const bookingEnd = new Date(b.endTime);
            return (bookingStart < endOfDay && bookingEnd > startOfDay);
          });
        }
        
        if (params.startDate && params.endDate) {
          const start = new Date(params.startDate);
          const end = new Date(params.endDate);
          filteredBookings = filteredBookings.filter(b => 
            b.startTime >= start && b.endTime <= end
          );
        }
        
        console.log('📥 Mock API: Final filtered bookings:', filteredBookings);
        resolve({ 
          data: { 
            bookings: filteredBookings,
            total: filteredBookings.length
          } 
        });
      }, 500);
    });
  },

  createBooking: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = mockData.bookings.length > 0 ? Math.max(...mockData.bookings.map(b => b.id)) + 1 : 1;
        const newBooking = {
          _id: newId,
          id: newId,
          ...data,
          status: data.status || 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockData.bookings.push(newBooking);
        resolve({ data: { booking: newBooking } });
      }, 1000);
    });
  },

  updateBooking: (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🔄 Mock API: Updating booking', id, 'with data:', data);
        console.log('🔄 Mock API: Available booking IDs:', mockData.bookings.map(b => ({ id: b.id, _id: b._id, customerName: b.customerName })));
        const index = mockData.bookings.findIndex(b => b.id === id || b._id === id);
        console.log('🔄 Mock API: Found booking at index:', index);
        if (index !== -1) {
          const oldBooking = mockData.bookings[index];
          mockData.bookings[index] = { ...mockData.bookings[index], ...data, updatedAt: new Date() };
          console.log('🔄 Mock API: Updated booking from:', oldBooking, 'to:', mockData.bookings[index]);
          console.log('🔄 Mock API: All bookings after update:', mockData.bookings);
          resolve({ data: { booking: mockData.bookings[index] } });
        } else {
          console.error('❌ Mock API: Booking not found for id:', id);
          console.error('❌ Mock API: Available IDs:', mockData.bookings.map(b => ({ id: b.id, _id: b._id })));
          throw new Error('Booking not found');
        }
      }, 1000);
    });
  },

  deleteBooking: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockData.bookings.findIndex(b => b.id === id || b._id === id);
        if (index !== -1) {
          mockData.bookings.splice(index, 1);
          resolve({ data: { message: 'Booking deleted successfully' } });
        } else {
          throw new Error('Booking not found');
        }
      }, 1000);
    });
  },

  // Business hours mock
  getBusinessHours: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            success: true, 
            businessHours: mockData.businessHours 
          } 
        });
      }, 500);
    });
  },

  updateBusinessHours: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Update the business hours array with the new data
        mockData.businessHours = data.businessHours || mockData.businessHours;
        resolve({ 
          data: { 
            success: true, 
            businessHours: mockData.businessHours 
          } 
        });
      }, 1000);
    });
  },

  // Settings mock
  getSettings: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: mockData.settings });
      }, 500);
    });
  },

  updateSettings: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockData.settings = { ...mockData.settings, ...data };
        resolve({ data: mockData.settings });
      }, 1000);
    });
  },

  // Health check mock
  healthCheck: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          } 
        });
      }, 100);
    });
  }
};

