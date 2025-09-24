# Communication Network: API Routes & Integrations

## Overview

This document maps all communication channels, API endpoints, internal function calls, and external integrations within the Boom Karaoke Booking System. It serves as a comprehensive reference for understanding data flow and system interactions.

## API Route Structure

### Base Configuration
- **Base URL**: `http://localhost:5000/api` (Development)
- **Production URL**: `https://api.boomkaraoke.com/api` (Future)
- **API Version**: v1 (Current), v2 (Planned)
- **Authentication**: Bearer JWT tokens
- **Content-Type**: `application/json`
- **Timeout**: 10 seconds

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
**Purpose**: User authentication and token generation
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
**Response**:
```json
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
**Internal Calls**:
- `db.get()` - Query user by email
- `bcrypt.compare()` - Verify password
- `jwt.sign()` - Generate access token
- `express-validator` - Input validation

#### POST `/api/auth/register`
**Purpose**: New user registration
**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "newpassword",
  "name": "Jane Smith"
}
```
**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "user"
  }
}
```
**Internal Calls**:
- `db.get()` - Check existing user
- `bcrypt.hash()` - Hash password
- `db.run()` - Insert new user
- `jwt.sign()` - Generate access token

#### GET `/api/auth/me`
**Purpose**: Get current user session
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```
**Internal Calls**:
- `authenticateToken()` - JWT verification middleware
- Direct user data from token payload

#### POST `/api/auth/logout`
**Purpose**: Client-side logout (token removal)
**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
**Internal Calls**: None (client-side token removal)

### Booking Routes (`/api/bookings`)

#### GET `/api/bookings`
**Purpose**: Retrieve all bookings with optional filters
**Query Parameters**:
- `room_id`: Filter by specific room
- `status`: Filter by booking status
- `start_date`: Filter bookings after date
- `end_date`: Filter bookings before date

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
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
      "room_category": "Standard"
    }
  ]
}
```
**Internal Calls**:
- `db.all()` - Execute complex JOIN query
- Dynamic WHERE clause construction
- Parameterized query execution

#### GET `/api/bookings/:id`
**Purpose**: Get specific booking details
**Response**: Single booking object with room details
**Internal Calls**:
- `db.get()` - Single record retrieval with JOIN

#### POST `/api/bookings`
**Purpose**: Create new booking
**Request Body**:
```json
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
**Response**: Created booking with calculated total price
**Internal Calls**:
- `express-validator` - Input validation
- `db.get()` - Conflict detection query
- `db.get()` - Room price retrieval
- Price calculation logic
- `db.run()` - Insert booking
- `db.get()` - Fetch created booking with JOIN

#### PUT `/api/bookings/:id`
**Purpose**: Update existing booking
**Request Body**: Partial booking data
**Response**: Updated booking object
**Internal Calls**:
- `express-validator` - Input validation
- Dynamic UPDATE query construction
- `db.run()` - Update operation
- `db.get()` - Fetch updated booking

#### PUT `/api/bookings/:id/cancel`
**Purpose**: Cancel specific booking
**Response**: Success confirmation
**Internal Calls**:
- `db.run()` - Status update to 'cancelled'

#### DELETE `/api/bookings/:id`
**Purpose**: Permanently delete booking
**Response**: Success confirmation
**Internal Calls**:
- `db.run()` - DELETE operation

#### PUT `/api/bookings/:id/move`
**Purpose**: Move booking to different room/time
**Request Body**:
```json
{
  "new_room_id": 2,
  "new_start_time": "2024-01-15T14:00:00Z",
  "new_end_time": "2024-01-15T16:00:00Z"
}
```
**Response**: Updated booking with new details
**Internal Calls**:
- `express-validator` - Input validation
- `db.get()` - Conflict detection in new slot
- `db.run()` - Update booking details
- `db.get()` - Fetch updated booking

### Room Routes (`/api/rooms`)

#### GET `/api/rooms`
**Purpose**: Get all available rooms
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Room A",
      "capacity": 4,
      "category": "Standard",
      "description": "Standard karaoke room for small groups",
      "price_per_hour": 25.00,
      "is_active": true
    }
  ]
}
```
**Internal Calls**:
- `db.all()` - Retrieve all active rooms

#### GET `/api/rooms/:id`
**Purpose**: Get specific room details
**Response**: Single room object
**Internal Calls**:
- `db.get()` - Single room retrieval

#### POST `/api/rooms`
**Purpose**: Create new room
**Request Body**:
```json
{
  "name": "Room D",
  "capacity": 10,
  "category": "Premium",
  "description": "Large premium room",
  "price_per_hour": 45.00
}
```
**Response**: Created room object
**Internal Calls**:
- `express-validator` - Input validation
- `db.run()` - Insert new room
- `db.get()` - Fetch created room

#### PUT `/api/rooms/:id`
**Purpose**: Update room details
**Response**: Updated room object
**Internal Calls**:
- `express-validator` - Input validation
- Dynamic UPDATE query
- `db.run()` - Update operation
- `db.get()` - Fetch updated room

#### DELETE `/api/rooms/:id`
**Purpose**: Deactivate room
**Response**: Success confirmation
**Internal Calls**:
- `db.run()` - Set is_active to false

### Business Hours Routes (`/api/business-hours`)

#### GET `/api/business-hours`
**Purpose**: Get business operating hours
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "day_of_week": 0,
      "open_time": "10:00",
      "close_time": "22:00",
      "is_closed": false
    }
  ]
}
```
**Internal Calls**:
- `db.all()` - Retrieve all business hours

#### PUT `/api/business-hours`
**Purpose**: Update business hours
**Request Body**:
```json
{
  "hours": [
    {
      "day_of_week": 0,
      "open_time": "09:00",
      "close_time": "23:00",
      "is_closed": false
    }
  ]
}
```
**Response**: Updated business hours
**Internal Calls**:
- `express-validator` - Input validation
- `db.run()` - Clear existing hours
- `db.run()` - Insert new hours (bulk operation)

### Settings Routes (`/api/settings`)

#### GET `/api/settings`
**Purpose**: Get application settings
**Response**:
```json
{
  "success": true,
  "data": {
    "app_name": "Boom Karaoke",
    "timezone": "America/New_York",
    "currency": "USD",
    "booking_advance_days": "30",
    "booking_min_duration": "60",
    "booking_max_duration": "480"
  }
}
```
**Internal Calls**:
- `db.all()` - Retrieve all settings
- Object transformation (key-value pairs)

#### PUT `/api/settings`
**Purpose**: Update application settings
**Request Body**: Key-value pairs of settings
**Response**: Updated settings
**Internal Calls**:
- `express-validator` - Input validation
- Dynamic UPDATE/INSERT operations
- `db.run()` - Upsert settings

### Health Routes (`/api/health`)

#### GET `/api/health`
**Purpose**: Health check endpoint
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```
**Internal Calls**:
- `db.get()` - Database connectivity test

## WebSocket Communication

### Connection Management
**Endpoint**: `ws://localhost:5000`
**Authentication**: JWT token in connection headers

#### Events

##### `connection`
**Purpose**: Client connection establishment
**Server Response**: Connection acknowledgment
**Internal Processing**:
- Socket.IO connection handling
- Client ID assignment
- Connection logging

##### `join-room`
**Purpose**: Subscribe to room-specific updates
**Payload**:
```json
{
  "roomId": 1
}
```
**Server Response**: Join confirmation
**Internal Processing**:
- `socket.join('room-1')` - Add to room channel
- Broadcast to room members

##### `leave-room`
**Purpose**: Unsubscribe from room updates
**Payload**:
```json
{
  "roomId": 1
}
```
**Server Response**: Leave confirmation
**Internal Processing**:
- `socket.leave('room-1')` - Remove from room channel

##### `disconnect`
**Purpose**: Client disconnection cleanup
**Internal Processing**:
- Socket cleanup
- Resource deallocation

### Real-time Updates
**Broadcast Triggers**:
- New booking creation
- Booking updates/cancellations
- Room availability changes
- System notifications

**Broadcast Channels**:
- `room-{roomId}` - Room-specific updates
- `global` - System-wide notifications

## Frontend API Integration

### API Client Configuration
**File**: `src/lib/api.js`
**Base Configuration**:
```javascript
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Request Interceptors
**Authentication**: Automatic Bearer token injection
```javascript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### API Modules

#### Auth API (`authAPI`)
- `login(credentials)` → POST `/api/auth/login`
- `logout()` → POST `/api/auth/logout`
- `getSession()` → GET `/api/auth/me`

#### Bookings API (`bookingsAPI`)
- `getAll(params)` → GET `/api/bookings`
- `getById(id)` → GET `/api/bookings/:id`
- `create(data)` → POST `/api/bookings`
- `update(id, data)` → PUT `/api/bookings/:id`
- `delete(id)` → DELETE `/api/bookings/:id`
- `cancel(id)` → PUT `/api/bookings/:id/cancel`
- `move(data)` → PUT `/api/bookings/:id/move`

