# Function Network: Complete Function Inventory & Dependencies

## Overview

This document provides a comprehensive inventory of all functions, components, and their dependencies across the Boom Karaoke Booking System. It serves as a reference for understanding code structure, data flow, and system interactions.

## Frontend Function Inventory

### Core Application Structure

#### `App.jsx` - Main Application Component
**File**: `src/App.jsx`
**Dependencies**: 
- React Query (`@tanstack/react-query`)
- React Hot Toast (`react-hot-toast`)
- Multiple Context Providers
- Error Boundary Component

**Key Functions**:
- `AppContent()` - Main application content wrapper
- `ErrorBoundary` - Global error handling component
- `queryClient` - React Query client configuration

**State Management**:
- Query client with 5-minute stale time
- Retry logic for failed requests
- Global error boundary for unhandled errors

#### Context Providers

##### `AuthContext.jsx` - Authentication Management
**File**: `src/contexts/AuthContext.jsx`
**Dependencies**: `authAPI` from `../lib/api`

**Key Functions**:
- `useAuth()` - Hook for accessing auth context
- `AuthProvider` - Context provider component
- `initAuth()` - Initialize authentication on app load
- `login(credentials)` - User login function
- `logout()` - User logout function

**State Variables**:
- `user` - Current user object
- `loading` - Authentication loading state
- `token` - JWT token from localStorage
- `isAuthenticated` - Boolean authentication status

**Database Interactions**:
- `authAPI.getSession()` - Verify token validity
- `authAPI.login()` - Authenticate user credentials
- `authAPI.logout()` - Server-side logout (client-side token removal)

##### `SettingsContext.jsx` - Application Settings
**File**: `src/contexts/SettingsContext.jsx`
**Dependencies**: localStorage for persistence

**Key Functions**:
- `useSettings()` - Hook for accessing settings
- `updateSetting(key, value)` - Update individual setting
- `toggleLayoutOrientation()` - Switch between layout orientations
- `updateBookingFormField(field, updates)` - Modify booking form fields
- `addCustomBookingField(field)` - Add custom booking field
- `removeCustomBookingField(fieldId)` - Remove custom booking field
- `updateRoomFormField(field, updates)` - Modify room form fields
- `addCustomRoomField(field)` - Add custom room field
- `removeCustomRoomField(fieldId)` - Remove custom room field
- `resetSettings()` - Reset to default settings
- `saveAsDefaultFormFields()` - Save current form fields as defaults
- `resetToDefaultFormFields()` - Reset form fields to saved defaults

**State Variables** (580+ lines of complex state management):
- Layout orientation settings
- Booking form field configurations
- Room form field configurations
- Custom field definitions
- Color schemes and themes
- Confirmation templates
- Business information settings

**localStorage Keys**:
- `karaoke-settings` - Main settings object
- Settings automatically sync on changes

##### `BusinessHoursContext.jsx` - Business Hours Management
**File**: `src/contexts/BusinessHoursContext.jsx`
**Dependencies**: `businessHoursAPI` from `../lib/api`

**Key Functions**:
- `useBusinessHours()` - Hook for accessing business hours
- `getBusinessHoursForDay(dayOfWeek)` - Get hours for specific day
- `getTimeSlotsForDay(dayOfWeek)` - Generate time slots for day
- `isWithinBusinessHours(dateTime)` - Check if time is within business hours
- `loadBusinessHours()` - Load hours from API
- `updateBusinessHours(hours)` - Update business hours

**State Variables**:
- `businessHours` - Array of business hours objects
- `loading` - Loading state for API calls
- `error` - Error state for failed operations

**Database Interactions**:
- `businessHoursAPI.get()` - Fetch current business hours
- `businessHoursAPI.update(data)` - Update business hours

##### `BusinessInfoContext.jsx` - Business Information
**File**: `src/contexts/BusinessInfoContext.jsx`
**Dependencies**: localStorage for persistence

**Key Functions**:
- `useBusinessInfo()` - Hook for accessing business info
- `updateBusinessInfo(updates)` - Update business information
- `resetBusinessInfo()` - Reset to default business info

**State Variables**:
- `businessInfo` - Business information object including:
  - name, phone, email, address, website
  - hours, confirmationMessage

**localStorage Keys**:
- `businessInfo` - Business information object

