/**
 * Data Normalization Utilities
 * Handles conversion between API data structures and frontend expectations
 * and provides safe data extraction to prevent infinite loops and crashes
 */

/**
 * Safely extract array data from API response
 * Handles multiple response formats to prevent crashes
 * 
 * @param {Object} apiResponse - The API response object
 * @param {string} dataPath - Optional path to data (e.g., 'bookings', 'rooms')
 * @returns {Array} Always returns an array, even if empty
 */
export const extractArrayData = (apiResponse, dataPath = null) => {
  // Handle null/undefined response
  if (!apiResponse) {
    // Reduced logging for performance
    // console.warn('API response is null or undefined');
    return [];
  }

  // Handle error responses
  if (apiResponse.success === false) {
    console.warn('API returned error:', apiResponse);
    return [];
  }

  // Handle direct array response
  if (Array.isArray(apiResponse)) {
    return apiResponse;
  }

  // Handle {success: true, data: [...]} format
  if (apiResponse.success === true && Array.isArray(apiResponse.data)) {
    return apiResponse.data;
  }

  // Handle nested structure: {success: true, data: {bookings: [...], total: number}}
  if (apiResponse.success === true && apiResponse.data && typeof apiResponse.data === 'object') {
    // If dataPath is specified, look for that property
    if (dataPath && Array.isArray(apiResponse.data[dataPath])) {
      return apiResponse.data[dataPath];
    }
    
    // Try common nested array properties
    const commonArrayProps = ['bookings', 'rooms', 'data', 'items', 'results'];
    for (const prop of commonArrayProps) {
      if (Array.isArray(apiResponse.data[prop])) {
        return apiResponse.data[prop];
      }
    }
  }

  // Handle legacy format: {data: [...]}
  if (Array.isArray(apiResponse.data)) {
    return apiResponse.data;
  }

  // Handle unexpected structure
  console.warn('Unexpected API response structure:', {
    apiResponse,
    dataType: typeof apiResponse?.data,
    isArray: Array.isArray(apiResponse?.data),
    hasDataProperty: !!apiResponse?.data,
    dataPath
  });

  return [];
};

/**
 * Create a safe data handler hook for React components
 * 
 * @param {Object} apiResponse - The API response
 * @param {string} dataType - Type of data ('bookings', 'rooms', etc.)
 * @returns {Object} Safe data handling result
 */
export const useSafeData = (apiResponse, dataType = 'array') => {
  if (dataType === 'bookings') {
    const rawData = extractArrayData(apiResponse, 'bookings');
    return {
      data: normalizeBookings(rawData),
      isLoading: !apiResponse,
      error: apiResponse?.success === false ? apiResponse : null
    };
  }

  if (dataType === 'rooms') {
    const rawData = extractArrayData(apiResponse, 'rooms');
    return {
      data: normalizeRooms(rawData),
      isLoading: !apiResponse,
      error: apiResponse?.success === false ? apiResponse : null
    };
  }

  // Default array handling
  return {
    data: extractArrayData(apiResponse),
    isLoading: !apiResponse,
    error: apiResponse?.success === false ? apiResponse : null
  };
};

/**
 * Normalize booking data from API to frontend format
 * @param {Object} booking - Raw booking data from API
 * @returns {Object} Normalized booking data
 */
export const normalizeBooking = (booking) => {
  if (!booking) return null;

  return {
    ...booking,
    // Ensure unique ID for React keys
    _id: booking._id || booking.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    id: booking.id || booking._id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    // Normalize room data
    roomId: booking.roomId || booking.room || {
      _id: booking.room_id,
      id: booking.room_id,
      name: booking.room_name,
      capacity: booking.capacity,
      category: booking.category,
      description: booking.description,
      pricePerHour: booking.pricePerHour,
      isActive: booking.isActive
    },
    room: booking.room || {
      _id: booking.room_id,
      id: booking.room_id,
      name: booking.room_name,
      capacity: booking.capacity,
      category: booking.category,
      description: booking.description,
      pricePerHour: booking.pricePerHour,
      isActive: booking.isActive
    },
    // Normalize time fields
    startTime: booking.startTime || booking.timeIn || booking.start_time,
    endTime: booking.endTime || booking.timeOut || booking.end_time,
    timeIn: booking.timeIn || booking.startTime || booking.start_time,
    timeOut: booking.timeOut || booking.endTime || booking.end_time,
    // Normalize customer fields
    customerName: booking.customerName || booking.customer_name,
    customerEmail: booking.customerEmail || booking.customer_email,
    customerPhone: booking.customerPhone || booking.customer_phone,
    // Normalize other fields
    source: booking.source || 'web',
    status: booking.status || 'confirmed',
    priority: booking.priority || 'normal',
    notes: booking.notes || '',
    specialRequests: booking.specialRequests || booking.special_requests || '',
    partySize: booking.partySize || booking.party_size || 1,
    totalPrice: booking.totalPrice || booking.total_price || 0
  };
};

