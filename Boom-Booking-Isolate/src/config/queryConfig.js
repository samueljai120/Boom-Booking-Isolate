/**
 * Centralized React Query Configuration
 * 
 * Prevents duplicate API calls and optimizes performance
 * by standardizing query configurations across components.
 */

// Standard query configurations
export const QUERY_CONFIGS = {
  // Rooms configuration - shared across all components
  rooms: {
    queryKey: ['rooms'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    keepPreviousData: true,
  },

  // Bookings configuration - shared across all components
  bookings: {
    queryKey: ['bookings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    keepPreviousData: true,
  },

  // Date-specific bookings configuration
  bookingsByDate: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    keepPreviousData: true,
  },

  // Business hours configuration
  businessHours: {
    queryKey: ['businessHours'],
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    keepPreviousData: true,
  },

  // Settings configuration
  settings: {
    queryKey: ['settings'],
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    keepPreviousData: true,
  },

  // User session configuration
  userSession: {
    queryKey: ['userSession'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Don't retry auth failures
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    keepPreviousData: false, // Don't keep old user data
  }
};

// Helper function to create date-specific query key
export const createDateQueryKey = (baseKey, date) => {
  if (!date) return baseKey;
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return [...baseKey, dateStr];
};

// Helper function to get optimized query config
export const getQueryConfig = (type, options = {}) => {
  const baseConfig = QUERY_CONFIGS[type];
  if (!baseConfig) {
    console.warn(`Unknown query config type: ${type}`);
    return {};
  }

  return {
    ...baseConfig,
    ...options,
  };
};

// Mutation configurations
export const MUTATION_CONFIGS = {
  // Booking mutations
  booking: {
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Booking mutation failed:', error);
    },
  },

  // User mutations
  user: {
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error('User mutation failed:', error);
    },
  },

  // Settings mutations
  settings: {
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Settings mutation failed:', error);
    },
  }
};

// Global query client configuration
export const GLOBAL_QUERY_CONFIG = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      cacheTime: 10 * 60 * 1000, // 10 minutes default
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on 401 (authentication) errors
        if (error?.response?.status === 401) return false;
        // Don't retry on 403 (authorization) errors
        if (error?.response?.status === 403) return false;
        // Don't retry on 404 (not found) errors
        if (error?.response?.status === 404) return false;
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

export default {
  QUERY_CONFIGS,
  MUTATION_CONFIGS,
  GLOBAL_QUERY_CONFIG,
  createDateQueryKey,
  getQueryConfig,
};
