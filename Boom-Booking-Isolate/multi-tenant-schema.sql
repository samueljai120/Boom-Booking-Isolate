-- Boom Booking Multi-Tenant Database Schema
-- This schema supports multiple venues/tenants with proper isolation

-- =============================================
-- TENANTS/VENUES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',
    logo_url VARCHAR(500),
    website VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    max_rooms INTEGER DEFAULT 1,
    max_bookings_per_month INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USERS TABLE (Updated for Multi-Tenancy)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE(tenant_id, email)
);

-- =============================================
-- ROOMS TABLE (Updated for Multi-Tenancy)
-- =============================================
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE(tenant_id, name)
);

-- =============================================
-- BUSINESS HOURS TABLE (Updated for Multi-Tenancy)
-- =============================================
CREATE TABLE IF NOT EXISTS business_hours (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE(tenant_id, day_of_week)
);

-- =============================================
-- BOOKINGS TABLE (Updated for Multi-Tenancy)
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
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
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
);

-- =============================================
-- TENANT SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_settings (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
    UNIQUE(tenant_id, setting_key)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);

CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_rooms_tenant_id ON rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant_active ON rooms(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_business_hours_tenant_id ON business_hours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_tenant_day ON business_hours(tenant_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_room ON bookings(tenant_id, room_id);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_key ON tenant_settings(tenant_id, setting_key);

-- =============================================
-- DEFAULT TENANT CREATION
-- =============================================

-- Insert default tenant (for existing single-tenant setup)
INSERT INTO tenants (
    name, slug, email, phone, address, city, state, zip_code, 
    country, timezone, currency, description, subscription_plan, 
    max_rooms, max_bookings_per_month
) VALUES (
    'Boom Karaoke Demo', 
    'demo', 
    'demo@boomkaraoke.com', 
    '+1-555-0123', 
    '123 Music Street', 
    'New York', 
    'NY', 
    '10001', 
    'US', 
    'America/New_York', 
    'USD', 
    'Demo karaoke venue for testing', 
    'free', 
    3, 
    50
) ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- MIGRATE EXISTING DATA TO MULTI-TENANT
-- =============================================

-- Get the default tenant ID
DO $$
DECLARE
    default_tenant_id INTEGER;
BEGIN
    SELECT id INTO default_tenant_id FROM tenants WHERE slug = 'demo' LIMIT 1;
    
    -- Update existing users to belong to default tenant
    UPDATE users SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    
    -- Update existing rooms to belong to default tenant
    UPDATE rooms SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    
    -- Update existing business_hours to belong to default tenant
    UPDATE business_hours SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    
    -- Update existing bookings to belong to default tenant
    UPDATE bookings SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- =============================================
-- VIEWS FOR MULTI-TENANT QUERIES
-- =============================================

-- View for tenant-specific active rooms
CREATE OR REPLACE VIEW tenant_active_rooms AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    r.id,
    r.name,
    r.capacity,
    r.category,
    r.description,
    r.price_per_hour,
    r.created_at
FROM tenants t
JOIN rooms r ON t.id = r.tenant_id
WHERE t.is_active = true AND r.is_active = true
ORDER BY t.name, r.category, r.name;

-- View for tenant business hours
CREATE OR REPLACE VIEW tenant_business_hours AS
SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    t.timezone,
    bh.day_of_week,
    CASE bh.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    bh.open_time,
    bh.close_time,
    bh.is_closed
FROM tenants t
JOIN business_hours bh ON t.id = bh.tenant_id
WHERE t.is_active = true
ORDER BY t.name, bh.day_of_week;

-- =============================================
-- FUNCTIONS FOR MULTI-TENANT OPERATIONS
-- =============================================

-- Function to check if a time slot is available for a specific tenant
CREATE OR REPLACE FUNCTION is_tenant_time_slot_available(
    p_tenant_id INTEGER,
    p_room_id INTEGER,
    p_start_time TIMESTAMP,
    p_end_time TIMESTAMP
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM bookings 
        WHERE tenant_id = p_tenant_id
        AND room_id = p_room_id 
        AND status IN ('confirmed', 'pending')
        AND (
            (start_time <= p_start_time AND end_time > p_start_time) OR
            (start_time < p_end_time AND end_time >= p_end_time) OR
            (start_time >= p_start_time AND end_time <= p_end_time)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant by slug
CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug VARCHAR) 
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    slug VARCHAR,
    domain VARCHAR,
    email VARCHAR,
    timezone VARCHAR,
    currency VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id, t.name, t.slug, t.domain, t.email, 
        t.timezone, t.currency, t.is_active
    FROM tenants t
    WHERE t.slug = p_slug AND t.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new tenant with default data
CREATE OR REPLACE FUNCTION create_tenant(
    p_name VARCHAR,
    p_slug VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city VARCHAR DEFAULT NULL,
    p_state VARCHAR DEFAULT NULL,
    p_zip_code VARCHAR DEFAULT NULL,
    p_country VARCHAR DEFAULT 'US',
    p_timezone VARCHAR DEFAULT 'America/New_York',
    p_currency VARCHAR DEFAULT 'USD'
) RETURNS INTEGER AS $$
DECLARE
    new_tenant_id INTEGER;
    day_counter INTEGER;
BEGIN
    -- Create tenant
    INSERT INTO tenants (
        name, slug, email, phone, address, city, state, zip_code,
        country, timezone, currency, subscription_plan, max_rooms, max_bookings_per_month
    ) VALUES (
        p_name, p_slug, p_email, p_phone, p_address, p_city, p_state, p_zip_code,
        p_country, p_timezone, p_currency, 'free', 1, 50
    ) RETURNING id INTO new_tenant_id;
    
    -- Create default business hours
    FOR day_counter IN 0..6 LOOP
        INSERT INTO business_hours (tenant_id, day_of_week, open_time, close_time, is_closed) VALUES
        (new_tenant_id, day_counter, 
         CASE WHEN day_counter IN (0, 6) THEN '10:00:00' ELSE '09:00:00' END,
         CASE WHEN day_counter IN (0, 6) THEN '21:00:00' ELSE '22:00:00' END,
         false);
    END LOOP;
    
    -- Create a default room
    INSERT INTO rooms (tenant_id, name, capacity, category, description, price_per_hour) VALUES
    (new_tenant_id, 'Main Room', 4, 'Standard', 'Main karaoke room', 25.00);
    
    RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql;
