# 🔗 Boom Booking SaaS Function Mapping & API Documentation

## 📋 **Complete Function Network & Communication Map**

This document provides a comprehensive mapping of all functions, their related files, and the API communication network required for the subscription-based SaaS transformation.

---

## 🏗️ **Frontend Function Mapping**

### **Core Components & Their Functions**

#### **Authentication System**
| Function | File Location | API Endpoints | Dependencies |
|----------|---------------|---------------|--------------|
| `login()` | `src/contexts/AuthContext.jsx` | `POST /api/auth/login` | JWT, localStorage |
| `logout()` | `src/contexts/AuthContext.jsx` | `POST /api/auth/logout` | localStorage |
| `getSession()` | `src/contexts/AuthContext.jsx` | `GET /api/auth/me` | JWT validation |
| `register()` | `src/components/LoginForm.jsx` | `POST /api/auth/register` | Form validation |

#### **Booking Management**
| Function | File Location | API Endpoints | Dependencies |
|----------|---------------|---------------|--------------|
| `createBooking()` | `src/components/BookingModal.jsx` | `POST /api/bookings` | Room validation, time slots |
| `updateBooking()` | `src/components/BookingManagement.jsx` | `PUT /api/bookings/:id` | Conflict detection |
| `deleteBooking()` | `src/components/BookingManagement.jsx` | `DELETE /api/bookings/:id` | Soft delete logic |
| `getBookings()` | `src/lib/api.js` | `GET /api/bookings` | Date filtering, pagination |
| `resizeBooking()` | `src/components/Scheduler.jsx` | `PUT /api/bookings/:id/resize` | Duration validation |
| `moveBooking()` | `src/components/Scheduler.jsx` | `PUT /api/bookings/:id/move` | Room availability |

#### **Room Management**
| Function | File Location | API Endpoints | Dependencies |
|----------|---------------|---------------|--------------|
| `getRooms()` | `src/lib/api.js` | `GET /api/rooms` | Category filtering |
| `createRoom()` | `src/components/RoomManagement.jsx` | `POST /api/rooms` | Capacity validation |
| `updateRoom()` | `src/components/RoomManagement.jsx` | `PUT /api/rooms/:id` | Price validation |
| `deleteRoom()` | `src/components/RoomManagement.jsx` | `DELETE /api/rooms/:id` | Booking dependency check |
| `toggleRoomStatus()` | `src/components/RoomManagement.jsx` | `PUT /api/rooms/:id/status` | Active/inactive toggle |

#### **Calendar & Scheduling**
| Function | File Location | API Endpoints | Dependencies |
|----------|---------------|---------------|--------------|
| `getCalendarView()` | `src/components/AppleCalendarDashboard.jsx` | `GET /api/calendar/view` | Date range, room filtering |
| `switchLayout()` | `src/components/AppleCalendarDashboard.jsx` | Local state only | Layout context |
| `handleDateChange()` | `src/components/DatePicker.jsx` | `GET /api/bookings?date=` | Date validation |
| `getAvailability()` | `src/components/Scheduler.jsx` | `GET /api/availability` | Room, time filtering |

#### **Business Settings**
| Function | File Location | API Endpoints | Dependencies |
|----------|---------------|---------------|--------------|
| `getBusinessHours()` | `src/contexts/BusinessHoursContext.jsx` | `GET /api/business-hours` | Day-of-week mapping |
| `updateBusinessHours()` | `src/components/BusinessHoursSettings.jsx` | `PUT /api/business-hours` | Time validation |
| `getSettings()` | `src/contexts/SettingsContext.jsx` | `GET /api/settings` | Key-value pairs |
| `updateSettings()` | `src/components/SettingsModal.jsx` | `PUT /api/settings` | Setting validation |

#### **Real-time Communication**
| Function | File Location | WebSocket Events | Dependencies |
|----------|---------------|------------------|--------------|
| `connectWebSocket()` | `src/contexts/WebSocketContext.jsx` | Connection events | Socket.IO client |
| `subscribeToBookings()` | `src/contexts/WebSocketContext.jsx` | `booking-changed` | Room-specific |
| `subscribeToRooms()` | `src/contexts/WebSocketContext.jsx` | `room-updated` | Room management |
| `broadcastUpdate()` | `src/contexts/WebSocketContext.jsx` | `booking-updated` | Real-time sync |

---

## 🔧 **Backend Function Mapping**

### **API Routes & Functions**

#### **Authentication Routes** (`backend/routes/auth.js`)
| Function | HTTP Method | Endpoint | Purpose | Database Operations |
|----------|-------------|----------|---------|-------------------|
| `login()` | POST | `/api/auth/login` | User authentication | `SELECT` from users |
| `register()` | POST | `/api/auth/register` | User registration | `INSERT` into users |
| `refresh()` | POST | `/api/auth/refresh` | Token refresh | JWT validation |
| `logout()` | POST | `/api/auth/logout` | User logout | Token invalidation |

