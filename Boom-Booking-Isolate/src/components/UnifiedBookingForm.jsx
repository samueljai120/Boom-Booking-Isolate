/**
 * Unified Booking Form Component
 * 
 * This component provides a consistent booking form experience across:
 * - Settings page room management
 * - + button on dashboard
 * - Schedule grid slot clicks
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../lib/unifiedApiClient';
import { useBusinessHours } from '../contexts/BusinessHoursContext';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { X, Calendar, Clock, User, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment-timezone';

const UnifiedBookingForm = ({ 
  isOpen, 
  onClose, 
  booking = null, 
  rooms = [], 
  selectedDate = null,
  selectedTime = null,
  selectedRoom = null,
  isEditing = false,
  onSuccess = () => {}
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { getBusinessHoursForDay, isWithinBusinessHours } = useBusinessHours();
  const { settings } = useSettings();

  // Form configuration
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      partySize: '1',
      source: 'walk_in',
      startTime: '',
      endTime: '',
      status: 'confirmed',
      priority: 'normal',
      notes: '',
      specialRequests: '',
      roomId: '',
    },
    mode: 'onChange',
    shouldUnregister: false,
  });

  // Watch form data for real-time updates
  const watchedData = watch();

  // Initialize form with provided data
  useEffect(() => {
    if (isOpen) {
      if (isEditing && booking) {
        // Editing existing booking
        reset({
          customerName: booking.customerName || booking.customer_name || '',
          phone: booking.phone || booking.customer_phone || '',
          email: booking.email || booking.customer_email || '',
          partySize: booking.partySize || '1',
          source: booking.source || 'walk_in',
          startTime: booking.startTime ? moment(booking.startTime).format('YYYY-MM-DDTHH:mm') : '',
          endTime: booking.endTime ? moment(booking.endTime).format('YYYY-MM-DDTHH:mm') : '',
          status: booking.status || 'confirmed',
          priority: booking.priority || 'normal',
          notes: booking.notes || '',
          specialRequests: booking.specialRequests || '',
          roomId: booking.roomId || booking.room_id || (booking.room?.id || booking.room?._id) || '',
        });
      } else {
        // New booking - use provided defaults or smart defaults
        const smartDefaults = getSmartDefaults(rooms, selectedDate, selectedTime, selectedRoom);
        reset(smartDefaults);
      }
    }
  }, [isOpen, isEditing, booking, rooms, selectedDate, selectedTime, selectedRoom, reset]);

  // Get smart default values for new bookings
  const getSmartDefaults = (rooms, selectedDate, selectedTime, selectedRoom) => {
    const now = moment();
    const date = selectedDate ? moment(selectedDate) : now;
    const time = selectedTime ? moment(selectedTime) : now.clone().add(1, 'hour');
    
    return {
      customerName: '',
      phone: '',
      email: '',
      partySize: '1',
      source: 'walk_in',
      startTime: time.format('YYYY-MM-DDTHH:mm'),
      endTime: time.clone().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      status: 'confirmed',
      priority: 'normal',
      notes: '',
      specialRequests: '',
      roomId: selectedRoom?.id || selectedRoom?._id || (rooms && rooms.length > 0 ? rooms[0].id || rooms[0]._id : ''),
    };
  };

  // Get selected room details
  const selectedRoomData = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return null;
    return rooms.find(room => (room.id || room._id) === watchedData.roomId);
  }, [rooms, watchedData.roomId]);

  // Get business hours for selected date
  const selectedDateMoment = watchedData.startTime ? moment(watchedData.startTime) : moment();
  const weekday = selectedDateMoment.day();
  const dayHours = getBusinessHoursForDay(weekday);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingsAPI.create(data),
    onSuccess: (response) => {
      toast.success('Booking created successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create booking';
      toast.error(errorMessage);
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => bookingsAPI.update(id, data),
    onSuccess: () => {
      toast.success('Booking updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update booking';
      toast.error(errorMessage);
    },
  });

  // Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = ['customerName', 'roomId', 'startTime', 'endTime'];
      const missingFields = requiredFields.filter(field => {
        const value = data[field];
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        return !value;
      });

      if (missingFields.length > 0) {
        toast.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate business hours
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);

      if (endDate <= startDate) {
        toast.error('End time must be after start time.');
        return;
      }

      if (!isWithinBusinessHours(startDate, data.startTime, data.endTime)) {
        toast.error('Booking time is outside business hours. Please choose a time within business hours.');
        return;
      }

      // Calculate total price
      const duration = moment(endDate).diff(moment(startDate), 'minutes');
      const hourlyRate = selectedRoomData?.pricePerHour || selectedRoomData?.price_per_hour || 25;
      const totalPrice = (duration / 60) * hourlyRate;

      // Prepare booking data
      const bookingData = {
        customer_name: data.customerName,
        customer_email: data.email || '',
        customer_phone: data.phone || '',
        room_id: data.roomId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: data.status || 'confirmed',
        notes: data.notes || '',
        total_price: totalPrice,
        // Additional fields for compatibility
        partySize: data.partySize,
        source: data.source,
        priority: data.priority,
        specialRequests: data.specialRequests,
      };

      if (isEditing && booking) {
        updateBookingMutation.mutate({ 
          id: booking.id || booking._id, 
          data: bookingData 
        });
      } else {
        createBookingMutation.mutate(bookingData);
      }
    } catch (error) {
      toast.error('An error occurred while processing the booking');
      console.error('Booking submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    reset();
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Booking' : 'Create New Booking'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    {...register('customerName', { required: 'Customer name is required' })}
                    placeholder="Enter customer name"
                    disabled={isSubmitting}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-red-600">{errors.customerName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter phone number"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partySize">Party Size</Label>
                  <Select
                    value={watchedData.partySize}
                    onValueChange={(value) => setValue('partySize', value)}
                    disabled={isSubmitting}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                      <option key={size} value={size.toString()}>
                        {size} {size === 1 ? 'person' : 'people'}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Booking Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Room *</Label>
                  <Select
                    value={watchedData.roomId}
                    onValueChange={(value) => setValue('roomId', value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Select a room</option>
                    {rooms.map(room => (
                      <option key={room.id || room._id} value={room.id || room._id}>
                        {room.name} ({room.category}) - ${room.pricePerHour || room.price_per_hour || 25}/hr
                      </option>
                    ))}
                  </Select>
                  {errors.roomId && (
                    <p className="text-sm text-red-600">{errors.roomId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Booking Source</Label>
                  <Select
                    value={watchedData.source}
                    onValueChange={(value) => setValue('source', value)}
                    disabled={isSubmitting}
                  >
                    <option value="walk_in">Walk-in</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="online">Online</option>
                    <option value="message">Message</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    {...register('startTime', { required: 'Start time is required' })}
                    disabled={isSubmitting}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    {...register('endTime', { required: 'End time is required' })}
                    disabled={isSubmitting}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              {/* Business Hours Info */}
              {dayHours && !dayHours.isClosed && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Business Hours: {dayHours.openTime} - {dayHours.closeTime}
                  </p>
                </div>
              )}

              {dayHours && dayHours.isClosed && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Business is closed on this day
                  </p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Additional Information
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Any special notes or requirements..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    {...register('specialRequests')}
                    placeholder="Any special requests or accommodations..."
                    rows={2}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            {selectedRoomData && watchedData.startTime && watchedData.endTime && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Price Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span>{selectedRoomData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>
                      {moment(watchedData.endTime).diff(moment(watchedData.startTime), 'hours', true).toFixed(1)} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>${selectedRoomData.pricePerHour || selectedRoomData.price_per_hour || 25}/hour</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>
                      ${((moment(watchedData.endTime).diff(moment(watchedData.startTime), 'minutes') / 60) * 
                        (selectedRoomData.pricePerHour || selectedRoomData.price_per_hour || 25)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Processing...' : (isEditing ? 'Update Booking' : 'Create Booking')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedBookingForm;

