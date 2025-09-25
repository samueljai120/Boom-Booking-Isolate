import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Calendar as CalendarIcon, Clock, Users, Phone } from 'lucide-react';
import BookingModal from './BookingModal';
import { useQuery } from '@tanstack/react-query';
import { bookingsAPI, roomsAPI } from '../lib/unifiedApiClient';
import { useSafeData } from '../utils/dataNormalization';

const localizer = momentLocalizer(moment);

const Scheduler = ({ selectedDate, onDateChange }) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState('day');

  // Fetch rooms
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsAPI.getAll(),
  });

  // Fetch bookings for selected date
  const { data: bookingsData, refetch: refetchBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', selectedDate],
    queryFn: () => bookingsAPI.getAll({ date: moment(selectedDate).format('YYYY-MM-DD') }),
    enabled: !!selectedDate,
  });

  // Use safe data handling utilities
  const { data: rooms } = useSafeData(roomsData, 'rooms');
  const { data: bookings } = useSafeData(bookingsData, 'bookings');

  // Transform bookings for calendar
  const events = useMemo(() => {
    return bookings.map(booking => {
      // Normalize booking data from API response
      const normalizedBooking = {
        _id: booking.id || booking._id,
        id: booking.id || booking._id,
        customerName: booking.customer_name || booking.customerName,
        phone: booking.customer_phone || booking.phone,
        email: booking.customer_email || booking.email,
        startTime: booking.start_time || booking.startTime,
        endTime: booking.end_time || booking.endTime,
        roomId: booking.room_id ? {
          _id: booking.room_id,
          id: booking.room_id,
          name: booking.room_name,
          capacity: booking.capacity,
          category: booking.category,
          type: booking.category,
          color: '#3B82F6'
        } : booking.roomId,
        room: booking.room || {
          _id: booking.room_id,
          id: booking.room_id,
          name: booking.room_name,
          capacity: booking.capacity,
          category: booking.category,
          type: booking.category,
          color: '#3B82F6'
        },
        notes: booking.notes || '',
        source: booking.source || 'web',
        status: booking.status || 'confirmed',
        totalPrice: parseFloat(booking.total_price || booking.totalPrice || 0)
      };

      return {
        id: normalizedBooking._id,
        title: normalizedBooking.customerName,
        start: new Date(normalizedBooking.startTime),
        end: new Date(normalizedBooking.endTime),
        resource: {
          roomId: normalizedBooking.roomId?._id || normalizedBooking.roomId?.id,
          roomName: normalizedBooking.roomId?.name || normalizedBooking.room?.name || 'Unknown room',
          roomType: normalizedBooking.roomId?.type || normalizedBooking.roomId?.category,
          capacity: normalizedBooking.roomId?.capacity,
          color: normalizedBooking.roomId?.color,
          phone: normalizedBooking.phone,
          source: normalizedBooking.source,
          notes: normalizedBooking.notes,
          duration: Math.round((new Date(normalizedBooking.endTime) - new Date(normalizedBooking.startTime)) / (1000 * 60)),
        },
      };
    });
  }, [bookings]);

  // Get room type color
  const getRoomTypeColor = (type) => {
    const colors = {
      medium: '#3B82F6',
      large: '#10B981',
      party: '#F59E0B',
    };
    return colors[type] || '#3B82F6';
  };

  // Event style getter
  const eventStyleGetter = (event) => {
    const color = event.resource?.color || getRoomTypeColor(event.resource?.roomType);
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 4px',
      },
    };
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    setSelectedBooking(event);
    setIsModalOpen(true);
  };

  // Handle slot selection
  const handleSelectSlot = ({ start, end, resource }) => {
    if (resource) {
      setSelectedBooking({
        start,
        end,
        resource: {
          roomId: resource.id,
          roomName: resource.name,
          roomType: resource.type,
          capacity: resource.capacity,
        },
      });
      setIsModalOpen(true);
    }
  };

  // Custom event component
  const EventComponent = ({ event }) => (
    <div className="booking-card p-1">
      <div className="font-medium text-xs truncate">{event.title}</div>
      <div className="text-xs opacity-90">
        {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
      </div>
      <div className="text-xs opacity-75">
        {event.resource?.roomName}
      </div>
    </div>
  );

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('PREV')}
        >
          ←
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('NEXT')}
        >
          →
        </Button>
        <h2 className="text-lg font-semibold">{label}</h2>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant={view === 'day' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onView('day')}
        >
          Day
        </Button>
        <Button
          variant={view === 'week' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onView('week')}
        >
          Week
        </Button>
      </div>
    </div>
  );

  // Resources for day view
  const resources = useMemo(() => {
    return rooms.map(room => ({
      id: room._id,
      title: (
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: room.color || getRoomTypeColor(room.category) }}
          />
          <span className="font-medium">{room.name || 'Unnamed Room'}</span>
          <Badge className="text-xs">
            {room.capacity}
          </Badge>
        </div>
      ),
      name: room.name || 'Unnamed Room',
      type: room.category,
      capacity: room.capacity,
      color: room.color || getRoomTypeColor(room.category),
    }));
  }, [rooms]);

  if (roomsLoading || bookingsLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="scheduler-container">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5" />
          <span>Karaoke Schedule - {moment(selectedDate).format('MMMM D, YYYY')}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            resources={resources}
            resourceAccessor="resource"
            resourceIdAccessor="id"
            resourceTitleAccessor="title"
            view={view}
            views={['day', 'week']}
            date={selectedDate}
            onNavigate={onDateChange}
            onView={setView}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            showMultiDayTimes
            step={60}
            timeslots={1}
            min={new Date(2024, 0, 1, 8, 0)} // 8 AM
            max={new Date(2024, 0, 1, 24, 0)} // 12 AM
            components={{
              event: EventComponent,
              toolbar: CustomToolbar,
            }}
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}
          />
        </div>
      </CardContent>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        rooms={rooms}
        onSuccess={() => {
          refetchBookings();
          setIsModalOpen(false);
          setSelectedBooking(null);
        }}
      />
    </div>
  );
};

export default Scheduler;