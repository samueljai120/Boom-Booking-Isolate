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
import { bookingsAPI } from '../lib/api';
import { useBusinessHours } from '../contexts/BusinessHoursContext';
import { useSettings } from '../contexts/SettingsContext';
import toast from 'react-hot-toast';
import BookingConfirmation from './BookingConfirmation';

const BookingModal = ({ isOpen, onClose, booking, rooms, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const queryClient = useQueryClient();
  const { getBusinessHoursForDay, isWithinBusinessHours, getTimeSlotsForDay } = useBusinessHours();
  const { settings } = useSettings();

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
    }
  });

  // Reset form when booking changes
  useEffect(() => {
    if (booking) {
      if (booking.id) {
        // Editing existing booking
        setIsEditing(true);
        reset({
          customerName: booking.title || booking.customerName || '',
          phone: booking.resource?.phone || booking.phone || '',
          email: booking.resource?.email || booking.email || '',
          partySize: booking.resource?.partySize || booking.partySize || '',
          source: booking.resource?.source || booking.source || 'walk_in',
          startTime: moment(booking.start).format('YYYY-MM-DDTHH:mm'),
          endTime: moment(booking.end).format('YYYY-MM-DDTHH:mm'),
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
        // Creating new booking
        setIsEditing(false);
        reset({
          customerName: '',
          phone: '',
          email: '',
          partySize: '',
          source: 'walk_in',
          startTime: moment(booking.start).format('YYYY-MM-DDTHH:mm'),
          endTime: moment(booking.end).format('YYYY-MM-DDTHH:mm'),
          status: 'confirmed',
          priority: 'normal',
          basePrice: '',
          additionalFees: '',
          discount: '',
          totalPrice: '',
          notes: '',
          specialRequests: '',
          roomId: booking.resource?.roomId || '',
        });
      }
    }
  }, [booking, reset]);

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
      
      // Show specific error messages
      if (err.response?.data?.code === 'OUTSIDE_BUSINESS_HOURS') {
        toast.error('Booking time is outside business hours. Please check the schedule for available times.');
      } else if (err.response?.data?.code === 'TIME_SLOT_CONFLICT') {
        toast.error('This time slot is already booked. Please choose a different time.');
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to create booking. Please try again.');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: (data) => {
      toast.success('Booking created successfully');
      // Store the created booking for confirmation
      const newBooking = data?.data?.booking || data?.data?.data?.booking || data?.data;
      if (newBooking) {
        setCreatedBooking(newBooking);
        setShowConfirmation(true);
      } else {
        onSuccess();
      }
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
      
      // Show specific error messages
      if (err.response?.data?.code === 'OUTSIDE_BUSINESS_HOURS') {
        toast.error('Booking time is outside business hours. Please check the schedule for available times.');
      } else if (err.response?.data?.code === 'TIME_SLOT_CONFLICT') {
        toast.error('This time slot is already booked. Please choose a different time.');
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to update booking. Please try again.');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSuccess: (data) => {
      toast.success('Booking updated successfully');
      // Store the updated booking for confirmation
      const updatedBooking = data?.data?.booking || data?.data?.data?.booking || data?.data;
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
      customerName: data.customerName,
      phone: data.phone,
      email: data.email,
      partySize: data.partySize,
      source: data.source,
      status: data.status,
      priority: data.priority,
      basePrice: data.basePrice,
      additionalFees: data.additionalFees,
      discount: data.discount,
      totalPrice: data.totalPrice,
      notes: data.notes,
      specialRequests: data.specialRequests,
      roomId: data.roomId,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
    };

    if (isEditing) {
      updateBookingMutation.mutate({ id: booking.id, data: bookingData });
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
            {(settings.bookingFormFields.customerName || settings.bookingFormFields.phone || settings.bookingFormFields.email || settings.bookingFormFields.partySize) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.bookingFormFields.customerName && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Customer Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('customerName', { 
                            required: settings.bookingFormFields.customerName ? 'Customer name is required' : false 
                          })}
                          placeholder="Enter customer name"
                          className="pl-10"
                        />
                      </div>
                      {errors.customerName && (
                        <p className="text-sm text-red-500">{errors.customerName.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.phone && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('phone', { 
                            required: settings.bookingFormFields.phone ? 'Phone number is required' : false,
                            pattern: {
                              value: /^[\+]?[1-9][\d]{7,15}$/,
                              message: 'Please enter a valid phone number (8-16 digits, starting with 1-9)'
                            }
                          })}
                          placeholder="Enter phone number (e.g., 15551234567)"
                          className="pl-10"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.email && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('email', {
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Please enter a valid email address'
                            }
                          })}
                          placeholder="Enter email address"
                          className="pl-10"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.partySize && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Party Size</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('partySize', {
                            pattern: {
                              value: /^\d+$/,
                              message: 'Please enter a valid number'
                            }
                          })}
                          placeholder="Enter party size"
                          className="pl-10"
                          type="number"
                          min="1"
                        />
                      </div>
                      {errors.partySize && (
                        <p className="text-sm text-red-500">{errors.partySize.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Details */}
            {(settings.bookingFormFields.room || settings.bookingFormFields.source || settings.bookingFormFields.timeIn || settings.bookingFormFields.timeOut || settings.bookingFormFields.status || settings.bookingFormFields.priority) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.bookingFormFields.room && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Room *</label>
                      <CustomSelect
                        value={watch('roomId')}
                        onChange={(value) => setValue('roomId', value)}
                        options={rooms
                          .filter(r => r.status === 'active' && r.isBookable)
                          .map(r => ({ value: r._id || r.id, label: `${r.name} (${r.capacity} max) - $${r.hourlyRate || 0}/hour` }))}
                      />
                      <input
                        {...register('roomId', { 
                          required: settings.bookingFormFields.room ? 'Room is required' : false 
                        })}
                        type="hidden"
                      />
                      {errors.roomId && (
                        <p className="text-sm text-red-500">{errors.roomId.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.source && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Source</label>
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
                  {settings.bookingFormFields.status && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
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
                  {settings.bookingFormFields.priority && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
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
            )}

            {/* Time Selection */}
            {(settings.bookingFormFields.timeIn || settings.bookingFormFields.timeOut) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Time Selection</h3>
                {/* Business Hours Status */}
                <div className={`p-3 rounded-lg border ${
                  isBusinessClosed 
                    ? 'bg-red-50 border-red-200' 
                    : isTimeWithinBusinessHours 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    <Clock className={`w-4 h-4 mr-2 ${
                      isBusinessClosed 
                        ? 'text-red-600' 
                        : isTimeWithinBusinessHours 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                    }`} />
                    <div className="text-sm">
                      <span className="font-medium">
                        {moment(selectedDate).format('dddd, MMMM D, YYYY')}
                      </span>
                      <span className="ml-2">
                        {isBusinessClosed ? (
                          <span className="text-red-600 font-medium">Closed</span>
                        ) : (
                          <span className="text-gray-600">
                            Business Hours: {getBusinessHoursText()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {!isTimeWithinBusinessHours && !isBusinessClosed && (
                    <div className="mt-2 flex items-start">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Selected time is outside business hours. Please choose a time between {dayHours.openTime} and {dayHours.closeTime}.
                      </p>
                    </div>
                  )}
                  {isBusinessClosed && (
                    <div className="mt-2 flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">
                        Business is closed on this date. Please choose a different date.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.bookingFormFields.timeIn && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Time *</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          type="datetime-local"
                          {...register('startTime', { 
                            required: settings.bookingFormFields.timeIn ? 'Start time is required' : false,
                            validate: (value) => {
                              if (!value) return true;
                              const selectedDate = new Date(value);
                              const dayHours = getBusinessHoursForDay(selectedDate.getDay());
                              if (dayHours.isClosed) {
                                return 'Business is closed on this date';
                              }
                              return true;
                            }
                          })}
                          className={`pl-10 ${
                            !isTimeWithinBusinessHours && !isBusinessClosed 
                              ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' 
                              : isBusinessClosed 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : ''
                          }`}
                          min={isBusinessClosed ? undefined : moment(selectedDate).format('YYYY-MM-DDTHH:mm')}
                          max={isBusinessClosed ? undefined : moment(selectedDate).endOf('day').format('YYYY-MM-DDTHH:mm')}
                        />
                      </div>
                      {errors.startTime && (
                        <p className="text-sm text-red-500">{errors.startTime.message}</p>
                      )}
                    </div>
                  )}

                  {settings.bookingFormFields.timeOut && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Time *</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          type="datetime-local"
                          {...register('endTime', { 
                            required: settings.bookingFormFields.timeOut ? 'End time is required' : false,
                            validate: (value) => {
                              if (!value) return true;
                              const selectedDate = new Date(value);
                              const dayHours = getBusinessHoursForDay(selectedDate.getDay());
                              if (dayHours.isClosed) {
                                return 'Business is closed on this date';
                              }
                              
                              // Check if end time is after start time
                              const startTime = watch('startTime');
                              if (startTime && value) {
                                const startDate = new Date(startTime);
                                const endDate = new Date(value);
                                if (endDate <= startDate) {
                                  return 'End time must be after start time';
                                }
                              }
                              
                              return true;
                            }
                          })}
                          className={`pl-10 ${
                            !isTimeWithinBusinessHours && !isBusinessClosed 
                              ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' 
                              : isBusinessClosed 
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : ''
                          }`}
                          min={isBusinessClosed ? undefined : moment(selectedDate).format('YYYY-MM-DDTHH:mm')}
                          max={isBusinessClosed ? undefined : moment(selectedDate).endOf('day').format('YYYY-MM-DDTHH:mm')}
                        />
                      </div>
                      {errors.endTime && (
                        <p className="text-sm text-red-500">{errors.endTime.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Pricing */}
            {(settings.bookingFormFields.basePrice || settings.bookingFormFields.additionalFees || settings.bookingFormFields.discount || settings.bookingFormFields.totalPrice) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.bookingFormFields.basePrice && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Base Price</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('basePrice', {
                            pattern: {
                              value: /^\d+(\.\d{1,2})?$/,
                              message: 'Please enter a valid price (e.g., 25.00)'
                            }
                          })}
                          placeholder="Enter base price"
                          className="pl-10"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {errors.basePrice && (
                        <p className="text-sm text-red-500">{errors.basePrice.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.additionalFees && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Additional Fees</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('additionalFees', {
                            pattern: {
                              value: /^\d+(\.\d{1,2})?$/,
                              message: 'Please enter a valid amount (e.g., 5.00)'
                            }
                          })}
                          placeholder="Enter additional fees"
                          className="pl-10"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {errors.additionalFees && (
                        <p className="text-sm text-red-500">{errors.additionalFees.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.discount && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Discount</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('discount', {
                            pattern: {
                              value: /^\d+(\.\d{1,2})?$/,
                              message: 'Please enter a valid discount amount (e.g., 10.00)'
                            }
                          })}
                          placeholder="Enter discount amount"
                          className="pl-10"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {errors.discount && (
                        <p className="text-sm text-red-500">{errors.discount.message}</p>
                      )}
                    </div>
                  )}
                  {settings.bookingFormFields.totalPrice && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Price</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          {...register('totalPrice', {
                            pattern: {
                              value: /^\d+(\.\d{1,2})?$/,
                              message: 'Please enter a valid total price (e.g., 30.00)'
                            }
                          })}
                          placeholder="Enter total price"
                          className="pl-10"
                          type="number"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      {errors.totalPrice && (
                        <p className="text-sm text-red-500">{errors.totalPrice.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(settings.bookingFormFields.notes || settings.bookingFormFields.specialRequests) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-4">
                  {settings.bookingFormFields.notes && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          {...register('notes')}
                          placeholder="Additional notes..."
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                  {settings.bookingFormFields.specialRequests && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Special Requests</label>
                      <div className="relative">
                        <Star className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          {...register('specialRequests')}
                          placeholder="Any special requests or requirements..."
                          className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
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