#### Rooms API (`roomsAPI`)
- `getAll(params)` → GET `/api/rooms`
- `getById(id)` → GET `/api/rooms/:id`
- `create(data)` → POST `/api/rooms`
- `update(id, data)` → PUT `/api/rooms/:id`
- `delete(id)` → DELETE `/api/rooms/:id`

#### Business Hours API (`businessHoursAPI`)
- `get()` → GET `/api/business-hours`
- `update(data)` → PUT `/api/business-hours`

#### Settings API (`settingsAPI`)
- `get()` → GET `/api/settings`
- `update(data)` → PUT `/api/settings`

## External Integrations

### Current Integrations
**None** - Application is fully self-contained

### Planned Integrations

#### Payment Processing
**Provider**: Stripe
**Endpoints**:
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/refund` - Process refund

#### Email Notifications
**Provider**: SendGrid/AWS SES
**Endpoints**:
- `POST /api/notifications/email` - Send email
- `POST /api/notifications/booking-confirmation` - Booking confirmation
- `POST /api/notifications/booking-reminder` - Booking reminder

#### SMS Notifications
**Provider**: Twilio
**Endpoints**:
- `POST /api/notifications/sms` - Send SMS
- `POST /api/notifications/booking-sms` - Booking SMS

#### Calendar Integration
**Provider**: Google Calendar API
**Endpoints**:
- `POST /api/calendar/sync` - Sync bookings to calendar
- `GET /api/calendar/events` - Retrieve calendar events

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (booking conflicts)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Global Error Middleware
**File**: `backend/server.js`
**Function**: Global error handler
**Processing**:
- Error logging (development mode)
- Generic error responses (production mode)
- Status code mapping

## Security Considerations

### Authentication Flow
1. **Login Request** → Email/password validation
2. **Password Verification** → bcrypt comparison
3. **Token Generation** → JWT with 24h expiration
4. **Token Storage** → localStorage (frontend)
5. **Request Authentication** → Bearer token in headers

### Authorization Levels
- **Public**: Health check, login, register
- **Authenticated**: All booking operations
- **Admin**: Room management, settings, user management

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
```

### Security Headers
**Helmet Configuration**:
- XSS protection
- Content Security Policy
- HSTS headers
- Frame options

## Performance Optimizations

### Database Queries
- **Parameterized Queries**: Prevent SQL injection
- **JOIN Operations**: Reduce multiple queries
- **Index Optimization**: Primary keys and foreign keys
- **Connection Pooling**: Future PostgreSQL implementation

### Caching Strategy
**Current**: No caching
**Planned**:
- **Redis**: Session storage and API response caching
- **Browser Caching**: Static asset caching
- **CDN**: Global content delivery

### Rate Limiting
**Current**: None
**Planned**:
- **API Rate Limiting**: 100 requests/minute per user
- **Login Rate Limiting**: 5 attempts per minute
- **Global Rate Limiting**: 1000 requests/minute per IP

## Monitoring & Logging

### Request Logging
**Morgan Configuration**:
```javascript
app.use(morgan('combined'));
```
**Log Format**: Combined Apache log format

### Error Logging
**Current**: Console logging (development)
**Planned**:
- **Structured Logging**: JSON format
- **Log Aggregation**: ELK Stack or similar
- **Error Tracking**: Sentry integration

### Metrics Collection
**Current**: None
**Planned**:
- **Response Time**: Average, 95th percentile
- **Error Rate**: 4xx/5xx percentage
- **Throughput**: Requests per minute
- **Database Performance**: Query execution time

## API Versioning Strategy

### Current Version (v1)
- **Base Path**: `/api/`
- **Backward Compatibility**: Maintained until v2
- **Deprecation Timeline**: 6 months after v2 release

### Future Version (v2)
- **Base Path**: `/api/v2/`
- **Breaking Changes**: Improved error handling, enhanced responses
- **New Features**: Bulk operations, advanced filtering
- **Migration Path**: Automated migration scripts

## Testing Strategy

### Unit Testing
**API Endpoints**: Jest + Supertest
**Database Operations**: SQLite in-memory testing
**Authentication**: Mock JWT tokens

### Integration Testing
**Full Stack**: Cypress E2E testing
**API Integration**: Postman/Newman collections
**WebSocket Testing**: Socket.IO client testing

### Load Testing
**Tools**: Artillery.io or k6
**Scenarios**: Concurrent booking creation, peak hour simulation
**Targets**: 1000 concurrent users, <200ms response time

---

*This document provides comprehensive mapping of all communication channels. Reference this during development, testing, and troubleshooting phases.*

