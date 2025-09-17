import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Initialize with localStorage values if available
  const getInitialSettings = () => {
    try {
      const savedSettings = localStorage.getItem('karaoke-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Apply default layout orientation if it's set
        if (parsed.defaultLayoutOrientation) {
          parsed.layoutOrientation = parsed.defaultLayoutOrientation;
        } else {
          // Fallback to horizontal if no default is stored
          parsed.layoutOrientation = 'rooms-y-time-x';
          parsed.defaultLayoutOrientation = 'rooms-y-time-x';
        }
        return {
          layoutOrientation: 'rooms-y-time-x',
          defaultLayoutOrientation: 'rooms-y-time-x',
          businessHours: { openHour: 16, closeHour: 23 },
          timezone: 'America/New_York', // Default to Eastern Time
          timeFormat: '12h',
          showBusinessHours: true,
          // Coloring options
          colorByRoomType: true,
          colorByBookingSource: false,
          bookingSourceColors: {
            walkin: '#22c55e', // green
            phone: '#f59e0b', // amber
            email: '#3b82f6', // blue
            message: '#a855f7', // purple
            online: '#ef4444', // red (fallback/other)
          },
          slotSize: 'medium',
          slotWidth: 'medium',
          slotHeight: 'medium',
          // Layout-specific slot settings
          horizontalLayoutSlots: {
            slotWidth: 'medium',
            slotHeight: 'medium',
          },
          verticalLayoutSlots: {
            slotWidth: 'medium',
            slotHeight: 'medium',
          },
          bookingFormFields: {
            customerName: true,
            phone: true,
            email: true,
            partySize: true,
            room: true,
            source: true,
            timeIn: true,
            timeOut: true,
            status: true,
            priority: true,
            basePrice: true,
            additionalFees: true,
            discount: true,
            totalPrice: true,
            notes: true,
            specialRequests: true,
          },
          ...parsed
        };
      }
    } catch (error) {
      console.error('Failed to parse saved settings during initialization:', error);
    }
    
    return {
      layoutOrientation: 'rooms-y-time-x',
      defaultLayoutOrientation: 'rooms-y-time-x',
      businessHours: { openHour: 16, closeHour: 23 },
      timezone: 'America/New_York',
      timeFormat: '12h',
      showBusinessHours: true,
      colorByBookingSource: false,
      bookingSourceColors: {
        walkin: '#22c55e',
        phone: '#f59e0b',
        email: '#3b82f6',
        message: '#a855f7',
        online: '#ef4444',
      },
      colorByRoomType: true,
      slotSize: 'medium',
      slotWidth: 'medium',
      slotHeight: 'medium',
      // Layout-specific slot settings
      horizontalLayoutSlots: {
        slotWidth: 'medium',
        slotHeight: 'medium',
      },
      verticalLayoutSlots: {
        slotWidth: 'medium',
        slotHeight: 'medium',
      },
      bookingFormFields: {
        customerName: true,
        phone: true,
        email: true,
        partySize: true,
        room: true,
        source: true,
        timeIn: true,
        timeOut: true,
        status: true,
        priority: true,
        basePrice: true,
        additionalFees: true,
        discount: true,
        totalPrice: true,
        notes: true,
        specialRequests: true,
      },
    };
  };

  const [settings, setSettings] = useState(getInitialSettings);

  // Settings are now initialized from localStorage on mount

  // Save settings to localStorage whenever they change
  useEffect(() => {
    console.log('💾 Saving settings to localStorage:', settings);
    localStorage.setItem('karaoke-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      
      // If updating default layout orientation, also apply it to current layout
      if (key === 'defaultLayoutOrientation') {
        newSettings.layoutOrientation = value;
      }
      
      return newSettings;
    });
  };

  const toggleLayoutOrientation = () => {
    setSettings(prev => ({
      ...prev,
      layoutOrientation: prev.layoutOrientation === 'rooms-x-time-y' 
        ? 'rooms-y-time-x' 
        : 'rooms-x-time-y'
    }));
  };

  const updateBookingFormField = (fieldName, isVisible) => {
    setSettings(prev => ({
      ...prev,
      bookingFormFields: {
        ...prev.bookingFormFields,
        [fieldName]: isVisible
      }
    }));
  };

  const updateLayoutSlotSetting = (layoutType, slotType, value) => {
    setSettings(prev => ({
      ...prev,
      [`${layoutType}LayoutSlots`]: {
        ...prev[`${layoutType}LayoutSlots`],
        [slotType]: value
      }
    }));
  };

  const updateBookingSourceColor = (sourceKey, color) => {
    setSettings(prev => ({
      ...prev,
      bookingSourceColors: {
        ...prev.bookingSourceColors,
        [sourceKey]: color
      }
    }));
  };

  const resetSettings = () => {
    const defaultSettings = {
      layoutOrientation: 'rooms-y-time-x',
      defaultLayoutOrientation: 'rooms-y-time-x',
      businessHours: { openHour: 16, closeHour: 23 },
      timezone: 'America/New_York',
      timeFormat: '12h',
      showBusinessHours: true,
      colorByRoomType: true,
      slotSize: 'medium',
      slotWidth: 'medium',
      slotHeight: 'medium',
      // Layout-specific slot settings
      horizontalLayoutSlots: {
        slotWidth: 'medium',
        slotHeight: 'medium',
      },
      verticalLayoutSlots: {
        slotWidth: 'medium',
        slotHeight: 'medium',
      },
      bookingFormFields: {
        customerName: true,
        phone: true,
        email: true,
        partySize: true,
        room: true,
        source: true,
        timeIn: true,
        timeOut: true,
        status: true,
        priority: true,
        basePrice: true,
        additionalFees: true,
        discount: true,
        totalPrice: true,
        notes: true,
        specialRequests: true,
      },
    };
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSetting,
    toggleLayoutOrientation,
    updateBookingFormField,
    updateLayoutSlotSetting,
    updateBookingSourceColor,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