##### `TutorialContext.jsx` - Interactive Tutorial System
**File**: `src/contexts/TutorialContext.jsx`
**Dependencies**: localStorage for persistence

**Key Functions**:
- `useTutorial()` - Hook for accessing tutorial state
- `startTutorial()` - Begin tutorial sequence
- `restartTutorial()` - Restart tutorial from beginning
- `completeTutorial()` - Mark tutorial as completed
- `skipTutorial()` - Skip tutorial and hide button

**State Variables**:
- `isTutorialActive` - Tutorial currently running
- `currentStep` - Current tutorial step
- `tutorialCompleted` - Tutorial completion status
- `tutorialSkipped` - Tutorial skip status
- `showTutorialButton` - Show/hide tutorial button
- `isInitialized` - Tutorial system initialization status

**localStorage Keys**:
- `karaoke-tutorial-state` - Tutorial state object

##### `WebSocketContext.jsx` - Real-time Communication
**File**: `src/contexts/WebSocketContext.jsx`
**Dependencies**: `socket.io-client`

**Key Functions**:
- `useWebSocket()` - Hook for WebSocket connection
- `connect()` - Establish WebSocket connection
- `disconnect()` - Close WebSocket connection
- `joinRoom(roomId)` - Join room-specific updates
- `leaveRoom(roomId)` - Leave room-specific updates
- `subscribeToBookingChanges(callback)` - Subscribe to booking updates

**State Variables**:
- `socket` - Socket.IO client instance
- `connected` - Connection status
- `error` - Connection error state

### UI Components

#### `AppleCalendarDashboard.jsx` - Main Calendar Interface
**File**: `src/components/AppleCalendarDashboard.jsx`
**Dependencies**: 
- `@dnd-kit/core` for drag-and-drop
- `moment-timezone` for date handling
- `@tanstack/react-query` for data fetching
- Multiple context providers

**Key Functions**:
- `DraggableBooking` - Drag-and-drop booking component
- `DroppableTimeSlot` - Drop target for bookings
- `AppleCalendarDashboard` - Main dashboard component
- `handleDragStart(event)` - Handle drag start
- `handleDragOver(event)` - Handle drag over
- `handleDragEnd(event)` - Handle drag end
- `handleBookingMove(data)` - Process booking moves
- `handleBookingResize(data)` - Process booking resizing
- `handleTimeSlotClick(slot)` - Handle time slot clicks
- `handleBookingDoubleClick(booking)` - Handle booking double-click

**State Variables**:
- `selectedDate` - Currently selected date
- `calendarBaseDate` - Mini calendar base date
- `selectedBooking` - Currently selected booking
- `isModalOpen` - Booking modal state
- `isViewModalOpen` - View modal state
- `showSettings` - Settings modal state
- `showInstructions` - Instructions modal state
- `showAnalytics` - Analytics modal state
- `showCustomerBase` - Customer base modal state
- `sidebarOpen` - Sidebar visibility state
- `activeId` - Active drag item ID
- `draggedBooking` - Currently dragged booking

**Database Interactions**:
- `roomsAPI.getAll()` - Fetch all rooms
- `bookingsAPI.getAll(params)` - Fetch bookings for date
- `bookingsAPI.move(data)` - Move booking to new slot
- `bookingsAPI.resize(data)` - Resize booking duration
- `bookingsAPI.create(data)` - Create new booking
- `bookingsAPI.update(id, data)` - Update booking
- `bookingsAPI.delete(id)` - Delete booking

#### `BookingModal.jsx` - Booking Creation/Edit Modal
**File**: `src/components/BookingModal.jsx`
**Dependencies**: React Hook Form, moment, React Query

**Key Functions**:
- `BookingModal` - Main modal component
- `handleSubmit(data)` - Handle form submission
- `validateForm(data)` - Validate form data
- `calculatePrice(data)` - Calculate booking price

**State Variables**:
- `isOpen` - Modal visibility state
- `booking` - Booking data object
- `isEditing` - Edit mode flag
- `loading` - Submission loading state

**Database Interactions**:
- `bookingsAPI.create(data)` - Create new booking
- `bookingsAPI.update(id, data)` - Update existing booking

#### `RoomManagement.jsx` - Room Administration
**File**: `src/components/RoomManagement.jsx`
**Dependencies**: React Query, React Hook Form, Lucide React icons

**Key Functions**:
- `RoomManagement` - Main room management component
- `handleCreateRoom(data)` - Create new room
- `handleUpdateRoom(id, data)` - Update existing room
- `handleDeleteRoom(id)` - Delete room
- `handleToggleRoomStatus(id)` - Toggle room active status
- `filterRooms()` - Filter rooms by status/category

**State Variables**:
- `selectedRoom` - Currently selected room
- `isEditing` - Edit mode flag
- `showForm` - Form visibility state
- `filterStatus` - Status filter
- `filterCategory` - Category filter

**Database Interactions**:
- `roomsAPI.getAll()` - Fetch all rooms
- `roomsAPI.getCategories()` - Fetch room categories
- `roomsAPI.create(data)` - Create new room
- `roomsAPI.update(id, data)` - Update room
- `roomsAPI.delete(id)` - Delete room

#### `SettingsModal.jsx` - Application Settings
**File**: `src/components/SettingsModal.jsx`
**Dependencies**: Settings context, Business hours context

**Key Functions**:
- `SettingsModal` - Main settings modal
- `handleSaveSettings()` - Save settings changes
- `handleResetSettings()` - Reset to defaults
- `handleBusinessHoursUpdate()` - Update business hours

**State Variables**:
- `isOpen` - Modal visibility state
- `activeTab` - Currently active settings tab

#### `InteractiveTutorial.jsx` - Tutorial System
**File**: `src/components/InteractiveTutorial.jsx`
**Dependencies**: Tutorial context

**Key Functions**:
- `InteractiveTutorial` - Main tutorial component
- `handleNextStep()` - Move to next tutorial step
- `handlePreviousStep()` - Move to previous step
- `handleCompleteTutorial()` - Complete tutorial
- `handleSkipTutorial()` - Skip tutorial

**State Variables**:
- `currentStep` - Current tutorial step
- `isActive` - Tutorial active state

#### `TraditionalSchedule.jsx` - Traditional Schedule View
**File**: `src/components/TraditionalSchedule.jsx`
**Dependencies**: React Query, moment

**Key Functions**:
- `TraditionalSchedule` - Traditional schedule component
- `renderTimeSlots()` - Render time slot grid
- `renderBookings()` - Render booking blocks

#### `Scheduler.jsx` - Schedule Grid Component
**File**: `src/components/Scheduler.jsx`
**Dependencies**: React Query, moment

**Key Functions**:
- `Scheduler` - Schedule grid component
- `generateTimeSlots()` - Generate time slots
- `renderBookingBlock()` - Render individual booking

#### Additional UI Components
- `Header.jsx` - Application header
- `DatePicker.jsx` - Date selection component
- `DigitalClock.jsx` - Real-time clock display
- `LoadingSkeleton.jsx` - Loading state component
- `LoadingSpinner.jsx` - Loading spinner
- `LoginForm.jsx` - Authentication form
- `BookingConfirmation.jsx` - Booking confirmation component
- `ReservationViewModal.jsx` - Reservation viewing modal
- `InstructionsModal.jsx` - Instructions modal
- `TutorialButton.jsx` - Tutorial trigger button
- `BusinessHoursSettings.jsx` - Business hours configuration

### UI Library Components (`src/components/ui/`)
- `Button.jsx` - Reusable button component
- `Card.jsx` - Card container component
- `Input.jsx` - Form input component
- `Badge.jsx` - Status badge component
- `CustomSelect.jsx` - Custom select dropdown

## Backend Function Inventory

### Core Server (`server.js`)
**File**: `backend/server.js`
**Dependencies**: Express, Socket.IO, CORS, Helmet, Morgan

**Key Functions**:
- `startServer()` - Initialize and start server
- `initDatabase()` - Initialize database schema
- Express middleware setup
- Socket.IO connection handling
- Static file serving
- Error handling middleware

**Configuration**:
- Port: 5000 (configurable via env)
- CORS origin: localhost:3000
- JWT secret: Environment variable
- Database path: ./data/database.sqlite

### Database Layer (`database/init.js`)
**File**: `backend/database/init.js`
**Dependencies**: sqlite3, bcrypt, fs, path

**Key Functions**:
- `initDatabase()` - Create database tables
- `insertDefaultData()` - Insert seed data
- `db` - SQLite database instance

**Database Schema Creation**:
- `users` table - User accounts and authentication
- `rooms` table - Room definitions and pricing
- `bookings` table - Booking records and customer data
- `business_hours` table - Operating hours configuration
- `settings` table - Application settings key-value pairs

**Default Data Insertion**:
- Default admin user (demo@example.com / demo123)
- Sample rooms (Room A, B, C with different categories)
- Default business hours (10:00-22:00, 7 days)
- Application settings (app name, timezone, currency, etc.)
- Sample bookings for demonstration

### API Routes

#### Authentication Routes (`routes/auth.js`)
**File**: `backend/routes/auth.js`
**Dependencies**: bcrypt, jsonwebtoken, express-validator

**Key Functions**:
- `POST /login` - User authentication
- `POST /register` - User registration
- `GET /me` - Get current user session
- `POST /logout` - User logout
- `authenticateToken()` - JWT verification middleware

**Database Operations**:
- `db.get('SELECT * FROM users WHERE email = ?')` - Find user by email
- `bcrypt.compare()` - Verify password hash
- `jwt.sign()` - Generate JWT token
- `db.get('SELECT id FROM users WHERE email = ?')` - Check existing user
- `bcrypt.hash()` - Hash new password
- `db.run('INSERT INTO users')` - Create new user

#### Booking Routes (`routes/bookings.js`)
**File**: `backend/routes/bookings.js`
**Dependencies**: express-validator, sqlite3

**Key Functions**:
- `GET /` - Get all bookings with filters
- `GET /:id` - Get specific booking
- `POST /` - Create new booking
- `PUT /:id` - Update booking
- `PUT /:id/cancel` - Cancel booking
- `DELETE /:id` - Delete booking
- `PUT /:id/move` - Move booking to new slot

**Database Operations**:
- Complex JOIN queries for booking data with room details
- Conflict detection queries for time slot validation
- Price calculation based on room rates and duration
- Dynamic UPDATE queries for partial booking updates
- Transaction-like operations for booking moves

**Business Logic**:
- Time conflict detection algorithm
- Price calculation (duration × hourly rate)
- Status management (confirmed, cancelled, completed)
- Room availability validation

#### Room Routes (`routes/rooms.js`)
**File**: `backend/routes/rooms.js`
**Dependencies**: express-validator, sqlite3

**Key Functions**:
- `GET /` - Get all rooms with filters
- `GET /:id` - Get specific room
- `POST /` - Create new room
- `PUT /:id` - Update room
- `DELETE /:id` - Deactivate room

**Database Operations**:
- `db.all('SELECT * FROM rooms')` - Fetch all rooms
- `db.get('SELECT * FROM rooms WHERE id = ?')` - Fetch specific room
- `db.run('INSERT INTO rooms')` - Create new room
- `db.run('UPDATE rooms SET')` - Update room details
- Soft delete via `is_active` flag

#### Business Hours Routes (`routes/businessHours.js`)
**File**: `backend/routes/businessHours.js`
**Dependencies**: express-validator, sqlite3

**Key Functions**:
- `GET /` - Get business hours
- `PUT /` - Update business hours

**Database Operations**:
- `db.all('SELECT * FROM business_hours')` - Fetch all hours
- Bulk operations for updating all days
- `db.run('DELETE FROM business_hours')` - Clear existing hours
- `db.run('INSERT INTO business_hours')` - Insert new hours

#### Settings Routes (`routes/settings.js`)
**File**: `backend/routes/settings.js`
**Dependencies**: express-validator, sqlite3

**Key Functions**:
- `GET /` - Get application settings
- `PUT /` - Update settings

**Database Operations**:
- `db.all('SELECT * FROM settings')` - Fetch all settings
- Upsert operations for key-value pairs
- Dynamic INSERT/UPDATE based on existing keys

#### Health Routes (`routes/health.js`)
**File**: `backend/routes/health.js`
**Dependencies**: sqlite3

**Key Functions**:
- `GET /` - Health check endpoint

**Database Operations**:
- `db.get('SELECT 1')` - Database connectivity test

## API Client Layer (`lib/api.js`)

### API Configuration
**File**: `src/lib/api.js`
**Dependencies**: axios, mockData