#### **Booking Routes** (`backend/routes/bookings.js`)
| Function | HTTP Method | Endpoint | Purpose | Database Operations |
|----------|-------------|----------|---------|-------------------|
| `getAllBookings()` | GET | `/api/bookings` | List bookings | `SELECT` with filters |
| `getBookingById()` | GET | `/api/bookings/:id` | Get single booking | `SELECT` by ID |
| `createBooking()` | POST | `/api/bookings` | Create booking | `INSERT` with validation |
| `updateBooking()` | PUT | `/api/bookings/:id` | Update booking | `UPDATE` with audit |
| `deleteBooking()` | DELETE | `/api/bookings/:id` | Delete booking | Soft delete |
| `resizeBooking()` | PUT | `/api/bookings/:id/resize` | Resize booking | Duration update |
| `moveBooking()` | PUT | `/api/bookings/:id/move` | Move booking | Room/time update |

#### **Room Routes** (`backend/routes/rooms.js`)
| Function | HTTP Method | Endpoint | Purpose | Database Operations |
|----------|-------------|----------|---------|-------------------|
| `getAllRooms()` | GET | `/api/rooms` | List rooms | `SELECT` with filters |
| `getRoomById()` | GET | `/api/rooms/:id` | Get single room | `SELECT` by ID |
| `createRoom()` | POST | `/api/rooms` | Create room | `INSERT` with validation |
| `updateRoom()` | PUT | `/api/rooms/:id` | Update room | `UPDATE` with validation |
| `deleteRoom()` | DELETE | `/api/rooms/:id` | Delete room | Dependency check |
| `toggleRoomStatus()` | PUT | `/api/rooms/:id/status` | Toggle active status | `UPDATE` status |

#### **Business Hours Routes** (`backend/routes/businessHours.js`)
| Function | HTTP Method | Endpoint | Purpose | Database Operations |
|----------|-------------|----------|---------|-------------------|
| `getBusinessHours()` | GET | `/api/business-hours` | Get business hours | `SELECT` all days |
| `updateBusinessHours()` | PUT | `/api/business-hours` | Update hours | `UPDATE` with validation |

#### **Settings Routes** (`backend/routes/settings.js`)
| Function | HTTP Method | Endpoint | Purpose | Database Operations |
|----------|-------------|----------|---------|-------------------|
| `getSettings()` | GET | `/api/settings` | Get all settings | `SELECT` key-value |
| `updateSettings()` | PUT | `/api/settings` | Update settings | `UPDATE` or `INSERT` |
| `getSetting()` | GET | `/api/settings/:key` | Get single setting | `SELECT` by key |

#### **Health Routes** (`backend/routes/health.js`)
| Function | HTTP Method | Endpoint | Purpose | Database Operations |
|----------|-------------|----------|---------|-------------------|
| `healthCheck()` | GET | `/api/health` | System health | `SELECT 1` test |
| `detailedHealth()` | GET | `/api/health/detailed` | Detailed health | Multiple checks |

---

## 🗄️ **Database Function Mapping**

### **Database Operations** (`backend/database/init.js`)

#### **Table Creation Functions**
| Function | Purpose | Tables Created | Dependencies |
|----------|---------|----------------|--------------|
| `initDatabase()` | Initialize database | All core tables | SQLite connection |
| `insertDefaultData()` | Insert sample data | Users, rooms, bookings | Data validation |
| `createTables()` | Create table structure | Schema definition | SQL DDL |

#### **Core Tables & Their Functions**
| Table | Primary Functions | Related API Endpoints | Indexes |
|-------|-------------------|----------------------|---------|
| `users` | Authentication, authorization | `/api/auth/*` | email (unique) |
| `rooms` | Room management | `/api/rooms/*` | name, category |
| `bookings` | Booking CRUD | `/api/bookings/*` | room_id, start_time |
| `business_hours` | Operating hours | `/api/business-hours/*` | day_of_week |
| `settings` | Configuration | `/api/settings/*` | key (unique) |

---

## 🔄 **Communication Network Flow**

### **Data Flow Architecture**

#### **1. User Authentication Flow**
```
Frontend (LoginForm) 
    ↓ (HTTP POST)
API Gateway 
    ↓ (Route)
Auth Service 
    ↓ (Database Query)
PostgreSQL (users table)
    ↓ (Response)
JWT Token + User Data
    ↓ (Store)
Frontend (localStorage + Context)
```

#### **2. Booking Creation Flow**
```
Frontend (BookingModal)
    ↓ (HTTP POST /api/bookings)
API Gateway
    ↓ (Validation)
Booking Service
    ↓ (Conflict Check)
Database Query (availability)
    ↓ (If Available)
INSERT booking
    ↓ (WebSocket Broadcast)
Real-time Update (all clients)
    ↓ (Audit Log)
Audit Trail (audit_logs table)
```

#### **3. Real-time Updates Flow**
```
Backend (Booking Change)
    ↓ (WebSocket Event)
Socket.IO Server
    ↓ (Broadcast)
Connected Clients
    ↓ (Event Handler)
Frontend (WebSocket Context)
    ↓ (State Update)
React Components (Re-render)
```

---

## 🚀 **SaaS Transformation Functions**

### **New Multi-Tenant Functions**

