# Calendar Booking Baseline: Current Logic & Edge Cases

## Overview

This document provides comprehensive documentation of the current booking logic, business rules, edge cases, and safeguards within the Boom Karaoke Booking System. It serves as the baseline reference for understanding existing functionality before optimization and enhancement.

## Core Booking Logic

### Booking Creation Process

#### 1. Input Validation
```javascript
// Frontend validation (BookingModal.jsx)
const validateBookingData = (data) => {
  const errors = {};
  
  // Required fields
  if (!data.customer_name?.trim()) {
    errors.customer_name = 'Customer name is required';
  }
  
  // Email validation
  if (data.customer_email && !isValidEmail(data.customer_email)) {
    errors.customer_email = 'Invalid email format';
  }
  
  // Phone validation
  if (data.customer_phone && !isValidPhone(data.customer_phone)) {
    errors.customer_phone = 'Invalid phone format';
  }
  
  // Time validation
  if (!data.start_time || !data.end_time) {
    errors.time = 'Start and end times are required';
  } else if (moment(data.end_time).isSameOrBefore(data.start_time)) {
    errors.time = 'End time must be after start time';
  }
  
  // Room validation
  if (!data.room_id) {
    errors.room_id = 'Room selection is required';
  }
  
  return errors;
};
```

#### 2. Business Rules Validation
```javascript
// Backend validation (routes/bookings.js)
const validateBusinessRules = (bookingData, roomData, businessHours) => {
  const errors = [];
  
  // 1. Minimum booking duration (60 minutes)
  const duration = moment(bookingData.end_time).diff(moment(bookingData.start_time), 'minutes');
  if (duration < 60) {
    errors.push('Minimum booking duration is 60 minutes');
  }
  
  // 2. Maximum booking duration (8 hours = 480 minutes)
  if (duration > 480) {
    errors.push('Maximum booking duration is 8 hours');
  }
  
  // 3. Business hours validation
  const startTime = moment(bookingData.start_time);
  const dayOfWeek = startTime.day();
  const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
  
  if (!dayHours || dayHours.is_closed) {
    errors.push('Booking time is outside business hours');
  } else {
    const openTime = moment(dayHours.open_time, 'HH:mm');
    const closeTime = moment(dayHours.close_time, 'HH:mm');
    const bookingStart = moment(startTime.format('HH:mm'), 'HH:mm');
    const bookingEnd = moment(bookingData.end_time.format('HH:mm'), 'HH:mm');
    
    if (bookingStart.isBefore(openTime) || bookingEnd.isAfter(closeTime)) {
      errors.push('Booking time is outside business hours');
    }
  }
  
  // 4. Advance booking limit (30 days)
  const bookingDate = moment(bookingData.start_time);
  const maxAdvanceDate = moment().add(30, 'days');
  if (bookingDate.isAfter(maxAdvanceDate)) {
    errors.push('Cannot book more than 30 days in advance');
  }
  
  // 5. Past booking restriction
  const now = moment();
  if (bookingDate.isBefore(now, 'day')) {
    errors.push('Cannot book in the past');
  }
  
  return errors;
};
```

#### 3. Conflict Detection Algorithm
```javascript
// Time conflict detection (routes/bookings.js)
const checkTimeConflicts = async (roomId, startTime, endTime, excludeBookingId = null) => {
  const conflictQuery = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND status != 'cancelled'
    ${excludeBookingId ? 'AND id != ?' : ''}
    AND (
      (start_time < ? AND end_time > ?) OR 
      (start_time < ? AND end_time > ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `;
  
  const params = [roomId];
  if (excludeBookingId) params.push(excludeBookingId);
  params.push(endTime, startTime, startTime, endTime, startTime, endTime);
  
  const result = await db.get(conflictQuery, params);
  return result.count > 0;
};
```

#### 4. Price Calculation Logic
```javascript
// Price calculation (routes/bookings.js)
const calculateBookingPrice = (startTime, endTime, pricePerHour) => {
  const start = moment(startTime);
  const end = moment(endTime);
  
  // Calculate duration in hours (with minute precision)
  const durationHours = end.diff(start, 'minutes') / 60;
  
  // Round up to nearest 15-minute increment
  const roundedHours = Math.ceil(durationHours * 4) / 4;
  
  // Calculate total price
  const totalPrice = roundedHours * pricePerHour;
  
  return {
    durationHours: roundedHours,
    totalPrice: Math.round(totalPrice * 100) / 100 // Round to 2 decimal places
  };
};
```

### Booking Status Management

#### Status Lifecycle
```javascript
// Booking status definitions
const BOOKING_STATUSES = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
};

// Status transition rules
const STATUS_TRANSITIONS = {
  'confirmed': ['cancelled', 'completed', 'no_show'],
  'cancelled': [], // Terminal state
  'completed': [], // Terminal state
  'no_show': []    // Terminal state
};

const canTransitionTo = (currentStatus, newStatus) => {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};
```

#### Status Update Logic
```javascript
// Status update with validation (routes/bookings.js)
const updateBookingStatus = async (bookingId, newStatus, reason = null) => {
  // 1. Get current booking
  const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  // 2. Validate status transition
  if (!canTransitionTo(booking.status, newStatus)) {
    throw new Error(`Invalid status transition from ${booking.status} to ${newStatus}`);
  }
  
  // 3. Apply business rules
  if (newStatus === 'cancelled') {
    const bookingStart = moment(booking.start_time);
    const now = moment();
    const hoursUntilBooking = bookingStart.diff(now, 'hours');
    
    // Cancellation policy: 24-hour notice required
    if (hoursUntilBooking < 24) {
      throw new Error('Cancellation requires 24-hour notice');
    }
  }
  
  // 4. Update status
  await db.run(
    'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newStatus, bookingId]
  );
  
  return { success: true, newStatus };
};
```

## Calendar Display Logic

### Time Slot Generation

#### 1. Business Hours Time Slots
```javascript
// Generate time slots based on business hours (BusinessHoursContext.jsx)
const generateTimeSlots = (businessHours, date) => {
  const slots = [];
  const dayOfWeek = moment(date).day();
  const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
  
  if (!dayHours || dayHours.is_closed) {
    return slots;
  }
  
  const openTime = moment(dayHours.open_time, 'HH:mm');
  const closeTime = moment(dayHours.close_time, 'HH:mm');
  const currentTime = openTime.clone();
  
  // Generate 15-minute intervals
  while (currentTime.isBefore(closeTime)) {
    slots.push({
      time: currentTime.format('HH:mm'),
      datetime: moment(date).hour(currentTime.hour()).minute(currentTime.minute()).toISOString(),
      available: true
    });
    currentTime.add(15, 'minutes');
  }
  
  return slots;
};
```

#### 2. Availability Calculation
```javascript
// Calculate room availability (AppleCalendarDashboard.jsx)
const calculateRoomAvailability = (room, bookings, timeSlot) => {
  const slotStart = moment(timeSlot.datetime);
  const slotEnd = slotStart.clone().add(15, 'minutes');
  
  // Check for overlapping bookings
  const conflictingBooking = bookings.find(booking => {
    if (booking.room_id !== room.id || booking.status === 'cancelled') {
      return false;
    }
    
    const bookingStart = moment(booking.start_time);
    const bookingEnd = moment(booking.end_time);
    
    // Check for any overlap
    return slotStart.isBefore(bookingEnd) && slotEnd.isAfter(bookingStart);
  });
  
  return {
    available: !conflictingBooking,
    booking: conflictingBooking || null
  };
};
```

### Visual Display Logic

#### 1. Booking Block Rendering
```javascript
// Calculate booking block dimensions (AppleCalendarDashboard.jsx)
const calculateBookingBlockStyle = (booking, timeSlotHeight, startTime) => {
  const bookingStart = moment(booking.start_time);
  const bookingEnd = moment(booking.end_time);
  const dayStart = moment(startTime).startOf('day');
  
  // Calculate position from day start
  const topOffset = bookingStart.diff(dayStart, 'minutes') * (timeSlotHeight / 15);
  const height = bookingEnd.diff(bookingStart, 'minutes') * (timeSlotHeight / 15);
  
  return {
    top: `${topOffset}px`,
    height: `${height}px`,
    backgroundColor: getBookingColor(booking.status),
    borderLeft: `4px solid ${getBookingColor(booking.status)}`
  };
};

const getBookingColor = (status) => {
  const colors = {
    'confirmed': '#10B981',
    'cancelled': '#EF4444',
    'completed': '#6B7280',
    'no_show': '#F59E0B'
  };
  return colors[status] || '#6B7280';
};
```

#### 2. Drag and Drop Logic
```javascript
// Drag and drop booking movement (AppleCalendarDashboard.jsx)
const handleBookingMove = async (booking, newRoomId, newStartTime) => {
  // 1. Calculate new end time maintaining duration
  const originalDuration = moment(booking.end_time).diff(moment(booking.start_time));
  const newEndTime = moment(newStartTime).add(originalDuration, 'milliseconds');
  
  // 2. Validate new time slot
  const conflicts = await checkTimeConflicts(newRoomId, newStartTime, newEndTime, booking.id);
  if (conflicts) {
    throw new Error('Time slot conflicts with existing booking');
  }
  
  // 3. Check business hours
  const businessHoursValid = validateBusinessHours(newStartTime, newEndTime);
  if (!businessHoursValid) {
    throw new Error('New time slot is outside business hours');
  }
  
  // 4. Update booking
  await bookingsAPI.move({
    bookingId: booking.id,
    newRoomId: newRoomId,
    newTimeIn: newStartTime.toISOString(),
    newTimeOut: newEndTime.toISOString()
  });
};
```

## Edge Cases and Safeguards

### Time Zone Handling

#### 1. Current Implementation
```javascript
// Time zone handling (moment-timezone)
const formatTimeForDisplay = (datetime, timezone = 'America/New_York') => {
  return moment(datetime).tz(timezone).format('YYYY-MM-DD HH:mm');
};

