/**
 * Shared Data Hooks
 * 
 * Provides centralized data fetching to prevent duplicate API calls
 * and ensure consistent data across components.
 */

import { useQuery } from '@tanstack/react-query';
import { roomsAPI, bookingsAPI, businessHoursAPI, settingsAPI } from '../lib/unifiedApiClient';
import { QUERY_CONFIGS, createDateQueryKey } from '../config/queryConfig';

/**
 * Hook to fetch rooms data - shared across all components
 * Prevents duplicate API calls by using the same query key
 */
export const useRooms = (options = {}) => {
  return useQuery({
    ...QUERY_CONFIGS.rooms,
    queryFn: () => roomsAPI.getAll(),
    ...options,
  });
};

/**
 * Hook to fetch all bookings data - shared across all components
 * Prevents duplicate API calls by using the same query key
 */
export const useBookings = (options = {}) => {
  return useQuery({
    ...QUERY_CONFIGS.bookings,
    queryFn: () => bookingsAPI.getAll(),
    ...options,
  });
};

/**
 * Hook to fetch bookings for a specific date
 * Uses date-specific query key to cache by date
 */
export const useBookingsByDate = (date, options = {}) => {
  const queryKey = createDateQueryKey(['bookings'], date);
  
  return useQuery({
    queryKey,
    queryFn: () => {
      if (!date) return Promise.resolve({ success: true, data: [] });
      const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
      return bookingsAPI.getAll({ date: dateStr });
    },
    ...QUERY_CONFIGS.bookingsByDate,
    enabled: !!date,
    ...options,
  });
};

/**
 * Hook to fetch business hours data - shared across all components
 */
export const useBusinessHours = (options = {}) => {
  return useQuery({
    ...QUERY_CONFIGS.businessHours,
    queryFn: () => businessHoursAPI.getAll(),
    ...options,
  });
};

/**
 * Hook to fetch settings data - shared across all components
 */
export const useSettings = (options = {}) => {
  return useQuery({
    ...QUERY_CONFIGS.settings,
    queryFn: () => settingsAPI.getAll(),
    ...options,
  });
};

/**
 * Hook to fetch user session data
 */
export const useUserSession = (options = {}) => {
  return useQuery({
    ...QUERY_CONFIGS.userSession,
    queryFn: () => authAPI.getSession(),
    ...options,
  });
};

/**
 * Hook to preload critical data for better performance
 * This can be used in the main App component to preload data
 */
export const usePreloadData = () => {
  const roomsQuery = useRooms();
  const businessHoursQuery = useBusinessHours();
  
  return {
    rooms: roomsQuery.data?.data || [],
    businessHours: businessHoursQuery.data?.data || [],
    isLoading: roomsQuery.isLoading || businessHoursQuery.isLoading,
    error: roomsQuery.error || businessHoursQuery.error,
  };
};

/**
 * Hook to get safe data from API responses
 * Handles different response formats and provides fallbacks
 */
export const useSafeData = (apiResponse, dataPath = null) => {
  // Handle null/undefined response
  if (!apiResponse) {
    return { data: [], isLoading: false, error: null };
  }

  // Handle error responses
  if (apiResponse.success === false) {
    return { data: [], isLoading: false, error: apiResponse.error };
  }

  // Handle direct array response
  if (Array.isArray(apiResponse)) {
    return { data: apiResponse, isLoading: false, error: null };
  }

  // Handle success response with data
  if (apiResponse.success === true && apiResponse.data) {
    // Handle nested structure: {success: true, data: {bookings: [...], total: number}}
    if (apiResponse.data.bookings) {
      return { data: apiResponse.data.bookings, isLoading: false, error: null };
    }
    
    // Handle direct array in data
    if (Array.isArray(apiResponse.data)) {
      return { data: apiResponse.data, isLoading: false, error: null };
    }
    
    // Handle specific data path
    if (dataPath && apiResponse.data[dataPath]) {
      return { data: apiResponse.data[dataPath], isLoading: false, error: null };
    }
  }

  // Handle legacy format or unexpected structure
  if (dataPath && apiResponse[dataPath]) {
    return { data: apiResponse[dataPath], isLoading: false, error: null };
  }

  // Default fallback
  return { data: [], isLoading: false, error: null };
};

export default {
  useRooms,
  useBookings,
  useBookingsByDate,
  useBusinessHours,
  useSettings,
  useUserSession,
  usePreloadData,
  useSafeData,
};