/**
 * Normalize room data from API to frontend format
 * @param {Object} room - Raw room data from API
 * @returns {Object} Normalized room data
 */
export const normalizeRoom = (room) => {
  if (!room) return null;

  return {
    ...room,
    _id: room._id || room.id,
    id: room.id || room._id,
    name: room.name,
    capacity: room.capacity,
    category: room.category,
    description: room.description,
    pricePerHour: room.pricePerHour || room.price_per_hour,
    isActive: room.isActive !== undefined ? room.isActive : room.is_active,
    // Map API fields to frontend expectations
    status: room.status || (room.is_active ? 'active' : 'inactive'),
    isBookable: room.isBookable !== undefined ? room.isBookable : room.is_active,
    // Ensure hourlyRate is available for pricing calculations
    hourlyRate: room.hourlyRate || room.pricePerHour || room.price_per_hour || 25
  };
};

/**
 * Normalize user data from API to frontend format
 * @param {Object} user - Raw user data from API
 * @returns {Object} Normalized user data
 */
export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user'
  };
};

/**
 * Normalize tenant data from API to frontend format
 * @param {Object} tenant - Raw tenant data from API
 * @returns {Object} Normalized tenant data
 */
export const normalizeTenant = (tenant) => {
  if (!tenant) return null;

  return {
    ...tenant,
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    city: tenant.city,
    state: tenant.state,
    zipCode: tenant.zipCode || tenant.zip_code,
    country: tenant.country,
    timezone: tenant.timezone,
    currency: tenant.currency,
    logoUrl: tenant.logoUrl || tenant.logo_url,
    website: tenant.website,
    description: tenant.description,
    isActive: tenant.isActive !== undefined ? tenant.isActive : tenant.is_active,
    subscriptionPlan: tenant.subscriptionPlan || tenant.subscription_plan,
    maxRooms: tenant.maxRooms || tenant.max_rooms,
    maxBookingsPerMonth: tenant.maxBookingsPerMonth || tenant.max_bookings_per_month,
    createdAt: tenant.createdAt || tenant.created_at,
    updatedAt: tenant.updatedAt || tenant.updated_at
  };
};

/**
 * Normalize array of bookings
 * @param {Array} bookings - Array of raw booking data
 * @returns {Array} Array of normalized booking data
 */
export const normalizeBookings = (bookings) => {
  if (!Array.isArray(bookings)) return [];
  return bookings.map(normalizeBooking).filter(Boolean);
};

/**
 * Normalize array of rooms
 * @param {Array} rooms - Array of raw room data
 * @returns {Array} Array of normalized room data
 */
export const normalizeRooms = (rooms) => {
  if (!Array.isArray(rooms)) return [];
  return rooms.map(normalizeRoom).filter(Boolean);
};

/**
 * Normalize array of tenants
 * @param {Array} tenants - Array of raw tenant data
 * @returns {Array} Array of normalized tenant data
 */
export const normalizeTenants = (tenants) => {
  if (!Array.isArray(tenants)) return [];
  return tenants.map(normalizeTenant).filter(Boolean);
};

/**
 * Safe property access with fallback
 * @param {Object} obj - Object to access
 * @param {string} path - Dot notation path
 * @param {*} fallback - Fallback value
 * @returns {*} Property value or fallback
 */
export const safeGet = (obj, path, fallback = null) => {
  if (!obj || typeof obj !== 'object') return fallback;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : fallback;
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep merge objects with normalization
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export const deepMerge = (target, source) => {
  if (!target || typeof target !== 'object') return source || {};
  if (!source || typeof source !== 'object') return target || {};
  
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
};
