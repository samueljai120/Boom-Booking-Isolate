# Full-Stack Data Flow: Request Lifecycles & System Interactions

## Overview

This document provides comprehensive mapping of data flow patterns, request lifecycles, and system interactions across the Boom Karaoke Booking System. It serves as a reference for understanding how data moves through the application stack and identifying optimization opportunities.

## Authentication Flow

### User Login Process

#### 1. Frontend Login Request
```
User Input → LoginForm Component → AuthContext.login()
```

**Data Flow**:
```javascript
// src/contexts/AuthContext.jsx
const login = async (credentials) => {
  // 1. Call API with credentials
  const response = await authAPI.login(credentials);
  
  // 2. Extract token and user data
  const { token, user } = response.data;
  
  // 3. Store in localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // 4. Update React state
  setToken(token);
  setUser(user);
  
  return { success: true };
};
```

#### 2. API Request Processing
```
Frontend → Axios Interceptor → Backend /api/auth/login
```

**Request Format**:
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### 3. Backend Authentication
```javascript
// backend/routes/auth.js
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  // 1. Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // 2. Query database for user
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  // 3. Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);

  // 4. Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );

  // 5. Return response
  res.json({ success: true, token, user: {...} });
});
```

#### 4. Response Processing
```javascript
// Response format
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

### Session Management

#### Automatic Token Injection
```javascript
// src/lib/api.js - Axios Interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Session Validation
```javascript
// backend/routes/auth.js - Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}
```

## Booking Management Flow

### Create New Booking

#### 1. Frontend Booking Creation
```
User Input → BookingModal → AppleCalendarDashboard → bookingsAPI.create()
```

**Data Flow**:
```javascript
// src/components/BookingModal.jsx
const handleSubmit = async (data) => {
  // 1. Validate form data
  const validatedData = {
    room_id: parseInt(data.room_id),
    customer_name: data.customer_name,
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    start_time: moment(data.start_time).toISOString(),
    end_time: moment(data.end_time).toISOString(),
    notes: data.notes
  };

  // 2. Call API
  const response = await bookingsAPI.create(validatedData);
  
  // 3. Update UI state
  queryClient.invalidateQueries(['bookings']);
  setIsModalOpen(false);
  
  // 4. Show success notification
  toast.success('Booking created successfully!');
};
```

#### 2. API Request Processing
```
Frontend → POST /api/bookings → Backend Route Handler
```

**Request Format**:
```json
POST /api/bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "room_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "555-0123",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T12:00:00Z",
  "notes": "Birthday party"
}
```

#### 3. Backend Processing Pipeline
```javascript
// backend/routes/bookings.js
router.post('/', [
  body('room_id').isInt({ min: 1 }),
  body('customer_name').isLength({ min: 1 }).trim(),
  body('customer_email').isEmail().normalizeEmail().optional(),
  body('customer_phone').isLength({ min: 1 }).trim().optional(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
  body('notes').trim().optional()
], (req, res) => {
  // 1. Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // 2. Check for time conflicts
  const conflictQuery = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND status != 'cancelled' 
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `;

  db.get(conflictQuery, [room_id, end_time, start_time, start_time, end_time], (err, row) => {
    if (row.count > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing booking' });
    }

    // 3. Get room price
    db.get('SELECT price_per_hour FROM rooms WHERE id = ?', [room_id], (err, room) => {
      // 4. Calculate total price
      const start = new Date(start_time);
      const end = new Date(end_time);
      const durationHours = (end - start) / (1000 * 60 * 60);
      const totalPrice = durationHours * room.price_per_hour;

      // 5. Create booking
      db.run(
        `INSERT INTO bookings (room_id, customer_name, customer_email, customer_phone, 
         start_time, end_time, notes, total_price) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [room_id, customer_name, customer_email, customer_phone, start_time, end_time, notes, totalPrice],
        function(err) {
          // 6. Fetch created booking with room details
          const fetchQuery = `
            SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.id = ?
          `;

          db.get(fetchQuery, [this.lastID], (err, booking) => {
            res.status(201).json({ success: true, data: booking });
          });
        }
      );
    });
  });
});
```

#### 4. Database Operations Sequence
```
1. Conflict Detection Query
   └── SELECT COUNT(*) FROM bookings WHERE room_id = ? AND time_overlap

2. Room Price Query
   └── SELECT price_per_hour FROM rooms WHERE id = ?

3. Booking Insertion
   └── INSERT INTO bookings (room_id, customer_name, ...)

4. Created Booking Fetch
   └── SELECT b.*, r.name FROM bookings b JOIN rooms r WHERE b.id = ?
```

#### 5. Response Processing
```javascript
// Response format
{
  "success": true,
  "data": {
    "id": 123,
    "room_id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "555-0123",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T12:00:00Z",
    "status": "confirmed",
    "notes": "Birthday party",
    "total_price": 50.00,
    "room_name": "Room A",
    "room_capacity": 4,
    "room_category": "Standard",
    "created_at": "2024-01-15T09:30:00Z",
    "updated_at": "2024-01-15T09:30:00Z"
  }
}
```

### Booking Drag & Drop (Move Operation)

#### 1. Frontend Drag & Drop
```
User Drag → DndContext → handleDragEnd → bookingsAPI.move()
```

**Data Flow**:
```javascript
// src/components/AppleCalendarDashboard.jsx
const handleDragEnd = async (event) => {
  const { active, over } = event;
  
  if (!over) return;
  
  // 1. Extract booking and target slot data
  const bookingId = active.id;
  const targetRoomId = over.data.current.roomId;
  const targetTime = over.data.current.time;
  
  // 2. Calculate new time slots
  const booking = bookings.find(b => b.id === bookingId);
  const duration = moment(booking.end_time).diff(moment(booking.start_time));
  const newStartTime = targetTime;
  const newEndTime = moment(targetTime).add(duration, 'milliseconds');
  
  // 3. Call move API
  const moveData = {
    bookingId,
    newRoomId: targetRoomId,
    newTimeIn: newStartTime.toISOString(),
    newTimeOut: newEndTime.toISOString()
  };
  
  try {
    await bookingsAPI.move(moveData);
    queryClient.invalidateQueries(['bookings']);
    toast.success('Booking moved successfully!');
  } catch (error) {
    toast.error('Failed to move booking: ' + error.message);
  }
};
```

#### 2. Backend Move Processing
```javascript
// backend/routes/bookings.js
router.put('/:id/move', [
  body('new_room_id').isInt({ min: 1 }),
  body('new_start_time').isISO8601(),
  body('new_end_time').isISO8601()
], (req, res) => {
  const { id } = req.params;
  const { new_room_id, new_start_time, new_end_time } = req.body;

  // 1. Check for conflicts in new time slot
  const conflictQuery = `
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND status != 'cancelled' AND id != ?
    AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  `;

  db.get(conflictQuery, [new_room_id, id, new_end_time, new_start_time, new_start_time, new_end_time], (err, row) => {
    if (row.count > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing booking' });
    }

    // 2. Update booking
    db.run(
      'UPDATE bookings SET room_id = ?, start_time = ?, end_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [new_room_id, new_start_time, new_end_time, id],
      function(err) {
        // 3. Fetch updated booking
        const fetchQuery = `
          SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
          FROM bookings b
          JOIN rooms r ON b.room_id = r.id
          WHERE b.id = ?
        `;

        db.get(fetchQuery, [id], (err, row) => {
          res.json({ success: true, data: row });
        });
      }
    );
  });
});
```

## Real-time Communication Flow

### WebSocket Connection Management

#### 1. Connection Establishment
```
Frontend → WebSocketContext → Socket.IO Client → Backend
```

**Data Flow**:
```javascript
// src/contexts/WebSocketContext.jsx
const connect = useCallback(() => {
  const token = localStorage.getItem('authToken');
  
  socket.current = io(WS_URL, {
    auth: { token },
    transports: ['websocket']
  });

  socket.current.on('connect', () => {
    setConnected(true);
    setError(null);
  });

  socket.current.on('disconnect', () => {
    setConnected(false);
  });

  socket.current.on('error', (error) => {
    setError(error.message);
  });
}, []);
```

#### 2. Room Subscription
```javascript
// Join room for booking updates
const joinRoom = useCallback((roomId) => {
  if (socket.current && connected) {
    socket.current.emit('join-room', { roomId });
  }
}, [connected]);

// Leave room
const leaveRoom = useCallback((roomId) => {
  if (socket.current && connected) {
    socket.current.emit('leave-room', { roomId });
  }
}, [connected]);
```

#### 3. Backend WebSocket Handling
```javascript
// backend/server.js
io.on('connection', (socket) => {
  // Join room for booking updates
  socket.on('join-room', (roomId) => {
    socket.join(`room-${roomId}`);
  });
  
  // Leave room
  socket.on('leave-room', (roomId) => {
    socket.leave(`room-${roomId}`);
  });
});

// Broadcasting booking changes
const broadcastBookingChange = (roomId, bookingData) => {
  io.to(`room-${roomId}`).emit('booking-updated', bookingData);
};
```

#### 4. Real-time Updates Processing
```javascript
// Frontend subscription to booking changes
const subscribeToBookingChanges = useCallback((callback) => {
  if (socket.current) {
    socket.current.on('booking-updated', callback);
    
    return () => {
      socket.current.off('booking-updated', callback);
    };
  }
}, []);

// Usage in dashboard
useEffect(() => {
  const unsubscribe = subscribeToBookingChanges((data) => {
    // Invalidate relevant queries to refetch data
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['availability'] });
  });

  return unsubscribe;
}, [queryClient]);
```

## Data Fetching and Caching Flow

### React Query Integration

#### 1. Query Configuration
```javascript
// src/App.jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.response?.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});
```

#### 2. Rooms Data Fetching
```javascript
// src/components/AppleCalendarDashboard.jsx
const { data: roomsData, isLoading: roomsLoading } = useQuery({
  queryKey: ['rooms'],
  queryFn: () => roomsAPI.getAll(),
  staleTime: 10 * 60 * 1000, // 10 minutes for rooms
});
```

#### 3. Bookings Data Fetching
```javascript
const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
  queryKey: ['bookings', selectedDate],
  queryFn: () => bookingsAPI.getAll({ 
    date: moment(selectedDate).format('YYYY-MM-DD') 
  }),
  staleTime: 2 * 60 * 1000, // 2 minutes for bookings
});
```

#### 4. Cache Invalidation
```javascript
// After creating a booking
const createBookingMutation = useMutation({
  mutationFn: bookingsAPI.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['bookings']);
    queryClient.invalidateQueries(['availability']);
  },
});
```

## Settings Management Flow

### Settings Context Data Flow

#### 1. Settings Loading
```javascript
// src/contexts/SettingsContext.jsx
const getInitialSettings = () => {
  try {
    const savedSettings = localStorage.getItem('karaoke-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
};
```

#### 2. Settings Updates
```javascript
const updateSetting = useCallback((key, value) => {
  setSettings(prev => {
    const newSettings = { ...prev, [key]: value };
    localStorage.setItem('karaoke-settings', JSON.stringify(newSettings));
    return newSettings;
  });
}, []);
```

#### 3. Settings Persistence
```javascript
// Auto-save to localStorage on changes
useEffect(() => {
  localStorage.setItem('karaoke-settings', JSON.stringify(settings));
}, [settings]);
```

### Business Hours Management

#### 1. Frontend Business Hours Update
```javascript
// src/components/SettingsModal.jsx
const handleBusinessHoursUpdate = async (hours) => {
  try {
    await businessHoursAPI.update({ businessHours: hours });
    toast.success('Business hours updated successfully!');
  } catch (error) {
    toast.error('Failed to update business hours');
  }
};
```

#### 2. Backend Business Hours Processing
```javascript
// backend/routes/businessHours.js
router.put('/', async (req, res) => {
  try {
    const { hours } = req.body;
    
    // 1. Clear existing hours
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM business_hours', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 2. Insert new hours
    for (const hour of hours) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?)',
          [hour.day_of_week, hour.open_time, hour.close_time, hour.is_closed],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // 3. Fetch updated hours
    const updatedHours = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM business_hours ORDER BY day_of_week', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({ success: true, data: updatedHours });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update business hours' });
  }
});
```

## Error Handling Flow

### Frontend Error Handling

#### 1. API Error Interceptors
```javascript
// src/lib/api.js
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 2. React Query Error Handling
```javascript
const { data, error, isError } = useQuery({
  queryKey: ['bookings'],
  queryFn: () => bookingsAPI.getAll(),
  onError: (error) => {
    toast.error('Failed to load bookings: ' + error.message);
  }
});
```

#### 3. Global Error Boundary
```javascript
// src/App.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Backend Error Handling

#### 1. Global Error Middleware
```javascript
// backend/server.js
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});
```

#### 2. Route-Level Error Handling
```javascript
// backend/routes/bookings.js
router.get('/', (req, res) => {
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
    res.json({ success: true, data: rows });
  });
});
```

## Performance Optimization Flow

### Database Query Optimization

#### 1. Query Execution Plan
```
Frontend Request → Backend Route → SQLite Query → Response Processing
```

**Optimized Query Example**:
```sql
-- Single JOIN query instead of multiple queries
SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.category as room_category
FROM bookings b
JOIN rooms r ON b.room_id = r.id
WHERE b.start_time >= ? AND b.end_time <= ?
ORDER BY b.start_time;
```

#### 2. Connection Pooling (Future PostgreSQL)
```javascript
// backend/database/connection.js
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Frontend Performance

#### 1. Component Memoization
```javascript
// Memoized booking component
const MemoizedBooking = React.memo(({ booking, onDoubleClick }) => {
  return (
    <div className="booking-item" onDoubleClick={() => onDoubleClick(booking)}>
      {booking.customer_name}
    </div>
  );
});
```

#### 2. Lazy Loading
```javascript
// Lazy load modal components
const BookingModal = lazy(() => import('./BookingModal'));
const SettingsModal = lazy(() => import('./SettingsModal'));
```

#### 3. Bundle Optimization
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@dnd-kit/core', '@dnd-kit/sortable'],
          utils: ['axios', 'moment', 'moment-timezone']
        }
      }
    }
  }
});
```

## Security Flow

### Authentication Security

#### 1. JWT Token Lifecycle
```
Login → Token Generation → Storage → Request Injection → Validation → Expiration
```

#### 2. Password Security
```javascript
// Password hashing with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);

// Password verification
const isValidPassword = await bcrypt.compare(password, user.password);
```

#### 3. Input Validation
```javascript
// Express-validator middleware
router.post('/bookings', [
  body('customer_name').isLength({ min: 1 }).trim(),
  body('customer_email').isEmail().normalizeEmail(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request...
});
```

### Data Security

#### 1. SQL Injection Prevention
```javascript
// Parameterized queries
db.run(
  'INSERT INTO bookings (room_id, customer_name) VALUES (?, ?)',
  [room_id, customer_name],
  function(err) {
    // Handle result...
  }
);
```

#### 2. CORS Configuration
```javascript
// backend/server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
```

#### 3. Security Headers
```javascript
// Helmet middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## Monitoring and Logging Flow

### Request Logging
```javascript
// Morgan logging middleware
app.use(morgan('combined'));
```

### Error Logging
```javascript
// Structured error logging
const logError = (error, context) => {
  console.error({
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context: context
  });
};
```

### Performance Monitoring
```javascript
// Request timing
const startTime = Date.now();
// ... process request
const duration = Date.now() - startTime;
console.log(`Request processed in ${duration}ms`);
```

---

*This document provides comprehensive mapping of data flow patterns throughout the application. Use this as a reference for understanding system behavior, debugging issues, and optimizing performance.*

