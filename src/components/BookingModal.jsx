import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { X, Calendar, Clock, Users, Phone, Mail, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../lib/api';
import toast from 'react-hot-toast';

const BookingModal = ({ isOpen, onClose, booking, rooms, onSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerName: '',
      phone: '',
      source: 'walk_in',
      startTime: '',
      endTime: '',
      notes: '',
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
          customerName: booking.title || '',
          phone: booking.resource?.phone || '',
          source: booking.resource?.source || 'walk_in',
          startTime: moment(booking.start).format('YYYY-MM-DDTHH:mm'),
          endTime: moment(booking.end).format('YYYY-MM-DDTHH:mm'),
          notes: booking.resource?.notes || '',
          roomId: booking.resource?.roomId || '',
        });
      } else {
        // Creating new booking
        setIsEditing(false);
        reset({
          customerName: '',
          phone: '',
          source: 'walk_in',
          startTime: moment(booking.start).format('YYYY-MM-DDTHH:mm'),
          endTime: moment(booking.end).format('YYYY-MM-DDTHH:mm'),
          notes: '',
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
          timeIn: newData.timeIn,
          timeOut: newData.timeOut,
          startTime: newData.timeIn,
          endTime: newData.timeOut,
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
    onSuccess: () => {
      toast.success('Booking created successfully');
      onSuccess();
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
    onSuccess: () => {
      toast.success('Booking updated successfully');
      onSuccess();
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
    // Align payload with backend API expectations
    const bookingData = {
      customerName: data.customerName,
      phone: data.phone,
      source: data.source,
      notes: data.notes,
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

  const selectedRoom = (rooms && Array.isArray(rooms) ? rooms.find(room => (room._id || room.id) === watch('roomId')) : null);

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
            {/* Room Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Room</label>
              <select
                {...register('roomId', { required: 'Room is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room._id || room.id} value={room._id || room.id}>
                    {room.name} ({room.capacity} people) - {room.category}
                  </option>
                ))}
              </select>
              {errors.roomId && (
                <p className="text-sm text-red-500">{errors.roomId.message}</p>
              )}
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    {...register('customerName', { required: 'Customer name is required' })}
                    placeholder="Enter customer name"
                    className="pl-10"
                  />
                </div>
                {errors.customerName && (
                  <p className="text-sm text-red-500">{errors.customerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    {...register('phone', { 
                      required: 'Phone number is required',
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
            </div>

            {/* Source */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <select 
                {...register('source')} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="walk_in">Walk-in</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="datetime-local"
                    {...register('startTime', { required: 'Start time is required' })}
                    className="pl-10"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="datetime-local"
                    {...register('endTime', { required: 'End time is required' })}
                    className="pl-10"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-sm text-red-500">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            {/* Business Hours Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Business Hours</p>
                  <p>Bookings can only be made during business hours. Check the schedule for available times.</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                {...register('notes')}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                rows={3}
              />
            </div>

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
                disabled={createBookingMutation.isPending || updateBookingMutation.isPending}
              >
                {createBookingMutation.isPending || updateBookingMutation.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Booking'
                  : 'Create Booking'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingModal;