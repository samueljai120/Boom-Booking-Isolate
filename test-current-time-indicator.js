// Test script for current time indicator functionality
import moment from 'moment-timezone';

// Mock settings
const settings = {
  timezone: 'America/New_York',
  timeInterval: 15
};

// Mock business hours
const getBusinessHoursForDay = (weekday) => {
  const businessHours = {
    0: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Sunday
    1: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Monday
    2: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Tuesday
    3: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Wednesday
    4: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Thursday
    5: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Friday
    6: { openTime: '18:00', closeTime: '02:00', isClosed: false }, // Saturday
  };
  return businessHours[weekday] || { openTime: '18:00', closeTime: '02:00', isClosed: true };
};

// Test the getCurrentTimePosition function
const getCurrentTimePosition = (selectedDate) => {
  const timezone = settings.timezone || 'America/New_York';
  const now = moment().tz(timezone);
  const selectedDateMoment = moment(selectedDate).tz(timezone);
  
  // Check if current time is on the selected date
  if (!now.isSame(selectedDateMoment, 'day')) {
    return null; // Don't show line if not on selected date
  }
  
  const weekday = selectedDate.getDay();
  const dayHours = getBusinessHoursForDay(weekday);
  
  if (dayHours.isClosed) {
    return null; // Don't show line if business is closed
  }
  
  const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);
  
  // Check if current time is within visible hours (1 hour before open + business hours + 1 hour after close)
  const currentHour = now.hour();
  const currentMinute = now.minute();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  // Calculate visible range: 1 hour before open to 1 hour after close
  const visibleStartMinutes = openTimeInMinutes - 60; // 1 hour before open
  const visibleEndMinutes = closeTimeInMinutes + 60; // 1 hour after close
  
  // Handle late night hours (crosses midnight)
  const isLateNight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
  
  let isWithinVisibleHours = false;
  if (isLateNight) {
    // Late night: from openHour to closeHour next day + 1 extra hour
    isWithinVisibleHours = currentTimeInMinutes >= visibleStartMinutes || 
                          currentTimeInMinutes < (closeTimeInMinutes + 60) % (24 * 60);
  } else {
    // Normal hours: from 1 hour before open to 1 hour after close same day
    isWithinVisibleHours = currentTimeInMinutes >= visibleStartMinutes && 
                          currentTimeInMinutes <= visibleEndMinutes;
  }
  
  if (!isWithinVisibleHours) {
    return null; // Don't show line if outside visible hours
  }
  
  // Calculate position in minutes from start of visible range (1 hour before business open)
  const dayStart = selectedDateMoment.clone().startOf('day').add(openHour, 'hours').add(openMinute, 'minutes');
  const visibleStart = dayStart.clone().subtract(1, 'hour'); // 1 hour before business open
  const minutesFromVisibleStart = now.diff(visibleStart, 'minutes', true);
  
  // Ensure the position is within the visible range
  const maxVisibleMinutes = (closeTimeInMinutes - openTimeInMinutes) + 120; // Business hours + 2 hours buffer
  const clampedMinutes = Math.max(0, Math.min(minutesFromVisibleStart, maxVisibleMinutes));
  
  return {
    minutesFromStart: clampedMinutes,
    time: now.format('h:mm A'),
    isVisible: true,
    exactTime: now.format('HH:mm:ss'),
    timezone: timezone
  };
};

// Test with different scenarios
console.log('=== Current Time Indicator Test ===');
console.log('Current time:', moment().tz(settings.timezone).format('YYYY-MM-DD HH:mm:ss'));
console.log('Timezone:', settings.timezone);

// Test with today's date
const today = new Date();
const todayResult = getCurrentTimePosition(today);
console.log('\n--- Today Test ---');
console.log('Selected date:', moment(today).format('YYYY-MM-DD'));
console.log('Result:', todayResult);

// Test with tomorrow's date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowResult = getCurrentTimePosition(tomorrow);
console.log('\n--- Tomorrow Test ---');
console.log('Selected date:', moment(tomorrow).format('YYYY-MM-DD'));
console.log('Result:', tomorrowResult);

// Test with yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayResult = getCurrentTimePosition(yesterday);
console.log('\n--- Yesterday Test ---');
console.log('Selected date:', moment(yesterday).format('YYYY-MM-DD'));
console.log('Result:', yesterdayResult);

// Test slot calculation
if (todayResult) {
  const timeInterval = settings.timeInterval || 15;
  const slotIndex = Math.round(todayResult.minutesFromStart / timeInterval);
  console.log('\n--- Slot Calculation ---');
  console.log('Minutes from start:', todayResult.minutesFromStart);
  console.log('Time interval:', timeInterval);
  console.log('Calculated slot index:', slotIndex);
  console.log('Expected slot width (60px):', slotIndex * 60, 'px');
}
