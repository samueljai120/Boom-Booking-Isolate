import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { businessHoursAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BusinessHoursContext = createContext();

export const useBusinessHours = () => {
  const context = useContext(BusinessHoursContext);
  if (!context) {
    throw new Error('useBusinessHours must be used within a BusinessHoursProvider');
  }
  return context;
};

export const BusinessHoursProvider = ({ children }) => {
  const [businessHours, setBusinessHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await businessHoursAPI.get();
      if (response.data.success) {
        const businessHours = response.data.data?.businessHours || response.data.businessHours || [];
        setBusinessHours(businessHours);
      } else {
        throw new Error('Failed to fetch business hours');
      }
    } catch (err) {
      console.error('Error fetching business hours:', err);
      setError(err.message);
      // Only show error toast if user is authenticated (not just a 401 error)
      if (err.response?.status !== 401) {
        toast.error('Failed to load business hours');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessHours = async (newBusinessHours) => {
    try {
      setError(null);
      const response = await businessHoursAPI.update({ businessHours: newBusinessHours });
      if (response.data.success) {
        setBusinessHours(response.data.businessHours);
        toast.success('Business hours updated successfully');
        return true;
      } else {
        throw new Error('Failed to update business hours');
      }
    } catch (err) {
      console.error('Error updating business hours:', err);
      console.error('Error response:', err.response?.data);
      setError(err.message);
      toast.error(`Failed to update business hours: ${err.response?.data?.error || err.message}`);
      return false;
    }
  };

  const getBusinessHoursForDay = React.useCallback((weekday) => {
    if (!businessHours || !Array.isArray(businessHours)) {
      return {
        weekday,
        openTime: '16:00',
        closeTime: '23:00',
        isClosed: false
      };
    }
    return businessHours.find(bh => bh.weekday === weekday) || {
      weekday,
      openTime: '16:00',
      closeTime: '23:00',
      isClosed: false
    };
  }, [businessHours]);

  const isWithinBusinessHours = useCallback((date, startTime, endTime) => {
    const weekday = date.getDay();
    const dayHours = getBusinessHoursForDay(weekday);
    
    if (dayHours.isClosed) {
      return false;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const dateStr = date.toISOString().split('T')[0];
    
    // Parse business hours
    const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);
    
    // Check if this is late night hours (close time is next day)
    const isLateNight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
    
    const openTime = new Date(`${dateStr}T${dayHours.openTime}:00`);
    let closeTime = new Date(`${dateStr}T${dayHours.closeTime}:00`);
    
    // For late night hours, close time is next day
    if (isLateNight) {
      closeTime.setDate(closeTime.getDate() + 1);
    }
    
    return start >= openTime && end <= closeTime;
  }, [getBusinessHoursForDay]);

  const getTimeSlotsForDay = useCallback((date, timezone = 'America/New_York') => {
    const weekday = date.getDay();
    const dayHours = getBusinessHoursForDay(weekday);
    
    if (dayHours.isClosed) {
      return [];
    }

    const slots = [];
    const openTime = dayHours.openTime;
    const closeTime = dayHours.closeTime;
    
    // Parse open and close times
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    // Handle late night hours (close time is next day)
    const isLateNight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
    
    // Create time slots every 15 minutes
    let currentHour = openHour;
    let currentMinute = openMinute;
    let totalMinutes = 0;
    const maxSlots = 200; // Prevent infinite loops (200 slots = 50 hours max)
    
    while (totalMinutes < maxSlots * 15) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // For late night hours, check if we've reached the close time
      if (isLateNight) {
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const closeTotalMinutes = closeHour * 60 + closeMinute;
        const openTotalMinutes = openHour * 60 + openMinute;
        
        // If we've passed midnight and reached close time, stop
        if (currentTotalMinutes >= 24 * 60 && currentTotalMinutes >= closeTotalMinutes + 24 * 60) {
          break;
        }
        // If we're still before midnight and haven't reached close time, continue
        if (currentTotalMinutes < 24 * 60 && currentTotalMinutes < closeTotalMinutes) {
          // Continue
        } else if (currentTotalMinutes >= 24 * 60) {
          // We've passed midnight, check if we've reached the close time
          if (currentTotalMinutes >= closeTotalMinutes + 24 * 60) {
            break;
          }
        }
      } else {
        // Normal hours - stop when we reach close time
        if (currentHour > closeHour || (currentHour === closeHour && currentMinute >= closeMinute)) {
          break;
        }
      }
      
      slots.push({
        time: timeString,
        hour: currentHour,
        minute: currentMinute,
        displayTime: new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        isNextDay: currentHour >= 24 || (isLateNight && currentHour < openHour)
      });
      
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
      
      // Handle hour overflow for late night hours
      if (currentHour >= 24) {
        currentHour = currentHour % 24;
      }
      
      totalMinutes += 15;
    }
    
    return slots;
  }, [getBusinessHoursForDay]);

  useEffect(() => {
    // Always try to fetch business hours
    // This ensures the schedule can render with actual hours from server
    fetchBusinessHours();
  }, []);

  const value = {
    businessHours,
    loading,
    error,
    fetchBusinessHours,
    updateBusinessHours,
    getBusinessHoursForDay,
    isWithinBusinessHours,
    getTimeSlotsForDay
  };

  return (
    <BusinessHoursContext.Provider value={value}>
      {children}
    </BusinessHoursContext.Provider>
  );
};
