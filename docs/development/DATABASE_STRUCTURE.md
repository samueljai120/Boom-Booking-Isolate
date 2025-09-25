# Boom Booking Database Structure

## Overview
This document describes the complete database structure for the Boom Booking karaoke venue management system. The database is designed to handle user management, room bookings, business hours, and customer data.

## Database Technology
- **Database**: PostgreSQL (Neon)
- **Connection**: Serverless connection via `@neondatabase/serverless`
- **Environment**: Development and Production

## Tables

### 1. Users Table
**Purpose**: Store user accounts and authentication data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (login) |
| `password` | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `role` | VARCHAR(50) | DEFAULT 'user' | User role (user, admin) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_users_email` on `email` for fast login lookups

**Default Data**:
- Demo user: `demo@example.com` / `demo123` (admin role)

### 2. Rooms Table
**Purpose**: Store karaoke room information and pricing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing room ID |
| `name` | VARCHAR(255) | NOT NULL | Room name (e.g., "Room A") |
| `capacity` | INTEGER | NOT NULL | Maximum number of people |
| `category` | VARCHAR(255) | NOT NULL | Room type (Standard, Premium, VIP) |
| `description` | TEXT | | Room description |
| `price_per_hour` | DECIMAL(10,2) | DEFAULT 0 | Hourly rate in USD |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether room is available |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Room creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_rooms_active` on `is_active` for filtering active rooms

**Default Data**:
- Room A: Standard, 4 people, $25/hour
- Room B: Premium, 6 people, $35/hour  
- Room C: VIP, 8 people, $50/hour

### 3. Business Hours Table
**Purpose**: Store venue operating hours for each day of the week

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `day_of_week` | INTEGER | NOT NULL, UNIQUE | Day (0=Sunday, 1=Monday, etc.) |
| `open_time` | TIME | | Opening time (HH:MM:SS) |
| `close_time` | TIME | | Closing time (HH:MM:SS) |
| `is_closed` | BOOLEAN | DEFAULT FALSE | Whether venue is closed |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Constraints**:
- `day_of_week` must be between 0 and 6
- `day_of_week` is unique (one record per day)

**Default Data**:
- Monday-Thursday: 9:00 AM - 10:00 PM
- Friday: 9:00 AM - 11:00 PM
- Saturday: 10:00 AM - 11:00 PM
- Sunday: 10:00 AM - 9:00 PM

### 4. Bookings Table
**Purpose**: Store customer bookings and reservations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing booking ID |
| `room_id` | INTEGER | NOT NULL, FK | Reference to rooms table |
| `customer_name` | VARCHAR(255) | NOT NULL | Customer's name |
| `customer_email` | VARCHAR(255) | | Customer's email |
| `customer_phone` | VARCHAR(20) | | Customer's phone number |
| `start_time` | TIMESTAMP | NOT NULL | Booking start time |
| `end_time` | TIMESTAMP | NOT NULL | Booking end time |
| `status` | VARCHAR(20) | DEFAULT 'confirmed' | Booking status |
| `notes` | TEXT | | Additional notes |
| `total_price` | DECIMAL(10,2) | | Calculated total price |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Booking creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Foreign Keys**:
- `room_id` references `rooms(id)`

**Indexes**:
- `idx_bookings_room_id` on `room_id` for room-based queries
- `idx_bookings_start_time` on `start_time` for time-based queries
- `idx_bookings_status` on `status` for status filtering

## Views

### 1. active_rooms
Shows only active rooms with their details for easy querying.

### 2. business_hours_readable
Converts day_of_week numbers to readable day names for display.

## Functions

### 1. is_time_slot_available(room_id, start_time, end_time)
Checks if a specific time slot is available for booking.

### 2. calculate_booking_price(room_id, start_time, end_time)
Calculates the total price for a booking based on room rate and duration.

## Data Relationships

```
Users (1) -----> (0..n) Bookings
                    |
                    v
                 Rooms (1) -----> (0..n) Bookings
```

- Users can have multiple bookings
- Rooms can have multiple bookings
- Each booking belongs to one room and one customer

## Deployment

### Local Development
1. Set up `.env.local` with your Neon DATABASE_URL
2. Run `node server-local.js` - database initializes automatically

### Production Deployment
1. Set up `.env.production` with production DATABASE_URL
2. Run `node deploy-database.js --env production`
3. Deploy your application

### Manual Schema Deployment
1. Connect to your Neon database
2. Run the SQL commands from `database-schema.sql`

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://username:password@hostname:port/database

# Optional
NODE_ENV=development|production
JWT_SECRET=your-jwt-secret-key
```

## Data Persistence

- **Development**: Data persists in Neon database
- **Production**: Data persists in Neon database
- **Backup**: Neon provides automatic backups
- **Migrations**: Use the deployment script for schema updates

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Database connections use SSL
- Input validation on all API endpoints
- SQL injection protection via parameterized queries

## Performance Optimizations

- Indexes on frequently queried columns
- Efficient foreign key relationships
- Optimized queries for common operations
- Connection pooling via Neon serverless

## Monitoring

- Database health checks via `/api/health`
- Error logging for failed operations
- Performance monitoring via Neon dashboard
- Query optimization and analysis