**Key Functions**:
- `apiClient` - Axios instance with interceptors
- `convertToBackendFormat()` - Convert frontend to backend format
- `convertToFrontendFormat()` - Convert backend to frontend format

### API Modules

#### `authAPI`
- `login(credentials)` - User authentication
- `logout()` - User logout
- `getSession()` - Get current session

#### `bookingsAPI`
- `getAll(params)` - Fetch bookings with filters
- `getById(id)` - Fetch specific booking
- `create(data)` - Create new booking
- `update(id, data)` - Update booking
- `delete(id)` - Delete booking
- `cancel(id)` - Cancel booking
- `move(data)` - Move booking with conflict resolution
- `resize(data)` - Resize booking duration

#### `roomsAPI`
- `getAll(params)` - Fetch all rooms
- `getById(id)` - Fetch specific room
- `create(data)` - Create new room
- `update(id, data)` - Update room
- `delete(id)` - Delete room
- `getCategories()` - Fetch room categories

#### `businessHoursAPI`
- `get()` - Fetch business hours
- `update(data)` - Update business hours
- `getExceptions()` - Fetch business hour exceptions
- `createException(data)` - Create exception
- `deleteException(id)` - Delete exception

#### `settingsAPI`
- `get()` - Fetch application settings
- `update(data)` - Update settings

#### `healthAPI`
- `check()` - Health check endpoint

## Data Flow Dependencies

### Frontend to Backend Communication
1. **Authentication Flow**:
   - `AuthContext.login()` → `authAPI.login()` → `POST /api/auth/login`
   - JWT token storage in localStorage
   - Automatic token injection via axios interceptors

2. **Booking Operations**:
   - `AppleCalendarDashboard` → `bookingsAPI` → Backend routes
   - Real-time updates via WebSocket connections
   - Optimistic updates with React Query

3. **Settings Management**:
   - `SettingsContext` → `settingsAPI` → `PUT /api/settings`
   - Local storage persistence for offline capability

### Database Dependencies
1. **User Authentication**:
   - `users` table → bcrypt password hashing → JWT token generation

2. **Booking Management**:
   - `bookings` table ← `rooms` table (foreign key relationship)
   - Complex JOIN queries for data aggregation
   - Conflict detection via overlapping time queries

3. **Business Logic**:
   - Price calculation: `(end_time - start_time) × price_per_hour`
   - Availability checking: Time slot conflict detection
   - Business hours validation: Operating hours enforcement

### Real-time Communication
1. **WebSocket Events**:
   - `join-room` → Room-specific updates
   - `leave-room` → Unsubscribe from updates
   - Booking changes → Broadcast to room subscribers

2. **State Synchronization**:
   - React Query invalidation on WebSocket events
   - Optimistic updates with rollback on failure
   - Cache management for real-time consistency

## Performance Considerations

### Database Query Optimization
- **Indexing**: Primary keys and foreign keys automatically indexed
- **JOIN Operations**: Single query for booking + room data
- **Parameterized Queries**: SQL injection prevention
- **Connection Management**: Single SQLite connection per request

### Frontend Performance
- **React Query Caching**: 5-minute stale time, background refetching
- **Component Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for modal components
- **Bundle Splitting**: Manual chunk configuration in Vite

### Real-time Performance
- **WebSocket Connection Pooling**: Single connection per client
- **Room-based Broadcasting**: Targeted updates to relevant clients
- **Debounced Updates**: Prevent excessive re-renders

## Error Handling

### Frontend Error Handling
- **Global Error Boundary**: Catches unhandled React errors
- **API Error Interceptors**: Centralized error handling
- **React Query Error States**: Automatic retry and error display
- **Toast Notifications**: User-friendly error messages

### Backend Error Handling
- **Express Error Middleware**: Global error handler
- **Database Error Handling**: SQLite error propagation
- **Validation Errors**: express-validator integration
- **HTTP Status Codes**: Proper status code mapping

## Security Considerations

### Authentication Security
- **JWT Token Management**: 24-hour expiration, secure storage
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: express-validator on all endpoints
- **CORS Configuration**: Restricted origin access

### Data Security
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Helmet middleware
- **Input Sanitization**: express-validator normalization
- **Secure Headers**: Security headers via Helmet

---

*This document provides comprehensive mapping of all functions and their dependencies. Use this as a reference for code navigation, debugging, and system understanding.*

