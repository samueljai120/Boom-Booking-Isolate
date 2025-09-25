-- Boom Booking Database Schema
-- This file contains the complete database schema for the Boom Booking system
-- Use this for deployment to Neon PostgreSQL

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ROOMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BUSINESS HOURS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS business_hours (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day_of_week)
);

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    notes TEXT,
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================

-- Insert default rooms
INSERT INTO rooms (name, capacity, category, description, price_per_hour, is_active) VALUES
('Room A', 4, 'Standard', 'Standard karaoke room for small groups', 25.00, true),
('Room B', 6, 'Premium', 'Premium room with better sound system', 35.00, true),
('Room C', 8, 'VIP', 'VIP room with luxury amenities', 50.00, true)
ON CONFLICT DO NOTHING;

-- Insert default business hours (0 = Sunday, 1 = Monday, etc.)
INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, '10:00:00', '21:00:00', false), -- Sunday
(1, '09:00:00', '22:00:00', false), -- Monday
(2, '09:00:00', '22:00:00', false), -- Tuesday
(3, '09:00:00', '22:00:00', false), -- Wednesday
(4, '09:00:00', '22:00:00', false), -- Thursday
(5, '09:00:00', '23:00:00', false), -- Friday
(6, '10:00:00', '23:00:00', false)  -- Saturday
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert demo user
INSERT INTO users (email, password, name, role) VALUES
('demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for active rooms with pricing
CREATE OR REPLACE VIEW active_rooms AS
SELECT 
    id,
    name,
    capacity,
    category,
    description,
    price_per_hour,
    created_at
FROM rooms 
WHERE is_active = true
ORDER BY category, name;

-- View for business hours in readable format
CREATE OR REPLACE VIEW business_hours_readable AS
SELECT 
    CASE day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    day_of_week,
    open_time,
    close_time,
    is_closed
FROM business_hours
ORDER BY day_of_week;

-- =============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =============================================

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_time_slot_available(
    p_room_id INTEGER,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE room_id = p_room_id 
        AND status IN ('confirmed', 'pending')
        AND (
            (start_time <= p_start_time AND end_time > p_start_time) OR
            (start_time < p_end_time AND end_time >= p_end_time) OR
            (start_time >= p_start_time AND end_time <= p_end_time)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate booking price
CREATE OR REPLACE FUNCTION calculate_booking_price(
    p_room_id INTEGER,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    room_price DECIMAL(10,2);
    hours_duration DECIMAL(10,2);
BEGIN
    SELECT price_per_hour INTO room_price FROM rooms WHERE id = p_room_id;
    hours_duration := EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600;
    RETURN room_price * hours_duration;
END;
$$ LANGUAGE plpgsql;