#### **Tenant Management**
| Function | File Location | Purpose | API Endpoint |
|----------|---------------|---------|--------------|
| `createTenant()` | `services/tenant-service/` | Create new tenant | `POST /api/tenants` |
| `getTenantInfo()` | `services/tenant-service/` | Get tenant details | `GET /api/tenants/current` |
| `updateTenantSettings()` | `services/tenant-service/` | Update tenant config | `PUT /api/tenants/settings` |
| `validateTenantAccess()` | `middleware/tenant-auth.js` | Access validation | Middleware |

#### **Subscription Management**
| Function | File Location | Purpose | API Endpoint |
|----------|---------------|---------|--------------|
| `createSubscription()` | `services/billing-service/` | Create subscription | `POST /api/subscriptions` |
| `updateSubscription()` | `services/billing-service/` | Update plan | `PUT /api/subscriptions/:id` |
| `cancelSubscription()` | `services/billing-service/` | Cancel subscription | `DELETE /api/subscriptions/:id` |
| `checkUsageLimits()` | `services/billing-service/` | Validate limits | Middleware |

#### **AI Integration Functions**
| Function | File Location | Purpose | API Endpoint |
|----------|---------------|---------|--------------|
| `getAISuggestions()` | `services/ai-service/` | Smart suggestions | `GET /api/ai/suggestions` |
| `predictDemand()` | `services/ai-service/` | Demand forecasting | `GET /api/ai/predictions` |
| `handleChatbotQuery()` | `services/ai-service/` | Customer support | `POST /api/ai/chat` |
| `analyzeBookingPatterns()` | `services/ai-service/` | Pattern analysis | `GET /api/ai/analysis` |

---

## 📊 **API Documentation Summary**

### **Complete API Endpoint List**

#### **Authentication APIs**
```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration  
POST   /api/auth/refresh        # Token refresh
POST   /api/auth/logout         # User logout
GET    /api/auth/me             # Get current user
```

#### **Booking APIs**
```
GET    /api/bookings            # List bookings
GET    /api/bookings/:id        # Get booking by ID
POST   /api/bookings            # Create booking
PUT    /api/bookings/:id        # Update booking
DELETE /api/bookings/:id        # Delete booking
PUT    /api/bookings/:id/resize # Resize booking
PUT    /api/bookings/:id/move   # Move booking
```

#### **Room APIs**
```
GET    /api/rooms               # List rooms
GET    /api/rooms/:id           # Get room by ID
POST   /api/rooms               # Create room
PUT    /api/rooms/:id           # Update room
DELETE /api/rooms/:id           # Delete room
PUT    /api/rooms/:id/status    # Toggle room status
```

#### **Settings APIs**
```
GET    /api/settings            # Get all settings
GET    /api/settings/:key       # Get setting by key
PUT    /api/settings            # Update settings
GET    /api/business-hours      # Get business hours
PUT    /api/business-hours      # Update business hours
```

#### **SaaS APIs (New)**
```
GET    /api/tenants/current     # Get current tenant
PUT    /api/tenants/settings    # Update tenant settings
GET    /api/subscriptions       # Get subscription info
POST   /api/subscriptions       # Create subscription
PUT    /api/subscriptions/:id   # Update subscription
GET    /api/usage               # Get usage metrics
GET    /api/analytics/dashboard # Get analytics data
POST   /api/ai/chat             # AI chatbot
GET    /api/ai/suggestions      # AI suggestions
```

---

## 🔍 **Error Handling & Validation**

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid booking time",
    "details": {
      "field": "start_time",
      "value": "invalid_date",
      "constraints": ["must_be_future", "within_business_hours"]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456"
  }
}
```

### **Validation Rules**
| Field | Validation Rules | Error Codes |
|-------|------------------|-------------|
| email | Valid email format, unique | `INVALID_EMAIL`, `EMAIL_EXISTS` |
| booking_time | Future date, business hours | `INVALID_TIME`, `OUTSIDE_HOURS` |
| room_capacity | Positive integer, max limit | `INVALID_CAPACITY`, `OVER_LIMIT` |
| subscription | Valid plan, active status | `INVALID_PLAN`, `INACTIVE_SUBSCRIPTION` |

---

## 🎯 **Performance Optimization Functions**

### **Caching Strategy**
| Function | Cache Type | TTL | Invalidation |
|----------|------------|-----|--------------|
| `getRooms()` | Redis | 1 hour | On room update |
| `getBusinessHours()` | Redis | 24 hours | On hours update |
| `getBookings()` | Redis | 5 minutes | On booking change |
| `getSettings()` | Redis | 1 hour | On settings update |

### **Database Optimization**
| Function | Optimization | Index | Query Pattern |
|----------|-------------|-------|---------------|
| `getBookings()` | Composite index | `(tenant_id, start_time)` | Range queries |
| `getRooms()` | Tenant isolation | `tenant_id` | Tenant filtering |
| `searchBookings()` | Full-text search | `(customer_name, notes)` | Text search |

This comprehensive function mapping provides the complete blueprint for transforming your Boom Karaoke booking system into a scalable SaaS platform with full traceability and AI integration capabilities.
