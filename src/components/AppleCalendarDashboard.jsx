import React, { useState, useMemo } from 'react';
import moment from 'moment-timezone';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { roomsAPI, bookingsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  Settings, 
  Menu,
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useBusinessHours } from '../contexts/BusinessHoursContext';
import BookingModal from './BookingModal';
import ReservationViewModal from './ReservationViewModal';
import SettingsModal from './SettingsModal';
import InstructionsModal from './InstructionsModal';
import TraditionalSchedule from './TraditionalSchedule';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

// Enhanced draggable booking component with resize functionality
const DraggableBooking = ({ booking, children, onDoubleClick, style: customStyle, onClick, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isQuickEdit, setIsQuickEdit] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'top' or 'bottom'
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [wasDragged, setWasDragged] = useState(false);
  const rootRef = React.useRef(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: booking._id,
    disabled: isResizing || !isQuickEdit, // Drag only in quick edit
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `booking-${booking._id}`,
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : customStyle?.zIndex || 10,
  } : {};

  const hoverStyle = isOver && !isResizing ? {
    boxShadow: '0 4px 12px rgba(251, 146, 60, 0.4)',
    borderColor: 'rgb(251, 146, 60)',
    borderWidth: '2px',
  } : {};

  const resizeStyle = isResizing ? {
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
    borderColor: 'rgb(59, 130, 246)',
    borderWidth: '2px',
    cursor: 'ns-resize',
  } : {};

  const combinedStyle = { ...customStyle, ...dragStyle, ...hoverStyle, ...resizeStyle };

  // Track end of drag to suppress accidental clicks
  React.useEffect(() => {
    if (isDragging) return;
    if (!isDragging && transform) return; // during settle
    // brief window to ignore click after drag end
    setWasDragged(true);
    const t = setTimeout(() => setWasDragged(false), 150);
    return () => clearTimeout(t);
  }, [isDragging]);

  // Handle long press to enter resize mode
  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setIsQuickEdit(true);
      setLongPressTimer(null);
    }, 600);
    setLongPressTimer(timer);
  };

  React.useEffect(() => {
    const cancel = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    };
    window.addEventListener('cancel-long-press', cancel);
    return () => {
      window.removeEventListener('cancel-long-press', cancel);
    };
  }, [longPressTimer]);

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle resize drag
  const handleResizeMouseDown = (e, handle) => {
    e.stopPropagation();
    if (!isResizing) {
      setIsResizing(true);
    }
    setResizeHandle(handle);
    const startY = e.clientY;
    const startHeight = customStyle?.height || 96;
    const startTop = customStyle?.top || 0;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      
      if (handle === 'top') {
        // Resize from top (change start time)
        const newTop = startTop + deltaY;
        const newHeight = startHeight - deltaY;
        if (newHeight > 30) { // Minimum height
          // Call resize callback
          onResize?.(booking._id, { top: newTop, height: newHeight, handle: 'top' });
        }
      } else if (handle === 'bottom') {
        // Resize from bottom (change end time)
        const newHeight = startHeight + deltaY;
        if (newHeight > 30) { // Minimum height
          // Call resize callback
          onResize?.(booking._id, { top: startTop, height: newHeight, handle: 'bottom' });
        }
      }
    };

    const handleMouseUpResize = () => {
      setResizeHandle(null);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpResize);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpResize);
  };

  // Exit resize mode on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isResizing) {
          setIsResizing(false);
          setResizeHandle(null);
        }
        if (isQuickEdit) {
          setIsQuickEdit(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isResizing]);

  const dragProps = isResizing ? {} : { ...listeners, ...attributes };

  // Exit quick edit on outside click
  React.useEffect(() => {
    if (!isQuickEdit) return;
    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setIsQuickEdit(false);
        setIsResizing(false);
        setResizeHandle(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    return () => document.removeEventListener('mousedown', onDocMouseDown, true);
  }, [isQuickEdit]);

  const handleRootClick = (e) => {
    if (isResizing || isDragging || wasDragged || isQuickEdit) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
        rootRef.current = node;
      }}
      style={combinedStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={() => onDoubleClick(booking)}
      onClick={handleRootClick}
      className={`absolute rounded-lg shadow-sm border text-white text-xs transition-all duration-200 group ${
        isResizing ? 'cursor-ns-resize ring-2 ring-blue-300' : isQuickEdit ? 'cursor-move ring-2 ring-blue-300 animate-pulse' : 'cursor-grab active:cursor-grabbing'
      } ${isOver && !isResizing ? 'ring-2 ring-orange-300' : ''} ${isDragging ? 'rotate-2 scale-105' : ''}`}
      title={
        isResizing 
          ? 'Resize mode - drag edges to resize, press Escape to exit' 
          : isOver 
            ? `Drop here to swap with ${booking.customerName}` 
            : `Long press to resize, drag to move ${booking.customerName}`
      }
    >
      {/* Drag area (enabled only in Quick Edit, excludes edges) */}
      {isQuickEdit && (
        <div
          className="absolute inset-1 z-0"
          {...attributes}
          {...listeners}
          onMouseDown={(e) => {
            // Allow drag start from body; do not start resize here
            e.stopPropagation();
          }}
        />
      )}

      {/* Edit button (appears on hover) */}
      {!isResizing && (
        <button
          type="button"
          className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded bg-white/90 text-gray-700 text-[10px]"
          onMouseDown={(e) => { e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
          title="Edit booking"
        >
          ✎
        </button>
      )}
      {/* Top resize handle - always available */}
      <div
        className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-blue-500/50 z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
      />

      {/* Bottom resize handle - always available */}
      <div
        className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-blue-500/50 z-10"
        onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
      />

      {/* Resize mode indicator */}
      {isResizing && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Resize Mode - ESC to exit
        </div>
      )}

      {/* Swap indicator */}
      {isOver && !isResizing && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          🔄
        </div>
      )}

      {children}
    </div>
  );
};

