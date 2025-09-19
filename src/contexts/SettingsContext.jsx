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
            customerName: { visible: true, required: true, label: 'Customer Name', placeholder: 'Enter customer name', validation: 'required' },
            phone: { visible: true, required: true, label: 'Phone Number', placeholder: 'Enter phone number', validation: 'phone' },
            email: { visible: true, required: false, label: 'Email Address', placeholder: 'Enter email address', validation: 'email' },
            partySize: { visible: true, required: false, label: 'Party Size', placeholder: 'Number of people', validation: 'number' },
            room: { visible: true, required: true, label: 'Room Selection', placeholder: 'Select a room', validation: 'required' },
            source: { visible: true, required: false, label: 'Booking Source', placeholder: 'How did they book?', validation: 'none' },
            timeIn: { visible: true, required: true, label: 'Start Time', placeholder: 'Select start time', validation: 'required' },
            timeOut: { visible: true, required: true, label: 'End Time', placeholder: 'Select end time', validation: 'required' },
            status: { visible: true, required: false, label: 'Status', placeholder: 'Booking status', validation: 'none' },
            priority: { visible: true, required: false, label: 'Priority', placeholder: 'Booking priority', validation: 'none' },
            basePrice: { visible: true, required: false, label: 'Base Price', placeholder: 'Base price amount', validation: 'currency' },
            additionalFees: { visible: true, required: false, label: 'Additional Fees', placeholder: 'Extra charges', validation: 'currency' },
            discount: { visible: true, required: false, label: 'Discount', placeholder: 'Discount amount', validation: 'currency' },
            totalPrice: { visible: true, required: false, label: 'Total Price', placeholder: 'Total amount', validation: 'currency' },
            notes: { visible: true, required: false, label: 'Notes', placeholder: 'Additional notes', validation: 'none' },
            specialRequests: { visible: true, required: false, label: 'Special Requests', placeholder: 'Special requirements', validation: 'none' },
          },
          customBookingFields: [],
          // Confirmation template settings
          confirmationTemplate: {
            template: '🎤 BOOKING CONFIRMATION\n\n' +
              'Customer: {{customerName}}\n' +
              'Phone: {{phone}}\n' +
              'Email: {{email}}\n' +
              'Date: {{date}}\n' +
              'Time: {{time}}\n' +
              'Duration: {{duration}}\n' +
              'Room: {{roomName}} ({{roomCapacity}} people)\n' +
              'Status: {{status}}\n' +
              'Source: {{source}}\n' +
              'Confirmation Code: {{confirmationCode}}\n' +
              'Total Price: ${{totalPrice}}\n\n' +
              '{{#if notes}}\n' +
              'Notes: {{notes}}\n' +
              '{{/if}}\n\n' +
              '{{#if specialRequests}}\n' +
              'Special Requests: {{specialRequests}}\n' +
              '{{/if}}\n\n' +
              '{{confirmationMessage}}\n\n' +
              'For questions or changes, call us at {{businessPhone}} or email {{businessEmail}}.\n\n' +
              '---\n' +
              '{{businessName}}\n' +
              '{{businessAddress}}\n' +
              '{{businessWebsite}}\n' +
              'Generated on {{generatedDate}}',
            customFields: []
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
      // Confirmation template settings
      confirmationTemplate: {
        template: '🎤 BOOKING CONFIRMATION\n\n' +
          'Customer: {{customerName}}\n' +
          'Phone: {{phone}}\n' +
          'Email: {{email}}\n' +
          'Date: {{date}}\n' +
          'Time: {{time}}\n' +
          'Duration: {{duration}}\n' +
          'Room: {{roomName}} ({{roomCapacity}} people)\n' +
          'Status: {{status}}\n' +
          'Source: {{source}}\n' +
          'Confirmation Code: {{confirmationCode}}\n' +
          'Total Price: ${{totalPrice}}\n\n' +
          '{{#if notes}}\n' +
          'Notes: {{notes}}\n' +
          '{{/if}}\n\n' +
          '{{#if specialRequests}}\n' +
          'Special Requests: {{specialRequests}}\n' +
          '{{/if}}\n\n' +
          '{{confirmationMessage}}\n\n' +
          'For questions or changes, call us at {{businessPhone}} or email {{businessEmail}}.\n\n' +
          '---\n' +
          '{{businessName}}\n' +
          '{{businessAddress}}\n' +
          '{{businessWebsite}}\n' +
          'Generated on {{generatedDate}}',
        customFields: []
      },
    };
  };

  const [settings, setSettings] = useState(getInitialSettings);

  // Settings are now initialized from localStorage on mount

  // Save settings to localStorage whenever they change
  useEffect(() => {
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

  const updateBookingFormField = (fieldName, property, value) => {
    setSettings(prev => ({
      ...prev,
      bookingFormFields: {
        ...prev.bookingFormFields,
        [fieldName]: {
          ...prev.bookingFormFields[fieldName],
          [property]: value
        }
      }
    }));
  };

  const addCustomBookingField = (field) => {
    setSettings(prev => ({
      ...prev,
      customBookingFields: [...prev.customBookingFields, field]
    }));
  };

  const updateCustomBookingField = (fieldId, property, value) => {
    setSettings(prev => ({
      ...prev,
      customBookingFields: prev.customBookingFields.map(field => 
        field.id === fieldId ? { ...field, [property]: value } : field
      )
    }));
  };

  const removeCustomBookingField = (fieldId) => {
    setSettings(prev => ({
      ...prev,
      customBookingFields: prev.customBookingFields.filter(field => field.id !== fieldId)
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

  const updateConfirmationTemplate = (template) => {
    setSettings(prev => ({
      ...prev,
      confirmationTemplate: {
        ...prev.confirmationTemplate,
        template
      }
    }));
  };

  const updateConfirmationCustomFields = (customFields) => {
    setSettings(prev => ({
      ...prev,
      confirmationTemplate: {
        ...prev.confirmationTemplate,
        customFields
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
      // Confirmation template settings
      confirmationTemplate: {
        template: '🎤 BOOKING CONFIRMATION\n\n' +
          'Customer: {{customerName}}\n' +
          'Phone: {{phone}}\n' +
          'Email: {{email}}\n' +
          'Date: {{date}}\n' +
          'Time: {{time}}\n' +
          'Duration: {{duration}}\n' +
          'Room: {{roomName}} ({{roomCapacity}} people)\n' +
          'Status: {{status}}\n' +
          'Source: {{source}}\n' +
          'Confirmation Code: {{confirmationCode}}\n' +
          'Total Price: ${{totalPrice}}\n\n' +
          '{{#if notes}}\n' +
          'Notes: {{notes}}\n' +
          '{{/if}}\n\n' +
          '{{#if specialRequests}}\n' +
          'Special Requests: {{specialRequests}}\n' +
          '{{/if}}\n\n' +
          '{{confirmationMessage}}\n\n' +
          'For questions or changes, call us at {{businessPhone}} or email {{businessEmail}}.\n\n' +
          '---\n' +
          '{{businessName}}\n' +
          '{{businessAddress}}\n' +
          '{{businessWebsite}}\n' +
          'Generated on {{generatedDate}}',
        customFields: []
      },
    };
    setSettings(defaultSettings);
  };

  const value = {
    settings,
    updateSetting,
    toggleLayoutOrientation,
    updateBookingFormField,
    addCustomBookingField,
    updateCustomBookingField,
    removeCustomBookingField,
    updateLayoutSlotSetting,
    updateBookingSourceColor,
    updateConfirmationTemplate,
    updateConfirmationCustomFields,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
