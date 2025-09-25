import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import CustomSelect from './ui/CustomSelect';
import { X, Calendar, Clock, Users, Phone, Mail, User, AlertCircle, Copy, FileText, DollarSign, Star, Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../lib/unifiedApiClient';
import { useBusinessHours } from '../contexts/BusinessHoursContext';
import { useSettings } from '../contexts/SettingsContext';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandling';
import BookingConfirmation from './BookingConfirmation';

// Smart default field visibility configuration
const getDefaultFieldVisibility = () => ({
  customerName: { visible: true, required: true },
  phone: { visible: true, required: true },
  email: { visible: true, required: false },
  partySize: { visible: true, required: false },
  roomId: { visible: true, required: true },
  startTime: { visible: true, required: true },
  endTime: { visible: true, required: true },
  source: { visible: true, required: false },
  status: { visible: true, required: false },
  priority: { visible: false, required: false },
  basePrice: { visible: true, required: false },
  additionalFees: { visible: false, required: false },
  discount: { visible: false, required: false },
  totalPrice: { visible: true, required: false },
  notes: { visible: true, required: false },
  specialRequests: { visible: false, required: false },
});

// Get smart default values for new bookings
const getSmartDefaults = (rooms) => {
  const now = moment();
  const defaultEndTime = now.clone().add(1, 'hour');
  
  return {
    customerName: '',
    phone: '',
    email: '',
    partySize: '1',
    source: 'walk_in',
    startTime: now.format('YYYY-MM-DDTHH:mm'),
    endTime: defaultEndTime.format('YYYY-MM-DDTHH:mm'),
    status: 'confirmed',
    priority: 'normal',
    basePrice: '0',
    additionalFees: '0',
    discount: '0',
    totalPrice: '0',
    notes: '',
    specialRequests: '',
    roomId: (rooms && rooms.length > 0 ? rooms[0]._id || rooms[0].id : ''),
  };
};

const BookingModal = ({ isOpen, onClose, booking, rooms, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const queryClient = useQueryClient();
  const { getBusinessHoursForDay, isWithinBusinessHours, getTimeSlotsForDay } = useBusinessHours();
  const { settings } = useSettings();
  
  // Debug logging - reduced for performance
  // console.log('🔧 BookingModal - Settings loaded:', !!settings);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      partySize: '',
      source: 'walk_in',
      startTime: '',
      endTime: '',
      status: 'confirmed',
      priority: 'normal',
      basePrice: '',
      additionalFees: '',
      discount: '',
      totalPrice: '',
      notes: '',
      specialRequests: '',
      roomId: '',
    },
    mode: 'onChange', // Enable real-time validation without clearing fields
    shouldUnregister: false, // Keep form data when fields are unmounted
  });

  // Watch form data for persistence
  const watchedFormData = watch();

  // Save form data to localStorage to prevent data loss
  useEffect(() => {
    const formDataToSave = { ...watchedFormData };
    // Only save if there's actual user input
    const hasUserInput = Object.values(formDataToSave).some(value => 
      value && value.toString().trim() !== '' && value !== 'walk_in' && value !== 'confirmed' && value !== 'normal'
    );
    
    if (hasUserInput && !booking) {
      localStorage.setItem('bookingFormDraft', JSON.stringify(formDataToSave));
    }
  }, [watchedFormData, booking]);

  // Reset form when booking changes - optimized to prevent unnecessary resets
  useEffect(() => {
    // Only reset form when booking prop actually changes (not on every render)
    if (booking) {
      if (booking.id || booking._id) {
        // Editing existing booking
        setIsEditing(true);
        reset({
          customerName: booking.title || booking.customerName || '',
          phone: booking.resource?.phone || booking.phone || '',
          email: booking.resource?.email || booking.email || '',
          partySize: booking.resource?.partySize || booking.partySize || '',
          source: booking.resource?.source || booking.source || 'walk_in',
          startTime: moment(booking.startTime || booking.start).format('YYYY-MM-DDTHH:mm'),
          endTime: moment(booking.endTime || booking.end).format('YYYY-MM-DDTHH:mm'),
          status: booking.resource?.status || booking.status || 'confirmed',
          priority: booking.resource?.priority || booking.priority || 'normal',
          basePrice: booking.resource?.basePrice || booking.basePrice || '',
          additionalFees: booking.resource?.additionalFees || booking.additionalFees || '',
          discount: booking.resource?.discount || booking.discount || '',
          totalPrice: booking.resource?.totalPrice || booking.totalPrice || '',
          notes: booking.resource?.notes || booking.notes || '',
          specialRequests: booking.resource?.specialRequests || booking.specialRequests || '',
          roomId: booking.resource?.roomId || booking.room?._id || booking.roomId || '',
        });
        } else {
          // Creating new booking with smart defaults
          setIsEditing(false);
          const smartDefaults = getSmartDefaults(rooms);
          
          // Override with booking-specific times if provided
          reset({
            ...smartDefaults,
            startTime: moment(booking.start).format('YYYY-MM-DDTHH:mm'),
            endTime: moment(booking.end).format('YYYY-MM-DDTHH:mm'),
            roomId: booking.resource?.roomId || booking.roomId || smartDefaults.roomId,
          });
        }
    } else {
      // No booking provided, reset to smart defaults only if not already in new booking mode
      if (!isEditing) {
        setIsEditing(false);
        const smartDefaults = getSmartDefaults(rooms);
        
        // Try to restore saved form data first
        const savedFormData = localStorage.getItem('bookingFormDraft');
        if (savedFormData) {
          try {
            const parsedData = JSON.parse(savedFormData);
            // Merge saved data with smart defaults
            const mergedData = { ...smartDefaults, ...parsedData };
            reset(mergedData);
            // Clear the saved data after restoring
            localStorage.removeItem('bookingFormDraft');
          } catch (error) {
            console.warn('Failed to parse saved form data:', error);
            reset(smartDefaults);
          }
        } else {
          reset(smartDefaults);
        }
      }
    }
  }, [booking?.id, booking?._id, booking?.start, booking?.end, rooms, reset, isEditing]);

  // Create booking mutation (optimistic)
  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = queryClient.getQueryData(['bookings']);
      try {
        const oldBookings = previous?.data?.bookings || [];
        const tempId = `temp-${Date.now()}`;
        const roomObj = (rooms && Array.isArray(rooms) ? rooms.find(r => r._id === (newData.roomId || newData.room)) : null) || null;
        const optimistic = {
          _id: tempId,
          customerName: newData.customerName,
          phone: newData.phone,
          source: newData.source,
          timeIn: newData.startTime,
          timeOut: newData.endTime,
          startTime: newData.startTime,
          endTime: newData.endTime,
          notes: newData.notes,
          room: roomObj || { _id: newData.roomId || newData.room },
          status: 'confirmed',
        };
        queryClient.setQueryData(['bookings'], (old) => ({
          ...(old || {}),
          data: {
            ...((old || {}).data || {}),
            bookings: [...oldBookings, optimistic],
          },
        }));
      } catch {}
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['bookings'], ctx.previous);
      
      // Use standardized error handling
      const errorInfo = handleApiError(err, {
        fallbackMessage: 'Failed to create booking. Please try again.',
        showToast: false // We'll handle specific messages manually
      });
      
      // Show specific error messages for known error codes
      if (err.response?.data?.code === 'OUTSIDE_BUSINESS_HOURS') {
        toast.error('Booking time is outside business hours. Please check the schedule for available times.');
      } else if (err.response?.data?.code === 'TIME_SLOT_CONFLICT') {
        toast.error('This time slot is already booked. Please choose a different time.');
      } else {
        toast.error(errorInfo.message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: (data) => {
      toast.success('Booking created successfully');
      // Store the created booking for confirmation
      // Bookings API returns {success: true, data: {booking: {...}}}
      const newBooking = data?.data?.booking || data?.data;
      if (newBooking) {
        setCreatedBooking(newBooking);
        setShowConfirmation(true);
      } else {
        onSuccess();
      }
      // Clear any saved form data since booking was successful
      localStorage.removeItem('bookingFormDraft');
    },
  });

  // Update booking mutation (optimistic)
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => bookingsAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = queryClient.getQueryData(['bookings']);
      try {
        const oldBookings = previous?.data?.bookings || [];
        const idx = oldBookings.findIndex(b => b._id === id || b.id === id);
        if (idx !== -1) {
          const updated = [...oldBookings];
          const current = updated[idx];
          const roomId = data.roomId || data.room || current.room?._id || current.roomId;
          const roomObj = (rooms && Array.isArray(rooms) ? rooms.find(r => r._id === roomId) : null) || current.room || { _id: roomId };
          updated[idx] = {
            ...current,
            customerName: data.customerName ?? current.customerName,
            phone: data.phone ?? current.phone,
            source: data.source ?? current.source,
            notes: data.notes ?? current.notes,
            room: roomObj,
            timeIn: data.timeIn ?? current.timeIn,
            timeOut: data.timeOut ?? current.timeOut,
            startTime: data.timeIn ?? current.startTime,
            endTime: data.timeOut ?? current.endTime,
          };
          queryClient.setQueryData(['bookings'], (old) => ({
            ...(old || {}),
            data: {
              ...((old || {}).data || {}),
              bookings: updated,
            },
          }));
        }
      } catch {}
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['bookings'], ctx.previous);
      
      // Use standardized error handling
      const errorInfo = handleApiError(err, {
        fallbackMessage: 'Failed to update booking. Please try again.',
        showToast: false // We'll handle specific messages manually
      });
      
      // Show specific error messages for known error codes
      if (err.response?.data?.code === 'OUTSIDE_BUSINESS_HOURS') {
        toast.error('Booking time is outside business hours. Please check the schedule for available times.');
      } else if (err.response?.data?.code === 'TIME_SLOT_CONFLICT') {
        toast.error('This time slot is already booked. Please choose a different time.');
      } else {
        toast.error(errorInfo.message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: (data) => {
      toast.success('Booking updated successfully');
      // Store the updated booking for confirmation
      // Bookings API returns {success: true, data: {booking: {...}}}
      const updatedBooking = data?.data?.booking || data?.data;
      if (updatedBooking) {
        setCreatedBooking(updatedBooking);
        setShowConfirmation(true);
      } else {
        onSuccess();
      }
    },
  });

  // Cancel booking mutation (optimistic)
  const cancelBookingMutation = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = queryClient.getQueryData(['bookings']);
      try {
        const oldBookings = previous?.data?.bookings || [];
        const updated = oldBookings.filter(b => (b._id || b.id) !== id);
        queryClient.setQueryData(['bookings'], (old) => ({
          ...(old || {}),
          data: {
            ...((old || {}).data || {}),
            bookings: updated,
          },
        }));
      } catch {}
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['bookings'], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      onSuccess();
    },
  });

  const onSubmit = (data) => {
    console.log('📝 Form data received:', data);
    
    // Validate required fields before processing
    const requiredFields = ['customerName', 'roomId', 'startTime', 'endTime'];
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      // Safe string check - handle both string and non-string values
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return value.trim() === '';
      if (typeof value === 'number') return value === 0;
      return !value;
    });
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate business hours before submission
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);
    
    // Validate that end time is after start time
    if (endDate <= startDate) {
      toast.error('End time must be after start time.');
      return;
    }
    
    if (!isWithinBusinessHours(startDate, data.startTime, data.endTime)) {
      toast.error('Booking time is outside business hours. Please choose a time within business hours.');
      return;
    }
    
    // Align payload with backend API expectations
    const bookingData = {
      // Map frontend field names to backend API field names
      customer_name: data.customerName,
      customer_email: data.email || '',
      customer_phone: data.phone || '',
      room_id: data.roomId,
      start_time: new Date(data.startTime).toISOString(),
      end_time: new Date(data.endTime).toISOString(),
      status: data.status || 'confirmed',
      notes: data.notes || '',
      total_price: data.totalPrice || 0,
      // Additional fields for frontend compatibility
      partySize: data.partySize,
      source: data.source,
      priority: data.priority,
      basePrice: data.basePrice,
      additionalFees: data.additionalFees,
      discount: data.discount,
      specialRequests: data.specialRequests,
      // Legacy field names for compatibility
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      roomId: data.roomId,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
    };

    console.log('📤 Booking data being sent:', bookingData);

    if (isEditing) {
      updateBookingMutation.mutate({ id: booking._id || booking.id, data: bookingData });
    } else {
      createBookingMutation.mutate(bookingData);
    }
  };

  const handleCancel = () => {
    if (booking.id) {
      cancelBookingMutation.mutate(booking.id);
    }
  };

  // Handle confirmation modal close
  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setCreatedBooking(null);
    onSuccess();
  };

  const selectedRoom = (rooms && Array.isArray(rooms) ? rooms.find(room => (room._id || room.id) === watch('roomId')) : null);
  
  // Get selected date from start time
  const selectedDate = watch('startTime') ? new Date(watch('startTime')) : new Date();
  
  // Get business hours for the selected date
  const weekday = selectedDate.getDay();
  const dayHours = getBusinessHoursForDay(weekday);

  // Helper function to render form fields based on settings or smart defaults
  const renderFormField = (fieldKey, fieldConfig, register, errors, options = {}) => {
    // Use smart defaults if no field config is provided
    const defaultVisibility = getDefaultFieldVisibility();
    const fieldVisibility = fieldConfig || defaultVisibility[fieldKey];
    
    // Essential fields should always be visible
    const essentialFields = ['customerName', 'phone', 'partySize', 'roomId', 'startTime', 'endTime', 'notes'];
    const isEssential = essentialFields.includes(fieldKey);
    
    // Debug logging - reduced for performance
    // console.log(`🔍 renderFormField(${fieldKey}):`, {
    //   fieldConfig,
    //   fieldVisibility,
    //   isEssential,
    //   willRender: fieldVisibility?.visible || isEssential
    // });
    
    if (!fieldVisibility?.visible && !isEssential) return null;

    const isRequired = fieldVisibility.required;
    const label = fieldConfig?.label || fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const placeholder = fieldConfig?.placeholder || `Enter ${label.toLowerCase()}`;
    
    // Get validation rules based on field configuration
    const getValidationRules = () => {
      const rules = {};
      if (isRequired) {
        rules.required = `${label} is required`;
      }
      
      switch (fieldConfig.validation) {
        case 'email':
          rules.pattern = {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Please enter a valid email address'
          };
          break;
        case 'phone':
          rules.pattern = {
            value: /^[\+]?[1-9][\d]{7,15}$/,
            message: 'Please enter a valid phone number (8-16 digits, starting with 1-9)'
          };
          break;
        case 'number':
          rules.pattern = {
            value: /^\d+$/,
            message: 'Please enter a valid number'
          };
          break;
        case 'currency':
          rules.pattern = {
            value: /^\d+(\.\d{1,2})?$/,
            message: 'Please enter a valid currency amount'
          };
          break;
      }
      
      return rules;
    };

    const validationRules = getValidationRules();

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {label} {isRequired && '*'}
        </label>
        <div className="relative">
          {options.icon && (
            <div className="absolute left-3 top-3 w-4 h-4 text-gray-400">
              {options.icon}
            </div>
          )}
          <Input
            {...register(fieldKey, validationRules)}
            placeholder={placeholder}
            className={options.icon ? "pl-10" : ""}
            type={fieldConfig.type === 'email' ? 'email' : fieldConfig.type === 'tel' ? 'tel' : fieldConfig.type === 'number' ? 'number' : 'text'}
          />
        </div>
        {errors[fieldKey] && (
          <p className="text-sm text-red-500">{errors[fieldKey].message}</p>
        )}
      </div>
    );
  };
  
  // Generate available time slots for the selected date
  const availableTimeSlots = getTimeSlotsForDay(selectedDate);
  
  // Check if selected times are within business hours
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const isTimeWithinBusinessHours = startTime && endTime ? 
    isWithinBusinessHours(selectedDate, startTime, endTime) : true;
  
  // Check if business is closed on selected date
  const isBusinessClosed = dayHours.isClosed;
  
  // Get business hours display text
  const getBusinessHoursText = () => {
    if (isBusinessClosed) {
      return 'Closed';
    }
    return `${dayHours.openTime} - ${dayHours.closeTime}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Exit Button - Top Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 h-12 w-12 z-10 bg-white hover:bg-gray-100 border border-gray-200 shadow-lg"
        >
          <X className="h-8 w-8 font-bold text-gray-700" />
        </Button>
        
        <CardHeader className="flex flex-row items-center space-y-0 pb-4 pr-16">
          <CardTitle>
            {isEditing ? 'Edit Booking' : 'New Booking'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFormField('customerName', settings.bookingFormFields?.customerName, register, errors, { icon: <User className="w-4 h-4" /> })}
                {renderFormField('phone', settings.bookingFormFields?.phone, register, errors, { icon: <Phone className="w-4 h-4" /> })}
                {renderFormField('email', settings.bookingFormFields?.email, register, errors, { icon: <Mail className="w-4 h-4" /> })}
                {renderFormField('partySize', settings.bookingFormFields?.partySize, register, errors, { icon: <Users className="w-4 h-4" /> })}
              </div>
            </div>

            {/* Custom Fields */}
            {settings.customBookingFields?.filter(field => field.visible).map((field) => (
              <div key={field.id} className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField(field.name, field, register, errors)}
                </div>
              </div>
            ))}

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Room Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Room Selection *
                  </label>
                  <CustomSelect
                    value={watch('roomId')}
                    onChange={(value) => setValue('roomId', value)}
                    options={rooms
                      ?.filter(r => r.status === 'active' && r.isBookable)
                      .map(r => ({ value: r._id || r.id, label: `${r.name} (${r.capacity} max) - $${r.hourlyRate || 0}/hour` }))}
                  />
                </div>
                  {(settings.bookingFormFields.source?.visible || !settings?.bookingFormFields) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {settings.bookingFormFields.source.label} {settings.bookingFormFields.source.required && '*'}
                      </label>
                      <CustomSelect
                        value={watch('source')}
                        onChange={(value) => setValue('source', value)}
                        options={[
                          { value: 'walk_in', label: 'Walk-in' },
                          { value: 'phone', label: 'Phone' },
                          { value: 'email', label: 'Email' },
                          { value: 'online', label: 'Online' },
                          { value: 'app', label: 'App' },
                          { value: 'other', label: 'Other' },
                        ]}
                      />
                    </div>
                  )}
                {/* Start Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Start Time *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      {...register('startTime', { 
                        required: 'Start time is required'
                      })}
                      type="datetime-local"
                      placeholder="Select start time"
                      className="pl-10"
                    />
                  </div>
                  {errors.startTime && (
                    <p className="text-sm text-red-500">{errors.startTime.message}</p>
                  )}
                </div>
                {/* End Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    End Time *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      {...register('endTime', { 
                        required: 'End time is required'
                      })}
                      type="datetime-local"
                      placeholder="Select end time"
                      className="pl-10"
                    />
                  </div>
                  {errors.endTime && (
                    <p className="text-sm text-red-500">{errors.endTime.message}</p>
                  )}
                </div>
                  {settings.bookingFormFields.status?.visible && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {settings.bookingFormFields.status.label} {settings.bookingFormFields.status.required && '*'}
                      </label>
                      <CustomSelect
                        value={watch('status')}
                        onChange={(value) => setValue('status', value)}
                        options={[
                          { value: 'confirmed', label: 'Confirmed' },
                          { value: 'pending', label: 'Pending' },
                          { value: 'cancelled', label: 'Cancelled' },
                          { value: 'completed', label: 'Completed' },
                        ]}
                      />
                    </div>
                  )}
                  {settings.bookingFormFields.priority?.visible && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {settings.bookingFormFields.priority.label} {settings.bookingFormFields.priority.required && '*'}
                      </label>
                      <CustomSelect
                        value={watch('priority')}
                        onChange={(value) => setValue('priority', value)}
                        options={[
                          { value: 'low', label: 'Low' },
                          { value: 'normal', label: 'Normal' },
                          { value: 'high', label: 'High' },
                          { value: 'urgent', label: 'Urgent' },
                        ]}
                      />
                    </div>
                  )}
              </div>
            </div>

            {/* Pricing */}
            {(settings.bookingFormFields.basePrice?.visible || settings.bookingFormFields.additionalFees?.visible || settings.bookingFormFields.discount?.visible || settings.bookingFormFields.totalPrice?.visible || !settings?.bookingFormFields) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderFormField('basePrice', settings.bookingFormFields.basePrice, register, errors, { icon: <DollarSign className="w-4 h-4" /> })}
                  {renderFormField('additionalFees', settings.bookingFormFields.additionalFees, register, errors, { icon: <DollarSign className="w-4 h-4" /> })}
                  {renderFormField('discount', settings.bookingFormFields.discount, register, errors, { icon: <DollarSign className="w-4 h-4" /> })}
                  {renderFormField('totalPrice', settings.bookingFormFields.totalPrice, register, errors, { icon: <DollarSign className="w-4 h-4" /> })}
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Notes Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notes
                  </label>
                  <textarea
                    {...register('notes')}
                    placeholder="Additional notes or special requests"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                  {settings.bookingFormFields.specialRequests?.visible && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {settings.bookingFormFields.specialRequests.label} {settings.bookingFormFields.specialRequests.required && '*'}
                      </label>
                      <textarea
                        {...register('specialRequests', { 
                          required: settings.bookingFormFields.specialRequests.required ? 'Special requests are required' : false 
                        })}
                        placeholder={settings.bookingFormFields.specialRequests.placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      {errors.specialRequests && (
                        <p className="text-sm text-red-500">{errors.specialRequests.message}</p>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Available Time Slots Preview */}
            {!isBusinessClosed && availableTimeSlots.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Available Time Slots</p>
                    <p className="mb-2">Bookings can only be made during business hours. Here are some available times:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableTimeSlots.slice(0, 8).map((slot, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {slot.displayTime}
                        </span>
                      ))}
                      {availableTimeSlots.length > 8 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          +{availableTimeSlots.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Room Info Display */}
            {selectedRoom && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Room Information</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{selectedRoom.capacity} people</span>
                  </div>
                  <Badge className="text-xs">
                    {selectedRoom.type}
                  </Badge>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedRoom.color }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelBookingMutation.isPending}
                >
                  {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  createBookingMutation.isPending || 
                  updateBookingMutation.isPending || 
                  isBusinessClosed || 
                  (!isTimeWithinBusinessHours && startTime && endTime)
                }
                className="flex items-center space-x-2"
              >
                {createBookingMutation.isPending || updateBookingMutation.isPending
                  ? 'Saving...'
                  : isBusinessClosed
                  ? 'Business Closed'
                  : !isTimeWithinBusinessHours && startTime && endTime
                  ? 'Outside Business Hours'
                  : isEditing
                  ? 'Update Booking'
                  : 'Create Booking'
                }
                {!isEditing && (
                  <FileText className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Booking Confirmation Modal */}
      <BookingConfirmation
        isOpen={showConfirmation}
        onClose={handleConfirmationClose}
        booking={createdBooking}
      />
    </div>
  );
};

export default BookingModal;