// Droppable slot component for vertical view with swap indication
const DroppableSlot = ({ id, children, className, style, onClick, bookings = [], draggedBooking }) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  // Simplified visual feedback - just show basic hover states for now
  let backgroundClass = '';
  if (isOver && draggedBooking) {
    backgroundClass = 'bg-blue-100 border-2 border-blue-300';
  } else if (isOver) {
    backgroundClass = 'bg-blue-50';
  }

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${backgroundClass} transition-colors duration-200`}
      style={style}
      onClick={onClick}
      title={draggedBooking && isOver ? 'Drop to place booking' : ''}
    >
      {children}
    </div>
  );
};

const AppleCalendarDashboard = () => {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);
  const [draggedBooking, setDraggedBooking] = useState(null);
  const [forceRender, setForceRender] = useState(0);
  
  console.log('🚀 AppleCalendarDashboard component loaded!');
  console.log('🔍 Current time:', new Date().toISOString());
  console.log('🔍 User state:', user);
  console.log('🔄 Component render count:', forceRender);
  
  // Force an alert to ensure component is loading
  React.useEffect(() => {
    console.log('🚀 AppleCalendarDashboard useEffect triggered!');
    
    // Test API call to verify authentication
    const testAPI = async () => {
      try {
        const { healthAPI } = await import('../lib/api.js');
        const response = await healthAPI.check();
        console.log('🔍 Health check response:', response.data);
      } catch (error) {
        console.error('🔍 Health check failed:', error);
      }
    };
    
    testAPI();
  }, []);
  
  // Default to today's date on load/refresh
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Mini calendar month base (independent from selected date)
  const [calendarBaseDate, setCalendarBaseDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { settings } = useSettings();
  const { businessHours, getBusinessHoursForDay, getTimeSlotsForDay, isWithinBusinessHours } = useBusinessHours();

  // Responsive viewport tracking for adaptive sizing
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [windowHeight, setWindowHeight] = React.useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  React.useEffect(() => {
    const onResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Current time tracking
  const [currentTime, setCurrentTime] = React.useState(new Date());
  React.useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate current time position on schedule
  const getCurrentTimePosition = () => {
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
    
    // Check if current time is within business hours
    const currentHour = now.hour();
    const currentMinute = now.minute();
    const isLateNight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
    
    let isWithinBusinessHours = false;
    if (isLateNight) {
      // Late night: from openHour to closeHour next day
      isWithinBusinessHours = currentHour >= openHour || currentHour < closeHour;
    } else {
      // Normal hours: from openHour to closeHour same day
      isWithinBusinessHours = (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) && 
                              (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute));
    }
    
    if (!isWithinBusinessHours) {
      return null; // Don't show line if outside business hours
    }
    
    // Calculate position in minutes from start of business day
    const dayStart = selectedDateMoment.clone().startOf('day').add(openHour, 'hours').add(openMinute, 'minutes');
    const minutesFromStart = now.diff(dayStart, 'minutes');
    
    return {
      minutesFromStart,
      time: now.format('h:mm A'),
      isVisible: true
    };
  };

  const currentTimeData = getCurrentTimePosition();

  // Compute responsive widths
  const TIME_COL_WIDTH = windowWidth < 640 ? 56 : windowWidth < 1024 ? 64 : 80; // px
  const ROOM_COL_WIDTH = windowWidth < 640 ? 140 : windowWidth < 1024 ? 180 : 200; // px

  // Calculate actual rendered room column width (flex-1 stretches columns)
  const getActualRoomColumnWidth = () => {
    const availableWidth = windowWidth - TIME_COL_WIDTH - (sidebarOpen ? (windowWidth < 640 ? 256 : windowWidth < 1024 ? 288 : 320) : 56);
    const actualWidth = Math.max(ROOM_COL_WIDTH, availableWidth / rooms.length);
    return actualWidth;
  };

  // Calculate responsive slot height based on viewport and settings
  const getResponsiveSlotHeight = () => {
    const baseHeight = settings.verticalLayoutSlots?.slotHeight === 'small' ? 72 : settings.verticalLayoutSlots?.slotHeight === 'large' ? 112 : 96;
    const minHeight = Math.max(48, baseHeight);
    
    // Calculate available height for time slots (excluding header, room info, and padding)
    const headerHeight = 64; // Top navigation height
    const roomInfoHeight = 64; // Room column header height (h-16 = 64px)
    const padding = 20; // Minimal padding
    const availableHeight = windowHeight - headerHeight - roomInfoHeight - padding;
    const timeSlotsCount = timeSlots.length;
    
    if (timeSlotsCount === 0) {
      console.warn('⚠️ No time slots available, using minimum height');
      return minHeight;
    }
    
    // Ensure we don't go below minimum height
    const calculatedHeight = Math.max(minHeight, availableHeight / timeSlotsCount);
    const finalHeight = Math.round(calculatedHeight);
    
    // Safety check for valid height
    if (isNaN(finalHeight) || finalHeight <= 0) {
      console.warn('⚠️ Invalid slot height calculated, using minimum height:', finalHeight);
      return minHeight;
    }
    
    return finalHeight;
  };


  const getBookingColorBySource = React.useCallback((booking) => {
    const sourceKey = (booking.source || '').toLowerCase();
    const map = settings.bookingSourceColors || {};
    // Normalize common aliases
    const normalized =
      sourceKey === 'walk-in' || sourceKey === 'walkin' ? 'walkin' :
      sourceKey === 'phone' || sourceKey === 'call' ? 'phone' :
      sourceKey === 'email' ? 'email' :
      sourceKey === 'message' || sourceKey === 'msg' || sourceKey === 'sms' ? 'message' :
      sourceKey === 'online' || sourceKey === 'web' ? 'online' : sourceKey;
    return map[normalized] || map.online || '#2563eb';
  }, [settings.bookingSourceColors]);
  const queryClient = useQueryClient();

  // Scroll synchronization refs (time column <-> grid)
  const timeColumnRef = React.useRef(null);
  const gridScrollRef = React.useRef(null);

  const syncTimeFromGrid = React.useCallback(() => {
    try {
      if (!timeColumnRef.current || !gridScrollRef.current) return;
      if (timeColumnRef.current.scrollTop !== gridScrollRef.current.scrollTop) {
        timeColumnRef.current.scrollTop = gridScrollRef.current.scrollTop;
      }
    } catch {}
  }, []);

  const syncGridFromTime = React.useCallback(() => {
    try {
      if (!timeColumnRef.current || !gridScrollRef.current) return;
      if (gridScrollRef.current.scrollTop !== timeColumnRef.current.scrollTop) {
        gridScrollRef.current.scrollTop = timeColumnRef.current.scrollTop;
      }
    } catch {}
  }, []);

  // Configure drag sensors with better activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
        delay: 0,
        tolerance: 2,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Track layout orientation changes
  React.useEffect(() => {
    console.log('🎨 Layout orientation changed to:', settings.layoutOrientation);
  }, [settings.layoutOrientation]);

  // Keep mini calendar in sync when selectedDate changes elsewhere
  React.useEffect(() => {
    setCalendarBaseDate(selectedDate);
  }, [selectedDate]);

  // Debug component mount/unmount and page refresh/navigation
  React.useEffect(() => {
    console.log('📱 AppleCalendarDashboard mounted');
    
    const handleBeforeUnload = (e) => {
      console.log('🚨 Page about to refresh/navigate!');
      console.trace('Refresh triggered from:');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      console.log('📱 AppleCalendarDashboard unmounting');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Debug user state before query (removed for production)
  
  // Test API call directly (removed for production)
  
  // Fetch rooms with optimized settings
  const { data: roomsData, isLoading: roomsLoading, error: roomsError, isSuccess: roomsSuccess } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const result = await roomsAPI.getAll();
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: true, // Temporarily always enabled for debugging
  });

  // Fetch all bookings with optimized settings
  const { data: bookingsData, isFetching: bookingsFetching, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => {
      console.log('🔄 Fetching bookings from API...');
      return bookingsAPI.getAll();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes to avoid jitter during interactions
    cacheTime: 15 * 60 * 1000,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 0,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      console.log('📥 Bookings query successful:', data);
    },
  });

  const rooms = roomsData?.data || [];
  const bookings = bookingsData?.data?.bookings || [];
  
  // Debug: Track when bookings data changes
  React.useEffect(() => {
    console.log('📊 Bookings data changed:', {
      bookings: bookings?.map(b => ({
        customerName: b.customerName,
        roomId: b.roomId,
        room: b.room,
        timeIn: b.timeIn,
        timeOut: b.timeOut
      })),
      timestamp: new Date().toISOString(),
      bookingsLength: bookings?.length,
      bookingsData: bookingsData,
      queryData: queryClient.getQueryData(['bookings'])
    });
  }, [bookings, bookingsData]);
  
  // Debug logging (removed for production)
  
  // Simplified booking processing - no test booking needed

  // Mutation for moving bookings with optimistic update
  const moveBookingMutation = useMutation({
    mutationFn: (data) => {
      console.log('🚀 Calling move API with data:', data);
      return bookingsAPI.move(data);
    },
    onMutate: async (variables) => {
      console.log('🔄 Optimistic update starting with variables:', variables);
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = queryClient.getQueryData(['bookings']);

      try {
        const oldBookings = previous?.data?.bookings || [];
        const { bookingId, newRoomId, newTimeIn, newTimeOut, targetBookingId, targetNewTimeIn, targetNewTimeOut } = variables || {};

        console.log('🔄 Optimistic update variables:', variables);

        // Find current records
        console.log('🔍 Looking for source booking with ID:', bookingId);
        console.log('🔍 Available booking IDs:', oldBookings.map(b => ({ id: b._id, customerName: b.customerName })));
        
        const sourceIdx = oldBookings.findIndex(b => b._id === bookingId);
        const targetIdx = targetBookingId ? oldBookings.findIndex(b => b._id === targetBookingId) : -1;
        
        console.log('🔍 Found indices:', { sourceIdx, targetIdx });
        
        if (sourceIdx === -1) {
          console.error('❌ Source booking not found!', { bookingId, availableIds: oldBookings.map(b => b._id) });
          return { previous };
        }

        const source = oldBookings[sourceIdx];
        const target = targetIdx !== -1 ? oldBookings[targetIdx] : null;
        const newRoom = (rooms && Array.isArray(rooms) ? rooms.find(r => r._id === newRoomId || r.id === newRoomId) : null) || source.room || source.roomId;
        
        console.log('🔄 Optimistic update - found records:', {
          sourceIdx,
          targetIdx,
          source: source.customerName,
          target: target?.customerName,
          newRoom: newRoom?.name
        });
        console.log('🏠 Room lookup:', {
          newRoomId,
          newRoomIdType: typeof newRoomId,
          foundRoom: newRoom,
          rooms: rooms.map(r => ({ _id: r._id, id: r.id, name: r.name, _idType: typeof r._id, idType: typeof r.id }))
        });

        let updated = [...oldBookings];

        if (target && targetBookingId) {
          // Swap: move source into target's slot, target into source's slot
          // Source goes to target's room, target goes to source's room
          const sourceRoom = (rooms && Array.isArray(rooms) ? rooms.find(r => r._id === targetRoomId || r.id === targetRoomId) : null) || source.room || source.roomId;
          const targetRoom = (rooms && Array.isArray(rooms) ? rooms.find(r => r._id === newRoomId || r.id === newRoomId) : null) || target.room || target.roomId;
          
          console.log('🔄 Room lookup for swap:', {
            targetRoomId,
            newRoomId,
            sourceRoom: sourceRoom?.name,
            targetRoom: targetRoom?.name,
            newRoom: newRoom?.name,
            availableRooms: rooms.map(r => ({ _id: r._id, id: r.id, name: r.name }))
          });
          
          const sourceNew = {
            ...source,
            room: newRoom, // Source goes to the dropped room (target's room)
            roomId: newRoomId, // Use primitive ID for roomId
            timeIn: newTimeIn,
            timeOut: newTimeOut,
            startTime: newTimeIn,
            endTime: newTimeOut,
          };
          
          const targetNew = {
            ...target,
            room: sourceRoom, // Target goes to source's original room
            roomId: targetRoomId, // Use primitive ID for roomId
            timeIn: targetNewTimeIn,
            timeOut: targetNewTimeOut,
            startTime: targetNewTimeIn,
            endTime: targetNewTimeOut,
          };
          
          console.log('🔄 Swap optimistic update:', {
            sourceNew: {
              customerName: sourceNew.customerName,
              room: sourceNew.room?.name,
              roomId: sourceNew.roomId,
              timeIn: sourceNew.timeIn,
              timeOut: sourceNew.timeOut
            },
            targetNew: {
              customerName: targetNew.customerName,
              room: targetNew.room?.name,
              roomId: targetNew.roomId,
              timeIn: targetNew.timeIn,
              timeOut: targetNew.timeOut
            },
            roomLookup: {
              newRoomId,
              targetRoomId,
              newRoom: newRoom?.name,
              sourceRoom: sourceRoom?.name,
              targetRoom: targetRoom?.name
            }
          });
          
          updated[sourceIdx] = sourceNew;
          updated[targetIdx] = targetNew;
          
          console.log('🔄 After swap update - source booking:', {
            index: sourceIdx,
            customerName: updated[sourceIdx].customerName,
            room: updated[sourceIdx].room?.name,
            timeIn: updated[sourceIdx].timeIn,
            timeOut: updated[sourceIdx].timeOut
          });
          
          console.log('🔄 After swap update - target booking:', {
            index: targetIdx,
            customerName: updated[targetIdx].customerName,
            room: updated[targetIdx].room?.name,
            timeIn: updated[targetIdx].timeIn,
            timeOut: updated[targetIdx].timeOut
          });
        } else {
        // Simple move
        updated[sourceIdx] = {
          ...source,
          room: newRoom,
          roomId: newRoomId, // Use primitive ID for roomId
          timeIn: newTimeIn,
          timeOut: newTimeOut,
          startTime: newTimeIn,
          endTime: newTimeOut,
        };
        
        console.log('🔄 Updated booking after move:', {
          customerName: updated[sourceIdx].customerName,
          room: updated[sourceIdx].room,
          roomId: updated[sourceIdx].roomId,
          newRoomId: newRoomId,
          newRoom: newRoom,
          timeIn: updated[sourceIdx].timeIn,
          timeOut: updated[sourceIdx].timeOut,
          startTime: updated[sourceIdx].startTime,
          endTime: updated[sourceIdx].endTime,
          bookingId: updated[sourceIdx]._id || updated[sourceIdx].id
        });
        }

        // Apply optimistic update with a small delay to ensure proper sequencing
        setTimeout(() => {
          queryClient.setQueryData(['bookings'], (old) => {
            const newData = {
              ...(old || {}),
              data: {
                ...((old || {}).data || {}),
                bookings: updated,
              },
            };
            
            console.log('🔄 Query data update - old data:', old);
            console.log('🔄 Query data update - new data:', newData);
            console.log('🔄 Query data update - updated bookings:', updated);
            
            return newData;
          });
        }, 50);
        
        console.log('🔄 Query data updated - new bookings:', updated);
        console.log('🔄 Query data updated - moved booking:', updated[sourceIdx]);
        if (targetIdx !== -1) {
          console.log('🔄 Query data updated - swapped booking:', updated[targetIdx]);
        }
        
        // Debug: Check if the updated bookings are being processed correctly
        console.log('🔄 All updated bookings after swap:', updated.map(b => ({
          customerName: b.customerName,
          roomId: b.roomId,
          room: b.room,
          timeIn: b.timeIn,
          timeOut: b.timeOut,
          _id: b._id
        })));
        
        // Debug: Check if the query data was actually updated
        setTimeout(() => {
          const currentQueryData = queryClient.getQueryData(['bookings']);
          console.log('🔄 Query data after update (delayed check):', currentQueryData);
          console.log('🔄 Current bookings in query data:', currentQueryData?.data?.bookings?.map(b => ({
            customerName: b.customerName,
            roomId: b.roomId,
            room: b.room,
            timeIn: b.timeIn,
            timeOut: b.timeOut
          })));
          
          // Test: Check if the swap actually happened in the query data
          const johnDoe = currentQueryData?.data?.bookings?.find(b => b.customerName?.includes('John'));
          const janeSmith = currentQueryData?.data?.bookings?.find(b => b.customerName?.includes('Jane'));
          if (johnDoe && janeSmith) {
            console.log('🔄 Swap verification in query data:', {
              johnDoe: {
                customerName: johnDoe.customerName,
                roomId: johnDoe.roomId,
                room: johnDoe.room?.name,
                timeIn: johnDoe.timeIn
              },
              janeSmith: {
                customerName: janeSmith.customerName,
                roomId: janeSmith.roomId,
                room: janeSmith.room?.name,
                timeIn: janeSmith.timeIn
              }
            });
          }
          
          // Force re-render to ensure UI updates
          console.log('🔄 Forcing component re-render...');
          setForceRender(prev => prev + 1);
          
          // Also try to manually trigger a query refetch
          console.log('🔄 Manually triggering query refetch...');
          queryClient.refetchQueries({ queryKey: ['bookings'] });
          
          // Force a complete cache invalidation and refetch
          console.log('🔄 Invalidating and refetching queries...');
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          
          // Also try to completely replace the query data
          console.log('🔄 Completely replacing query data...');
          queryClient.setQueryData(['bookings'], {
            data: {
              bookings: updated,
              total: updated.length
            }
          });
        }, 100);
      } catch (e) {
        console.warn('Optimistic move update failed:', e);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookings'], context.previous);
      }
      try {
        const message = _err?.response?.data?.message || _err?.response?.data?.error || 'Failed to move booking';
        toast.error(message);
      } catch {}
    },
    onSuccess: (data, variables) => {
      console.log('✅ Move mutation successful:', data);
      console.log('🔄 About to invalidate queries - current bookings data:', queryClient.getQueryData(['bookings']));
      
      if (variables?.targetBookingId) {
        toast.success(`🔄 Bookings swapped: ${data?.data?.source?.customerName} ↔ ${data?.data?.target?.customerName}`);
      } else {
        toast.success('📍 Booking moved successfully');
      }
      
      // Note: Query invalidation removed for mock API testing
      // In a real app, this would refresh data from the server
      // queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onSettled: () => {
      // Additional cleanup if needed
    },
  });

  // Mutation for updating bookings
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => bookingsAPI.update(id, data),
    onSuccess: () => {
      // Note: Query invalidation removed for mock API testing
      // queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  // Mutation for resizing bookings with optimistic update
  const resizeBookingMutation = useMutation({
    mutationFn: bookingsAPI.resize,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });
      const previous = queryClient.getQueryData(['bookings']);
      try {
        const oldBookings = previous?.data?.bookings || [];
        const { bookingId, newStartTime, newEndTime } = variables || {};
        const idx = oldBookings.findIndex(b => b._id === bookingId);
        if (idx === -1) return { previous };
        const updated = [...oldBookings];
        const current = updated[idx];
        updated[idx] = {
          ...current,
          timeIn: newStartTime,
          timeOut: newEndTime,
          startTime: newStartTime,
          endTime: newEndTime,
        };
        queryClient.setQueryData(['bookings'], (old) => ({
          ...(old || {}),
          data: {
            ...((old || {}).data || {}),
            bookings: updated,
          },
        }));
      } catch (e) {
        console.warn('Optimistic resize update failed:', e);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bookings'], context.previous);
      }
      try {
        const message = _err?.response?.data?.message || _err?.response?.data?.error || 'Failed to resize booking';
        toast.error(message);
      } catch {}
    },
    onSuccess: () => {
      toast.success('Booking resized');
    },
    onSettled: () => {},
  });
  const normalizedBookings = useMemo(() => {
    console.log('🔄 Normalizing bookings - raw bookings:', bookings);
    console.log('🔄 Normalizing bookings - bookings type:', typeof bookings, 'isArray:', Array.isArray(bookings));
    
    // Safety check: ensure bookings is always an array
    if (!bookings || !Array.isArray(bookings)) {
      console.log('⚠️ No bookings data or not an array');
      return [];
    }
    
    const mapped = bookings.map(b => ({
      ...b,
      roomId: b.roomId || (b.room && typeof b.room === 'object' ? b.room._id : b.room),
      room: b.room || b.roomId,
      startTime: b.startTime || b.timeIn,
      endTime: b.endTime || b.timeOut,
      timeIn: b.timeIn || b.startTime,
      timeOut: b.timeOut || b.endTime,
    }));

    console.log('🔄 Mapped bookings:', mapped);
    console.log('🔄 Mapped bookings details:', mapped.map(b => ({
      customerName: b.customerName,
      roomId: b.roomId,
      room: b.room,
      timeIn: b.timeIn,
      timeOut: b.timeOut,
      startTime: b.startTime,
      endTime: b.endTime,
      _id: b._id
    })));
    
    // Debug: Check for specific bookings after swap
    const johnDoe = mapped.find(b => b.customerName?.includes('John'));
    const janeSmith = mapped.find(b => b.customerName?.includes('Jane'));
    if (johnDoe || janeSmith) {
      console.log('🔄 Swap debugging - found specific bookings:', {
        johnDoe: johnDoe ? {
          customerName: johnDoe.customerName,
          roomId: johnDoe.roomId,
          room: johnDoe.room,
          timeIn: johnDoe.timeIn,
          timeOut: johnDoe.timeOut
        } : null,
        janeSmith: janeSmith ? {
          customerName: janeSmith.customerName,
          roomId: janeSmith.roomId,
          room: janeSmith.room,
          timeIn: janeSmith.timeIn,
          timeOut: janeSmith.timeOut
        } : null
      });
    }

    // Filter bookings that overlap with the selected date
    const selectedStart = moment(selectedDate).startOf('day');
    const selectedEnd = moment(selectedDate).endOf('day');
    
    console.log('📅 Date filtering - selected date:', selectedDate, 'start:', selectedStart.format(), 'end:', selectedEnd.format());
    console.log('📅 Selected date details:', {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
      date: selectedDate.getDate(),
      day: selectedDate.getDay()
    });
    
    const filtered = mapped.filter(b => {
      // Safety check for booking object
      if (!b || typeof b !== 'object') {
        console.warn('⚠️ Invalid booking object in filter:', b);
        return false;
      }
      
      const bookingStart = moment(b.startTime || b.timeIn);
      const bookingEnd = moment(b.endTime || b.timeOut);
      
      // Check if booking overlaps with selected date
      const overlaps = bookingStart.isBefore(selectedEnd) && bookingEnd.isAfter(selectedStart);
      console.log(`🔍 Date filter - Booking ${b.customerName || 'Unknown'}:`, {
        start: bookingStart.format(),
        end: bookingEnd.format(),
        overlaps,
        bookingYear: bookingStart.year(),
        bookingMonth: bookingStart.month(),
        bookingDate: bookingStart.date(),
        selectedYear: selectedStart.year(),
        selectedMonth: selectedStart.month(),
        selectedDate: selectedStart.date(),
        // Additional debugging for swap scenarios
        isSourceBooking: b.customerName?.includes('John') || b.customerName?.includes('Jane'),
        rawStartTime: b.startTime,
        rawEndTime: b.endTime,
        rawTimeIn: b.timeIn,
        rawTimeOut: b.timeOut
      });
      return overlaps;
    });
    
    console.log('📅 Filtered bookings after date filtering:', filtered);
    return filtered;
  }, [bookings, selectedDate]);
  // Only show full-screen skeleton on first paint (no rooms loaded yet)
  const initialRoomsLoaded = !!roomsData?.data;
  const isLoading = roomsLoading && !initialRoomsLoaded;
  const hasError = roomsError || bookingsError;
  
  // Debug loading state (removed for production)

  // Removed debug logging - working correctly now

  // Get room type color
  const getRoomTypeColor = (type) => {
    const colors = {
      medium: '#3B82F6',
      large: '#10B981',
      party: '#F59E0B',
    };
    return colors[type] || '#3B82F6';
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startOfMonth = moment(calendarBaseDate).startOf('month');
    const endOfMonth = moment(calendarBaseDate).endOf('month');
    const startOfCalendar = startOfMonth.clone().startOf('week');
    const endOfCalendar = endOfMonth.clone().endOf('week');
    
    const days = [];
    const current = startOfCalendar.clone();
    
    while (current.isSameOrBefore(endOfCalendar, 'day')) {
      days.push({
        date: current.clone(),
        isCurrentMonth: current.isSame(calendarBaseDate, 'month'),
        isToday: current.isSame(moment(), 'day'),
        isSelected: current.isSame(selectedDate, 'day'),
      });
      current.add(1, 'day');
    }
    
    return days;
  }, [calendarBaseDate, selectedDate]);

  // Generate time slots using business hours from API
  const timeSlots = useMemo(() => {
    const timezone = settings.timezone || 'America/New_York';
    const slots = [];
    
    // Get business hours for the selected date
    const weekday = selectedDate.getDay();
    const dayHours = getBusinessHoursForDay(weekday);
    
    if (dayHours.isClosed) {
      return [];
    }
    
    // Parse open and close times
    const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);
    
    // Check if this is late night hours (close time is next day)
    const isLateNight = closeHour < openHour || (closeHour === openHour && closeMinute < openMinute);
    
    // Generate time slots every 15 minutes within business hours
    let currentMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    const maxSlots = 48 * 60; // Allow up to 48 hours for late night businesses (in minutes)
    
    while (currentMinutes < maxSlots) {
      // Calculate the actual hour and minute for display
      const displayHour = Math.floor(currentMinutes / 60) % 24;
      const displayMinute = currentMinutes % 60;
      const timeString = `${displayHour.toString().padStart(2, '0')}:${displayMinute.toString().padStart(2, '0')}`;
      
      // For late night hours, check if we've reached the close time
      if (isLateNight) {
        // If we've passed midnight and reached close time, stop
        if (currentMinutes >= 24 * 60 && displayHour > closeHour) {
          break;
        }
        // If we're still before midnight and haven't reached close time, continue
        if (currentMinutes < 24 * 60 && displayHour < closeHour) {
          // Continue
        } else if (currentMinutes >= 24 * 60) {
          // We've passed midnight, check if we've reached the close time
          if (displayHour > closeHour) {
            break;
          }
        }
      } else {
        // Normal hours - stop when we reach close time
        if (displayHour > closeHour || (displayHour === closeHour && displayMinute >= closeMinute)) {
          break;
        }
      }
      
      slots.push({
        time: moment().tz(timezone).hour(displayHour).minute(displayMinute).format('h:mm A'),
        hour: Math.floor(currentMinutes / 60),
        displayHour: displayHour,
        minute: displayMinute,
        minutes: currentMinutes,
        timeString,
        isNextDay: currentMinutes >= 24 * 60
      });
      
      currentMinutes += 15; // Generate slots every 15 minutes
    }
    
    return slots;
  }, [getBusinessHoursForDay, settings.timezone, selectedDate, businessHours]);


  // Calculate slot height once and use consistently
  const SLOT_HEIGHT = useMemo(() => {
    const height = getResponsiveSlotHeight();
    console.log('🔧 SLOT_HEIGHT calculated:', height, 'timeSlots:', timeSlots.length, 'windowHeight:', windowHeight);
    return height;
  }, [settings.verticalLayoutSlots, windowHeight, timeSlots]);

  // Group bookings by room and calculate positions
  const bookingsByRoom = useMemo(() => {
    console.log('🏠 Calculating bookingsByRoom - normalizedBookings:', normalizedBookings);
    console.log('🏠 Available rooms:', rooms);
    console.log('🏠 BookingsByRoom dependencies - normalizedBookings length:', normalizedBookings?.length);
    console.log('🏠 BookingsByRoom dependencies - rooms length:', rooms?.length);
    
    const grouped = {};
    const weekday = selectedDate.getDay();
    const dayHours = getBusinessHoursForDay(weekday);
    
    // Safety check for business hours
    if (!dayHours || !dayHours.openTime) {
      console.warn('⚠️ No business hours found for day', weekday);
      return {};
    }
    
    const [openHour] = dayHours.openTime.split(':').map(Number);
    
    // Safety check for open hour
    if (isNaN(openHour)) {
      console.warn('⚠️ Invalid open hour:', dayHours.openTime);
      return {};
    }
    
    // Safety check: ensure normalizedBookings is always an array
    if (!normalizedBookings || !Array.isArray(normalizedBookings)) {
      console.log('⚠️ No normalizedBookings or not an array');
      return {};
    }
    
    console.log('🏠 Processing bookings by room - total normalized bookings:', normalizedBookings.length);
    
    // Processing bookings by room
    
    rooms.forEach(room => {
      const roomBookings = normalizedBookings.filter(booking => {
        // Improved room matching logic - handle both object and ID cases
        let bookingRoomId;
        if (typeof booking.roomId === 'object' && booking.roomId !== null) {
          // roomId is an object, get the _id or id
          bookingRoomId = booking.roomId._id || booking.roomId.id;
        } else if (typeof booking.room === 'object' && booking.room !== null) {
          // room is an object, get the _id or id
          bookingRoomId = booking.room._id || booking.room.id;
        } else {
          // roomId or room is a primitive value
          bookingRoomId = booking.roomId || booking.room;
        }
        
        const roomMatch = bookingRoomId == (room._id || room.id); // Use loose equality for type flexibility
        const statusMatch = booking.status !== 'cancelled' && booking.status !== 'no_show';
        
        // Enhanced debugging for ALL bookings to see what's happening
        console.log(`🔍 Room matching for ${booking.customerName}:`, {
          bookingRoomId,
          bookingRoomIdType: typeof bookingRoomId,
          roomId: room._id || room.id,
          roomIdType: typeof (room._id || room.id),
          roomMatch,
          statusMatch,
          bookingRoomObject: booking.room,
          bookingRoomIdValue: booking.roomId,
          roomObject: room,
          bookingId: booking._id || booking.id,
          bookingStatus: booking.status,
          strictEqual: bookingRoomId === (room._id || room.id),
          looseEqual: bookingRoomId == (room._id || room.id),
          // Additional debugging for swap scenarios
          isSourceBooking: booking.customerName?.includes('John') || booking.customerName?.includes('Jane'),
          bookingTimes: {
            timeIn: booking.timeIn,
            timeOut: booking.timeOut,
            startTime: booking.startTime,
            endTime: booking.endTime
          }
        });
        
        return roomMatch && statusMatch;
      });
      
      // Debug room bookings for swap debugging
      if (roomBookings.some(b => b.customerName?.includes('John') || b.customerName?.includes('Jane'))) {
        console.log(`📊 Room ${room.name} bookings (swap debug):`, roomBookings.map(b => ({
          customerName: b.customerName,
          timeIn: b.timeIn,
          timeOut: b.timeOut,
          roomId: b.roomId,
          room: b.room,
          _id: b._id
        })));
      }
      
      console.log(`🏠 Room ${room.name} (${room._id || room.id}) has ${roomBookings.length} bookings:`, roomBookings.map(b => b.customerName));
      
      // Check if bookings are being filtered out
      if (roomBookings.length === 0 && normalizedBookings.length > 0) {
        console.warn(`⚠️ WARNING - No bookings found for room ${room.name} but ${normalizedBookings.length} total bookings exist`);
        console.log('🔍 Debug - All normalized bookings:', normalizedBookings.map(b => ({
          customerName: b.customerName,
          roomId: b.roomId,
          room: b.room,
          roomMatch: (b.room?._id || b.roomId?._id || b.room?.id || b.roomId?.id) === (room._id || room.id)
        })));
      }
      
      grouped[room._id || room.id] = roomBookings
        .map(booking => {
          const timezone = settings.timezone || 'America/New_York';
          const start = moment(booking.startTime || booking.timeIn).tz(timezone);
          const end = moment(booking.endTime || booking.timeOut).tz(timezone);
          const dayStart = moment(selectedDate).startOf('day').add(openHour, 'hours').tz(timezone);
          
          // Calculate position in minutes from open time
          const startMinutes = start.diff(dayStart, 'minutes');
          const endMinutes = end.diff(dayStart, 'minutes');
          const durationMinutes = endMinutes - startMinutes;
          
          // Convert to pixel positions
          // Don't clamp bookings - show them even if outside business hours
          const clampedStartMinutes = startMinutes;
          const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);
          const clampedEndMinutes = endMinutes;
          const clampedDuration = clampedEndMinutes - clampedStartMinutes;
          
          // Only filter out if duration is negative (invalid booking)
          if (clampedDuration <= 0) {
            console.warn(`⚠️ Invalid booking duration for ${booking.customerName}: ${clampedDuration} minutes`);
            return null;
          }
          
          // Calculate exact positioning based on actual time, not rounded to 15-minute slots
          // Convert minutes to pixels directly using the slot height per minute ratio
          const pixelsPerMinute = SLOT_HEIGHT / 15; // Each 15-minute slot is SLOT_HEIGHT pixels
          const topPixels = (clampedStartMinutes / 15) * SLOT_HEIGHT;
          const heightPixels = (clampedDuration / 15) * SLOT_HEIGHT;
          
          // For debugging, also calculate the slot-based approach
          const startSlotIndex = Math.round(clampedStartMinutes / 15);
          const durationSlots = Math.round(clampedDuration / 15);
          
          // Debug logging for positioning calculation
          if (booking.customerName === 'Mike Johnson' || booking.customerName === 'Test Booking' || booking.customerName?.includes('1 hour') || booking.customerName?.includes('hour')) {
            console.log(`🔍 ${booking.customerName} positioning debug:`, {
              // Raw booking times
              rawStartTime: booking.startTime,
              rawEndTime: booking.endTime,
              rawTimeIn: booking.timeIn,
              rawTimeOut: booking.timeOut,
              // Parsed times
              parsedStart: start.format('YYYY-MM-DD HH:mm:ss'),
              parsedEnd: end.format('YYYY-MM-DD HH:mm:ss'),
              // Calculations
              startMinutes,
              endMinutes,
              durationMinutes,
              // Exact positioning (what we're using)
              exactTopPixels: topPixels,
              exactHeightPixels: heightPixels,
              // Rounded positioning (old approach)
              startSlotIndex,
              durationSlots,
              roundedTopPixels: startSlotIndex * SLOT_HEIGHT,
              roundedHeightPixels: durationSlots * SLOT_HEIGHT,
              SLOT_HEIGHT,
              pixelsPerMinute,
              clampedStartMinutes,
              clampedEndMinutes,
              clampedDuration
            });
          }
          
          // Force minimum dimensions to ensure visibility, but only for very small durations
          const minHeight = 20; // Minimum 20px height
          const finalHeightPixels = Math.max(heightPixels, minHeight);
          
          // Debug: Check if minimum height is being applied when it shouldn't be
          if (finalHeightPixels !== heightPixels && heightPixels < minHeight) {
            console.warn(`⚠️ Minimum height applied to ${booking.customerName}:`, {
              calculatedHeight: heightPixels,
              finalHeight: finalHeightPixels,
              durationMinutes: clampedDuration,
              SLOT_HEIGHT
            });
          }
          
          // Safety check for valid dimensions
          if (isNaN(topPixels) || isNaN(finalHeightPixels) || finalHeightPixels <= 0) {
            console.warn(`⚠️ Invalid booking dimensions for ${booking.customerName}:`, {
              topPixels,
              heightPixels,
              finalHeightPixels,
              clampedStartHours,
              clampedDuration,
              SLOT_HEIGHT
            });
            return null;
          }

          const result = {
            ...booking,
            startMinutes,
            endMinutes,
            durationMinutes,
            topPixels,
            heightPixels: finalHeightPixels,
          };
          
          // Debug logging for positioning
          console.log(`🔍 Debug - Booking ${booking.customerName} positioning:`, {
            startMinutes,
            endMinutes,
            durationMinutes,
            startSlotIndex,
            durationSlots,
            topPixels,
            heightPixels,
            SLOT_HEIGHT,
            startTime: booking.startTime,
            endTime: booking.endTime,
            dayStart: dayStart.format()
          });
          
          return result;
        })
        .filter(Boolean);
    });
    
    console.log('🏠 Final bookingsByRoom result:', grouped);
    return grouped;
  }, [rooms, normalizedBookings, selectedDate, getBusinessHoursForDay, businessHours, SLOT_HEIGHT, timeSlots, getActualRoomColumnWidth, windowWidth, sidebarOpen, forceRender]);

  // Handle date navigation
  const navigateDate = (direction) => {
    console.log('🗓️ Navigate date:', direction);
    console.log('🗓️ Current selectedDate:', selectedDate);
    const newDate = moment(selectedDate).add(direction, 'day');
    console.log('🗓️ New date will be:', newDate.toDate());
    setSelectedDate(newDate.toDate());
    console.log('🗓️ Navigate date completed');
  };

  // Handle mini calendar month navigation only
  const navigateMonth = (direction) => {
    const next = moment(calendarBaseDate).add(direction, 'month').toDate();
    setCalendarBaseDate(next);
  };

  // Handle calendar day click
  const handleDayClick = (day) => {
    console.log('🗓️ Day clicked:', day.date.format('YYYY-MM-DD'));
    const picked = day.date.toDate();
    setSelectedDate(picked);
    setCalendarBaseDate(picked);
  };

  // Handle room slot click
  const handleRoomSlotClick = (room, timeSlot) => {
    const weekday = selectedDate.getDay();
    const dayHours = getBusinessHoursForDay(weekday);
    const [openHour] = dayHours.openTime.split(':').map(Number);
    const dayStart = moment(selectedDate).startOf('day').add(openHour, 'hours');
    const startTime = dayStart.clone().add(timeSlot.hour - openHour, 'hours');
    const endTime = startTime.clone().add(1, 'hour');
    
    setSelectedBooking({
      start: startTime.toDate(),
      end: endTime.toDate(),
      resource: {
        roomId: room._id || room.id,
        roomName: room.name,
        roomType: room.category,
        capacity: room.capacity,
      },
    });
    setIsModalOpen(true);
  };

  // Handle booking click - show read-only view first
  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  // Handle no show
  const handleNoShow = async (booking) => {
    try {
      await updateBookingMutation.mutateAsync({
        id: booking._id,
        data: { status: 'no_show' }
      });
      setIsViewModalOpen(false);
    } catch (error) {
      console.error('Failed to mark as no show:', error);
    }
  };

  // Handle edit from view modal
  const handleEditBooking = (booking) => {
    setSelectedBooking({
      id: booking._id,
      title: booking.customerName,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      resource: {
        roomId: booking.roomId._id,
        roomName: booking.roomId.name,
        roomType: booking.roomId.type,
        capacity: booking.roomId.capacity,
        color: booking.roomId.color,
        phone: booking.phone,
        source: booking.source,
        notes: booking.notes,
        duration: booking.durationMinutes,
      },
    });
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  // Helper function to find booking conflicts
  const findBookingConflicts = (roomId, startTime, endTime, excludeBookingId = null) => {
    if (!normalizedBookings || !Array.isArray(normalizedBookings)) {
      return [];
    }
    
    console.log('🔍 Finding conflicts for:', {
      roomId,
      startTime,
      endTime,
      excludeBookingId,
      totalBookings: normalizedBookings.length
    });
    
    const conflicts = normalizedBookings.filter(b => {
      if (b._id === excludeBookingId) {
        console.log(`🔍 Skipping excluded booking: ${b.customerName}`);
        return false;
      }
      
      // Improved room matching logic
      let bookingRoomId;
      if (typeof b.roomId === 'object' && b.roomId !== null) {
        bookingRoomId = b.roomId._id || b.roomId.id;
      } else if (typeof b.room === 'object' && b.room !== null) {
        bookingRoomId = b.room._id || b.room.id;
      } else {
        bookingRoomId = b.roomId || b.room;
      }
      
      const roomMatch = bookingRoomId == roomId; // Use loose equality for type flexibility
      
      if (!roomMatch) {
        console.log(`🔍 Booking ${b.customerName} not in target room:`, {
          bookingRoomId,
          targetRoomId: roomId,
          roomMatch
        });
        return false;
      }
      
      const bStart = moment(b.startTime || b.timeIn);
      const bEnd = moment(b.endTime || b.timeOut);
      const newStart = moment(startTime);
      const newEnd = moment(endTime);
      
      // Check for overlap
      const overlaps = newStart.isBefore(bEnd) && newEnd.isAfter(bStart);
      
      console.log(`🔍 Checking overlap for ${b.customerName}:`, {
        bookingStart: bStart.format(),
        bookingEnd: bEnd.format(),
        newStart: newStart.format(),
        newEnd: newEnd.format(),
        overlaps
      });
      
      return overlaps;
    });
    
    console.log('🔍 Found conflicts:', conflicts.map(c => c.customerName));
    return conflicts;
  };

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    if (!normalizedBookings || !Array.isArray(normalizedBookings)) {
      return;
    }
    const booking = normalizedBookings.find(b => b._id === active.id);
    setActiveId(active.id);
    setDraggedBooking(booking);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedBooking(null);

    if (!over) {
      console.log('🚫 Drag ended without valid drop target');
      return;
    }

    const overId = String(over.id);
    console.log('🎯 Drag ended over:', overId);
    
    if (!normalizedBookings || !Array.isArray(normalizedBookings)) {
      console.log('🚫 No normalized bookings available');
      return;
    }
    const booking = normalizedBookings.find(b => b._id === active.id);
    
    if (!booking) {
      console.log('🚫 Booking not found for active ID:', active.id);
      return;
    }
    
    console.log('📋 Moving booking:', booking.customerName);

    if (overId.startsWith('slot-')) {
      const rest = overId.slice('slot-'.length);
      const lastDash = rest.lastIndexOf('-');
      if (lastDash === -1) {
        console.log('🚫 Invalid slot ID format:', overId);
        return;
      }
      const roomId = parseInt(rest.slice(0, lastDash));
      const timeSlotIndex = rest.slice(lastDash + 1);
      console.log('🏠 Room ID extraction:', {
        overId,
        rest,
        lastDash,
        roomId,
        timeSlotIndex,
        roomIdType: typeof roomId,
        availableRooms: rooms.map(r => ({ _id: r._id, id: r.id, name: r.name }))
      });
      
      // Calculate new time slot for vertical view
      const weekday = selectedDate.getDay();
      const dayHours = getBusinessHoursForDay(weekday);
      const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
      
      // Convert slot index to actual time (each slot is 15 minutes)
      const slotIndex = parseInt(timeSlotIndex);
      const slotMinutes = slotIndex * 15; // Each slot is 15 minutes
      const totalMinutes = (openHour * 60) + openMinute + slotMinutes;
      const slotHour = Math.floor(totalMinutes / 60);
      const slotMinute = totalMinutes % 60;
      
      const dayStart = moment(selectedDate).startOf('day');
      const newTimeIn = dayStart.clone().add(slotHour, 'hours').add(slotMinute, 'minutes').toISOString();
      const duration = moment(booking.timeOut || booking.endTime).diff(moment(booking.timeIn || booking.startTime), 'minutes', true);
      const newTimeOut = dayStart.clone().add(slotHour, 'hours').add(slotMinute, 'minutes').add(duration, 'minutes').toISOString();

      console.log('⏰ Time calculation:', {
        timeSlotIndex,
        slotIndex,
        slotMinutes,
        totalMinutes,
        slotHour,
        slotMinute,
        openHour,
        openMinute,
        newTimeIn,
        newTimeOut,
        duration
      });

      // Check if dropping on different room or time
      const currentRoomId = booking.room?._id || booking.roomId?._id || booking.roomId;
      const currentStartTime = moment(booking.timeIn || booking.startTime);
      const isSamePosition = currentRoomId === roomId && 
        currentStartTime.hour() === slotHour && 
        currentStartTime.minute() === slotMinute;
        
      console.log('🔄 Position check:', { currentRoomId, roomId, isSamePosition });

      if (!isSamePosition) {
        // Check for conflicts in the target position
        const conflicts = findBookingConflicts(roomId, newTimeIn, newTimeOut, booking._id);
        console.log('🔍 Conflicts found:', conflicts.length);
        
        if (conflicts.length === 1) {
          // Single conflict - perform swap
          const targetBooking = conflicts[0];
          console.log('🔄 Swapping bookings:', {
            source: booking.customerName,
            target: targetBooking.customerName,
            sourceRoom: booking.room?.name || 'Unknown',
            targetRoom: targetBooking.room?.name || 'Unknown',
            newRoomId: roomId,
            sourceNewTime: newTimeIn,
            targetNewTime: targetBooking.timeIn || targetBooking.startTime
          });
          
          // Calculate the target booking's new time (swap the start times)
          const targetDuration = moment(targetBooking.timeOut || targetBooking.endTime).diff(moment(targetBooking.timeIn || targetBooking.startTime), 'minutes', true);
          const sourceDuration = moment(booking.timeOut || booking.endTime).diff(moment(booking.timeIn || booking.startTime), 'minutes', true);
          
          // For swap: 
          // - Source gets the dropped slot time (already calculated as newTimeIn/newTimeOut)
          // - Target gets the source's original time slot (same day, same time as source's original)
          const sourceOriginalTime = moment(booking.timeIn || booking.startTime);
          const targetNewTimeIn = dayStart.clone()
            .add(sourceOriginalTime.hour(), 'hours')
            .add(sourceOriginalTime.minute(), 'minutes')
            .toISOString();
          const targetNewTimeOut = moment(targetNewTimeIn).add(targetDuration, 'minutes').toISOString();
          
          console.log('🔄 Swap time calculation:', {
            sourceOriginal: {
              timeIn: booking.timeIn || booking.startTime,
              timeOut: booking.timeOut || booking.endTime,
              duration: sourceDuration
            },
            targetOriginal: {
              timeIn: targetBooking.timeIn || targetBooking.startTime,
              timeOut: targetBooking.timeOut || targetBooking.endTime,
              duration: targetDuration
            },
            sourceNew: {
              timeIn: newTimeIn,
              timeOut: newTimeOut
            },
            targetNew: {
              timeIn: targetNewTimeIn,
              timeOut: targetNewTimeOut
            }
          });
          
          // Get target room ID (source's original room)
          const targetRoomId = booking.room?._id || booking.roomId?._id || booking.roomId;
          
          console.log('🔄 Room ID details for swap:', {
            sourceBooking: {
              customerName: booking.customerName,
              room: booking.room,
              roomId: booking.roomId,
              targetRoomId
            },
            targetBooking: {
              customerName: targetBooking.customerName,
              room: targetBooking.room,
              roomId: targetBooking.roomId
            },
            newRoomId,
            roomId
          });
          
          moveBookingMutation.mutate({
            bookingId: booking._id,
            newRoomId: roomId,
            newTimeIn,
            newTimeOut,
            targetBookingId: targetBooking._id,
            targetRoomId: targetRoomId,
            targetNewTimeIn,
            targetNewTimeOut
          });
        } else if (conflicts.length === 0) {
          // No conflicts - simple move
          console.log('📍 Moving booking:', booking.customerName, 'to new position');
          console.log('📤 Mutation data:', {
            bookingId: booking._id,
            newRoomId: roomId,
            newTimeIn,
            newTimeOut,
          });
          moveBookingMutation.mutate({
            bookingId: booking._id,
            newRoomId: roomId,
            newTimeIn,
            newTimeOut,
          });
        } else {
          // Multiple conflicts - show error
          console.warn('⚠️ Cannot drop: Multiple booking conflicts detected');
          toast.error('Cannot place booking here: Multiple conflicting reservations detected.');
        }
      } else {
        console.log('📍 Same position - no action needed');
      }
    } else if (overId.startsWith('booking-')) {
      // Handle direct booking-to-booking swap
      const targetId = overId.slice('booking-'.length);
      const targetBooking = normalizedBookings?.find(b => b._id === targetId);
      if (targetBooking && targetBooking._id !== booking._id) {
        const targetRoomId = targetBooking.room?._id || targetBooking.roomId?._id || targetBooking.roomId;
        console.log('🔄 Direct swap:', booking.customerName, '↔', targetBooking.customerName);
        moveBookingMutation.mutate({
          bookingId: booking._id,
          newRoomId: targetRoomId,
          newTimeIn: targetBooking.timeIn || targetBooking.startTime,
          newTimeOut: targetBooking.timeOut || targetBooking.endTime,
          targetBookingId: targetBooking._id,
        });
      }
    }
  };

  // Handle booking resize
  const handleBookingResize = (bookingId, resizeData) => {
    const { top, height, handle } = resizeData;
    if (!normalizedBookings || !Array.isArray(normalizedBookings)) {
      return;
    }
    const booking = normalizedBookings.find(b => b._id === bookingId);
    if (!booking) return;

    // Convert pixels to time (use consistent slot height)
    const weekday = selectedDate.getDay();
    const dayHours = getBusinessHoursForDay(weekday);
    const [openHour] = dayHours.openTime.split(':').map(Number);
    const dayStart = moment(selectedDate).startOf('day').add(openHour, 'hours');
    
    // Calculate new times based on pixel changes
    const topHours = top / SLOT_HEIGHT;
    const heightHours = height / SLOT_HEIGHT;
    
    let newStartTime, newEndTime;
    
    if (handle === 'top') {
      // Changing start time (top edge)
      newStartTime = dayStart.clone().add(topHours, 'hours').toISOString();
      newEndTime = booking.endTime; // Keep end time same
    } else {
      // Changing end time (bottom edge)
      newStartTime = booking.startTime; // Keep start time same
      newEndTime = dayStart.clone().add(topHours + heightHours, 'hours').toISOString();
    }

    // Call resize API
    resizeBookingMutation.mutate({
      bookingId,
      newStartTime,
      newEndTime,
    });
  };

  // Handle double click to resize/expand
  const handleBookingDoubleClick = (booking) => {
    setSelectedBooking({
      id: booking._id,
      title: booking.customerName,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      resource: {
        roomId: booking.room?._id || booking.roomId?._id,
        roomName: booking.room?.name || booking.roomId?.name,
        roomType: booking.room?.type || booking.roomId?.type,
        capacity: booking.room?.capacity || booking.roomId?.capacity,
        color: booking.room?.color || booking.roomId?.color,
        phone: booking.phone,
        source: booking.source,
        notes: booking.notes,
        duration: booking.durationMinutes,
      },
    });
    setIsModalOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton type="schedule" />;
  }

  // Show error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load schedule</h3>
          <p className="text-gray-600 mb-4">
            {roomsError ? 'Unable to load rooms' : 'Unable to load bookings'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render both layouts but show only the active one
  return (
    <>
      {/* Traditional Schedule Layout */}
      {settings.layoutOrientation === 'rooms-y-time-x' && (
        <TraditionalSchedule
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSettingsClick={() => setShowSettings(true)}
        />
      )}
      
      {/* Apple Calendar Layout */}
      {settings.layoutOrientation === 'rooms-x-time-y' && (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64 md:w-72 lg:w-80' : 'w-14'} bg-white border-r border-gray-200 flex flex-col sticky top-0 self-start h-screen`}>
        {/* Header */}
        <div className="p-2 border-b border-gray-200">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} mb-2`}>
            <div className={`flex items-center space-x-2 ${sidebarOpen ? '' : 'hidden'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">♪</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Karaoke Calendar</h1>
            </div>
            <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px]" onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Collapse' : 'Expand'}>
              <Menu className="w-10 h-10" />
            </Button>
          </div>
        </div>

        {/* Mini Calendar */}
        <div className={`p-6 flex-1 overflow-hidden ${sidebarOpen ? '' : 'hidden'}`}>
          {/* Today button top-right */}
          <div className="flex items-center justify-end mb-1">
            <Button 
              variant="ghost" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedDate(new Date());
              }}
            >
              Today
            </Button>
          </div>
          {/* Centered header with arrows + month */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors [&>svg]:w-8 [&>svg]:h-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateMonth(-1);
                }}
              >
                <ChevronLeft className="w-8 h-8 strokeWidth={2.5}" />
              </button>
              <div className="min-w-[140px] text-center text-lg font-semibold text-gray-900 select-none">
                {moment(calendarBaseDate).format('MMMM YYYY')}
              </div>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors [&>svg]:w-8 [&>svg]:h-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateMonth(1);
                }}
              >
                <ChevronRight className="w-8 h-8 strokeWidth={2.5}" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDayClick(day);
                  }}
                  className={`
                    w-8 h-8 rounded-lg text-sm font-medium transition-colors
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isToday ? 'bg-blue-100 text-blue-600' : ''}
                    ${day.isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                  `}
                >
                  {day.date.format('D')}
                </button>
              ))}
            </div>
          </div>

          {/* Booking Source Legend (under mini calendar) */}
          {settings.colorByBookingSource && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Booking Sources</h4>
              <div className="grid grid-cols-2 gap-y-2">
                {Object.entries(settings.bookingSourceColors || {}).map(([key, color]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-700 capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Profile */}
          <div className="mt-8 flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 font-medium">N</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Staff User</p>
              <p className="text-xs text-gray-500">admin@boomkaraoke.com</p>
            </div>
          </div>

          
        </div>

        {/* Bottom Sticky Actions: Instructions + Settings */}
        <div className="mt-auto border-t border-gray-200 p-2 space-y-2">
          {sidebarOpen ? (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowInstructions(true)}
              >
                <CalendarIcon className="w-4 h-4 mr-3" />
                Instructions
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12"
                onClick={() => setShowInstructions(true)}
                title="Instructions"
              >
                <CalendarIcon className="w-6 h-6" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-12 w-12"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                <Settings className="w-6 h-6" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="h-12 w-12 [&>svg]:w-8 [&>svg]:h-8" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
              </Button>
              <h2 className="text-2xl font-semibold text-gray-900">
                {moment(selectedDate).format('MMMM D, YYYY')}
              </h2>
              <Button variant="ghost" size="icon" className="h-12 w-12 [&>svg]:w-8 [&>svg]:h-8" onClick={() => navigateDate(1)}>
                <ChevronRight className="w-8 h-8" strokeWidth={2.5} />
              </Button>
            </div>
            {/* Removed top-right new booking button (replaced by floating action button) */}
          </div>
        </div>

        {/* Schedule Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={(e) => {
            // Cancel any long-press timers to avoid resize-mode delay feeling
            try {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('cancel-long-press'));
              }
            } catch {}
            handleDragStart(e);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 relative max-h-[calc(100vh-200px)] overflow-hidden">
            <div key={`schedule-grid-${forceRender}-${JSON.stringify(bookingsByRoom)}`} className="flex flex-col h-full">
              {/* Sticky Header Row */}
              <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0 z-20">
                <div className="h-16 border-r border-gray-200 bg-gray-50" style={{ width: TIME_COL_WIDTH }}></div>
                {rooms.map(room => (
                  <div
                    key={room._id || room.id}
                    className="flex-1 h-16 border-r border-gray-200 px-3 md:px-4 flex items-center last:border-r-0"
                    style={{ minWidth: `${ROOM_COL_WIDTH}px` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: settings.colorByBookingSource ? '#9ca3af' : (room.color || getRoomTypeColor(room.category)) }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-500">
                          {room.category?.charAt(0).toUpperCase() + room.category?.slice(1)} ({room.capacity} max)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Scrollable Content Area */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sticky Time Column */}
                <div ref={timeColumnRef} onScroll={syncGridFromTime} className="bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto" style={{ width: TIME_COL_WIDTH }}>
                  {timeSlots.map((slot, slotIndex) => (
                    <div 
                      key={slotIndex}
                      className={`border-b border-gray-200 text-right pr-1 md:pr-2 pt-1 flex items-start justify-end ${slot.isNextDay ? 'bg-gray-50/30' : ''}`}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                    >
                      <span className="text-xs text-gray-500 font-medium">{slot.time}</span>
                    </div>
                  ))}
                </div>

                {/* Scrollable Slots */}
                <div ref={gridScrollRef} onScroll={syncTimeFromGrid} className="flex-1 overflow-auto">
                  <div className="flex" style={{ minWidth: `${rooms.length * ROOM_COL_WIDTH}px` }}>
                    {rooms.map((room, roomIndex) => (
                      <div key={room._id || room.id} className="flex-1 border-r border-gray-200 last:border-r-0" style={{ minWidth: `${ROOM_COL_WIDTH}px` }}>
                        {timeSlots.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            className={`relative ${slot.isNextDay ? 'bg-gray-50/30' : ''}`}
                            style={{ height: `${SLOT_HEIGHT}px` }}
                          >
                            <DroppableSlot
                              id={`slot-${room._id || room.id}-${slotIndex}`}
                              className="w-full h-full hover:bg-blue-50 cursor-pointer"
                              onClick={() => handleRoomSlotClick(room, slot)}
                              bookings={normalizedBookings}
                              draggedBooking={draggedBooking}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            

            {/* Current time indicator - positioned outside bookings layer for proper overflow */}
            {currentTimeData && (() => {
              const slotIndex = Math.round(currentTimeData.minutesFromStart / 15);
              const topPixels = slotIndex * SLOT_HEIGHT;
              // Position label so 50% extends above the timeline header
              const labelTop = 64 + topPixels - 24; // 64px is the header height, -12px for 50% overflow
              return (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{ top: `${labelTop}px`, left: `${TIME_COL_WIDTH}px`, right: '0' }}
                >
                  {/* Time label - positioned with 50% overflow above timeline */}
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-r-md shadow-lg font-medium inline-block">
                    {currentTimeData.time}
                  </div>
                </div>
              );
            })()}

            {/* Bookings layer - absolutely positioned over the scrollable area */}
            <div className="absolute" style={{ top: '64px', left: `${TIME_COL_WIDTH}px`, right: '0', bottom: '0', pointerEvents: 'none' }}>
              {/* Current time line - extends horizontally through the schedule */}
              {currentTimeData && (() => {
                const slotIndex = Math.round(currentTimeData.minutesFromStart / 15);
                const topPixels = slotIndex * SLOT_HEIGHT;
                return (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${topPixels}px` }}
                  >
                    {/* Red line extending horizontally through all rooms */}
                    <div className="h-0.5 w-full bg-red-500 shadow-sm"></div>
                  </div>
                );
              })()}

              {rooms.map((room, roomIndex) => {
                const roomBookings = bookingsByRoom[room._id || room.id] || [];

                return roomBookings.map((booking) => {
                  // Calculate proper positioning to align with grid slots
                  const roomColumnWidth = getActualRoomColumnWidth();
                  const leftOffset = roomIndex * roomColumnWidth;
                  
                  const style = {
                    position: 'absolute',
                    left: `${leftOffset + 2}px`,
                    width: `${roomColumnWidth - 4}px`,
                    top: `${booking.topPixels}px`,
                    height: `${booking.heightPixels}px`,
                    backgroundColor: settings.colorByBookingSource ? getBookingColorBySource(booking) : (room.color || getRoomTypeColor(room.category)),
                    zIndex: 10,
                    pointerEvents: 'auto',
                  };
                  
                  console.log(`🔍 Debug - Rendering booking ${booking.customerName} with style:`, style);
                  console.log(`🔍 Debug - SLOT_HEIGHT used for rendering:`, SLOT_HEIGHT);
                  
                  // Check for invisible booking issues
                  if (booking.heightPixels <= 0 || booking.topPixels < 0) {
                    console.warn(`⚠️ WARNING - Booking ${booking.customerName} has invalid dimensions:`, {
                      heightPixels: booking.heightPixels,
                      topPixels: booking.topPixels,
                      widthPixels: booking.widthPixels,
                      leftPixels: booking.leftPixels
                    });
                  }
                  
                  return (
                    <DraggableBooking
                      key={`${room._id || room.id}-${booking._id || booking.id}`}
                      booking={booking}
                      onDoubleClick={handleBookingDoubleClick}
                      onResize={handleBookingResize}
                      style={style}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookingClick(booking);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate pr-1">{booking.customerName || 'Reservation'}</div>
                      {booking.notes ? (
                        <span className="ml-1 text-[10px] bg-white/90 text-gray-800 px-1.5 py-0.5 rounded">Note</span>
                      ) : null}
                    </div>
                    <div className="opacity-90 truncate text-[11px]">
                      {moment(booking.startTime).format('h:mm A')} - {moment(booking.endTime).format('h:mm A')}
                    </div>
                    {booking.notes && (
                      <div className="mt-1 text-[10px] text-white truncate" title={booking.notes}>
                        {booking.notes}
                      </div>
                    )}
                  </DraggableBooking>
                  );
                });
              })}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeId && draggedBooking ? (
              <div className="rounded-lg p-2 shadow-lg border text-white text-xs bg-blue-600">
                <div className="font-medium truncate">{draggedBooking.customerName || 'Reservation'}</div>
                <div className="opacity-90 truncate text-[11px]">
                  {moment(draggedBooking.startTime).format('h:mm A')} - {moment(draggedBooking.endTime).format('h:mm A')}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Floating action button: New Booking */}
        <button
          type="button"
          onClick={() => {
            const weekday = selectedDate.getDay();
            const dayHours = getBusinessHoursForDay(weekday);
            const [openHour] = dayHours.openTime.split(':').map(Number);
            const start = moment(selectedDate).startOf('hour');
            const end = start.clone().add(1, 'hour');
            setSelectedBooking({
              start: start.toDate(),
              end: end.toDate(),
              resource: { roomId: rooms?.[0]?._id }
            });
            setIsModalOpen(true);
          }}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 z-50 flex items-center justify-center"
          aria-label="New booking"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* Reservation View Modal */}
        <ReservationViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onEdit={handleEditBooking}
          onNoShow={handleNoShow}
          onDelete={(booking) => {
            // Handle delete if needed
            console.log('Delete booking:', booking);
          }}
        />

        {/* Booking Modal */}
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          rooms={rooms}
          onSuccess={() => {
            setIsModalOpen(false);
            setSelectedBooking(null);
          }}
        />
      </div>
    </div>
      )}
      
      {/* Settings Modal - shared between layouts */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <InstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
};

export default AppleCalendarDashboard;