const convertToUTC = (localTime, timezone = 'America/New_York') => {
  return moment.tz(localTime, timezone).utc().toISOString();
};
```

#### 2. Edge Cases
- **Daylight Saving Time**: Current implementation may have issues during DST transitions
- **Cross-timezone bookings**: Not currently supported
- **User timezone detection**: Not implemented

### Date Range Validation

#### 1. Past Date Prevention
```javascript
// Prevent past bookings
const validateBookingDate = (startTime) => {
  const now = moment();
  const bookingTime = moment(startTime);
  
  // Cannot book in the past (except for same day if booking is in the future)
  if (bookingTime.isBefore(now, 'day')) {
    throw new Error('Cannot book in the past');
  }
  
  // Same day bookings must be at least 1 hour in the future
  if (bookingTime.isSame(now, 'day') && bookingTime.isBefore(now.add(1, 'hour'))) {
    throw new Error('Same day bookings must be at least 1 hour in advance');
  }
};
```

#### 2. Advance Booking Limits
```javascript
// Maximum advance booking (30 days)
const validateAdvanceBooking = (startTime) => {
  const maxAdvanceDate = moment().add(30, 'days');
  const bookingDate = moment(startTime);
  
  if (bookingDate.isAfter(maxAdvanceDate)) {
    throw new Error('Cannot book more than 30 days in advance');
  }
};
```

### Room Capacity Validation

#### 1. Capacity Limits
```javascript
// Room capacity validation
const validateRoomCapacity = (room, bookingData) => {
  const roomCapacity = room.capacity;
  const requestedCapacity = bookingData.guest_count || 1;
  
  if (requestedCapacity > roomCapacity) {
    throw new Error(`Room capacity is ${roomCapacity}, requested ${requestedCapacity} guests`);
  }
};
```

#### 2. Capacity Display
```javascript
// Display capacity information
const getCapacityDisplay = (room) => {
  const capacity = room.capacity;
  if (capacity <= 4) return 'Small (1-4 people)';
  if (capacity <= 8) return 'Medium (5-8 people)';
  return 'Large (9+ people)';
};
```

### Concurrent Booking Prevention

#### 1. Database-Level Constraints
```sql
-- Prevent overlapping bookings (PostgreSQL implementation)
CREATE UNIQUE INDEX idx_room_time_conflict 
ON bookings (room_id, start_time, end_time) 
WHERE status != 'cancelled' AND deleted_at IS NULL;
```

#### 2. Application-Level Locking
```javascript
// Optimistic locking for booking updates
const updateBookingWithLock = async (bookingId, updates) => {
  const transaction = await db.beginTransaction();
  
  try {
    // Lock the booking row
    const booking = await transaction.get(
      'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
      [bookingId]
    );
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Check if booking was modified since last read
    if (booking.updated_at !== updates.expectedUpdatedAt) {
      throw new Error('Booking was modified by another user');
    }
    
    // Apply updates
    await transaction.run(
      'UPDATE bookings SET ... WHERE id = ?',
      [bookingId, ...Object.values(updates)]
    );
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

## Business Rules Summary

### Core Business Rules
1. **Minimum Booking Duration**: 60 minutes
2. **Maximum Booking Duration**: 8 hours (480 minutes)
3. **Advance Booking Limit**: 30 days maximum
4. **Cancellation Policy**: 24-hour notice required
5. **Business Hours**: Configurable per day of week
6. **Time Slot Granularity**: 15-minute intervals
7. **Price Calculation**: Rounded up to nearest 15-minute increment

### Status Management Rules
1. **Confirmed**: Default status for new bookings
2. **Cancelled**: Terminal status, requires 24-hour notice
3. **Completed**: Terminal status, set after booking ends
4. **No Show**: Terminal status, set for missed bookings

### Validation Rules
1. **Email Format**: Valid email address required if provided
2. **Phone Format**: Valid phone number required if provided
3. **Room Availability**: No overlapping bookings allowed
4. **Business Hours**: Bookings must be within operating hours
5. **Capacity Limits**: Guest count cannot exceed room capacity

## Error Handling and Recovery

### Common Error Scenarios

#### 1. Time Conflicts
```javascript
// Handle time conflict errors
const handleTimeConflict = (error, bookingData) => {
  if (error.message.includes('Time slot conflicts')) {
    // Suggest alternative time slots
    const alternatives = findAlternativeTimeSlots(bookingData);
    return {
      error: 'Time slot not available',
      alternatives: alternatives,
      suggestion: 'Please select an alternative time slot'
    };
  }
  throw error;
};
```

#### 2. Business Hours Violations
```javascript
// Handle business hours errors
const handleBusinessHoursError = (error, bookingData) => {
  if (error.message.includes('outside business hours')) {
    const businessHours = getBusinessHoursForDay(moment(bookingData.start_time).day());
    return {
      error: 'Booking time outside business hours',
      businessHours: businessHours,
      suggestion: 'Please select a time within business hours'
    };
  }
  throw error;
};
```

#### 3. Validation Errors
```javascript
// Handle validation errors
const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    return {
      error: 'Invalid booking data',
      details: error.details,
      suggestion: 'Please correct the highlighted fields'
    };
  }
  throw error;
};
```

### Recovery Mechanisms

#### 1. Optimistic Updates with Rollback
```javascript
// Optimistic update with rollback on failure
const optimisticBookingUpdate = async (bookingId, updates) => {
  // 1. Apply updates optimistically in UI
  const originalBooking = bookings.find(b => b.id === bookingId);
  const updatedBooking = { ...originalBooking, ...updates };
  setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
  
  try {
    // 2. Apply updates on server
    await bookingsAPI.update(bookingId, updates);
  } catch (error) {
    // 3. Rollback on failure
    setBookings(prev => prev.map(b => b.id === bookingId ? originalBooking : b));
    toast.error('Failed to update booking: ' + error.message);
    throw error;
  }
};
```

#### 2. Conflict Resolution
```javascript
// Resolve booking conflicts
const resolveBookingConflict = async (conflictData) => {
  const { bookingId, conflicts } = conflictData;
  
  // Show conflict resolution dialog
  const resolution = await showConflictResolutionDialog({
    bookingId,
    conflicts,
    options: ['move', 'cancel', 'override']
  });
  
  switch (resolution.action) {
    case 'move':
      return await moveBookingToAlternativeSlot(bookingId, resolution.newSlot);
    case 'cancel':
      return await cancelBooking(bookingId, 'Conflict resolution');
    case 'override':
      return await overrideConflict(bookingId, conflicts);
  }
};
```

## Performance Considerations

### Database Query Optimization

#### 1. Efficient Conflict Detection
```sql
-- Optimized conflict detection query
SELECT COUNT(*) as conflict_count
FROM bookings 
WHERE room_id = ? 
  AND status != 'cancelled' 
  AND deleted_at IS NULL
  AND start_time < ? 
  AND end_time > ?
LIMIT 1;
```

#### 2. Indexed Queries
```sql
-- Index for efficient booking lookups
CREATE INDEX idx_bookings_room_time_status 
ON bookings(room_id, start_time, end_time, status) 
WHERE deleted_at IS NULL;
```

### Frontend Performance

#### 1. Memoized Calculations
```javascript
// Memoize expensive calculations
const memoizedTimeSlots = useMemo(() => {
  return generateTimeSlots(businessHours, selectedDate);
}, [businessHours, selectedDate]);

const memoizedAvailability = useMemo(() => {
  return calculateAvailability(rooms, bookings, memoizedTimeSlots);
}, [rooms, bookings, memoizedTimeSlots]);
```

#### 2. Virtual Scrolling for Large Datasets
```javascript
// Virtual scrolling for large booking lists
const VirtualizedBookingList = ({ bookings }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  
  const visibleBookings = bookings.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div className="booking-list">
      {visibleBookings.map(booking => (
        <BookingItem key={booking.id} booking={booking} />
      ))}
    </div>
  );
};
```

## Testing Scenarios

### Unit Test Cases

#### 1. Booking Creation Tests
```javascript
describe('Booking Creation', () => {
  test('should create booking with valid data', async () => {
    const bookingData = {
      room_id: 1,
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T12:00:00Z'
    };
    
    const result = await createBooking(bookingData);
    expect(result.success).toBe(true);
    expect(result.data.customer_name).toBe('John Doe');
  });
  
  test('should reject booking with time conflict', async () => {
    // Create existing booking
    await createBooking(existingBooking);
    
    // Attempt to create conflicting booking
    const conflictingBooking = { ...existingBooking, start_time: '2024-01-15T11:00:00Z' };
    
    await expect(createBooking(conflictingBooking))
      .rejects.toThrow('Time slot conflicts with existing booking');
  });
});
```

#### 2. Business Rules Tests
```javascript
describe('Business Rules', () => {
  test('should enforce minimum booking duration', async () => {
    const shortBooking = {
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T10:30:00Z' // 30 minutes
    };
    
    await expect(createBooking(shortBooking))
      .rejects.toThrow('Minimum booking duration is 60 minutes');
  });
  
  test('should enforce business hours', async () => {
    const afterHoursBooking = {
      start_time: '2024-01-15T23:00:00Z', // After business hours
      end_time: '2024-01-16T01:00:00Z'
    };
    
    await expect(createBooking(afterHoursBooking))
      .rejects.toThrow('Booking time is outside business hours');
  });
});
```

### Integration Test Cases

#### 1. End-to-End Booking Flow
```javascript
describe('E2E Booking Flow', () => {
  test('complete booking creation and modification', async () => {
    // 1. Create booking
    const booking = await createBooking(validBookingData);
    expect(booking.id).toBeDefined();
    
    // 2. Modify booking
    const updatedBooking = await updateBooking(booking.id, {
      customer_name: 'Jane Doe'
    });
    expect(updatedBooking.customer_name).toBe('Jane Doe');
    
    // 3. Cancel booking
    await cancelBooking(booking.id);
    const cancelledBooking = await getBooking(booking.id);
    expect(cancelledBooking.status).toBe('cancelled');
  });
});
```

---

*This document provides comprehensive baseline documentation of the current booking system. Use this as a reference for understanding existing functionality, identifying optimization opportunities, and ensuring compatibility during system upgrades.*

