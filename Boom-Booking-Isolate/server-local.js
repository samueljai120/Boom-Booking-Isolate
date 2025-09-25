import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { sql, initDatabase } from './lib/neon-db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createTenant, getTenantBySlug, getTenantByDomain, updateTenant, getTenantStats } from './api/tenants.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🎤 Starting Boom Karaoke Booking System (Local Development)');
console.log('==========================================================');
console.log(`🚀 Server starting on port ${PORT}`);
console.log(`📍 Server will be available at: http://localhost:${PORT}`);
console.log(`🗄️ Database: Neon PostgreSQL`);
console.log(`🔑 Demo credentials: demo@example.com / demo123`);
console.log('');

// Initialize database once at startup
console.log('🗄️ Initializing database at startup...');
initDatabase().then(() => {
  console.log('✅ Database initialization complete');
}).catch((error) => {
  console.error('❌ Database initialization failed:', error);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (req, res) => {
  console.log('Health check requested at /health');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Boom Karaoke Booking System is running (Local)',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// API Routes

// =============================================
// TENANT MANAGEMENT ROUTES
// =============================================

// Get all tenants
app.get('/api/tenants', async (req, res) => {
  try {
    const tenants = await sql`
      SELECT id, name, slug, email, phone, address, city, state, 
             zip_code, country, timezone, currency, logo_url, website, 
             description, is_active, subscription_plan, max_rooms, 
             max_bookings_per_month, created_at
      FROM tenants 
      WHERE is_active = true
      ORDER BY created_at DESC
    `;
    
    res.json({ 
      success: true, 
      data: tenants 
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tenants' 
    });
  }
});

// Register a new tenant (venue)
app.post('/api/tenants/register', async (req, res) => {
  try {
    const result = await createTenant(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get tenant by slug
app.get('/api/tenants/:slug', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    res.json({ success: true, data: tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(404).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get tenant by domain
app.get('/api/tenants/domain/:domain', async (req, res) => {
  try {
    const tenant = await getTenantByDomain(req.params.domain);
    res.json({ success: true, data: tenant });
  } catch (error) {
    console.error('Get tenant by domain error:', error);
    res.status(404).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update tenant (requires authentication)
app.put('/api/tenants/:tenantId', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const result = await updateTenant(req.params.tenantId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get tenant statistics (requires authentication)
app.get('/api/tenants/:tenantId/stats', async (req, res) => {
  try {
    // TODO: Add authentication middleware
    const stats = await getTenantStats(req.params.tenantId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// =============================================
// AUTHENTICATION ROUTES
// =============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await sql`
      INSERT INTO users (email, password, name, role)
      VALUES (${email}, ${hashedPassword}, ${name}, 'user')
      RETURNING id, email, name, role
    `;

    const user = result[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Fallback to demo registration for development
    const { name, email, password } = req.body;
    
    if (email === 'demo@example.com' && password === 'demo123') {
      res.status(201).json({
        success: true,
        token: 'demo-token-123',
        user: {
          id: 1,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user in database
    const result = await sql`
      SELECT id, email, password, name, role
      FROM users
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Fallback to demo login for development
    const { email, password } = req.body;
    
    if (email === 'demo@example.com' && password === 'demo123') {
      res.status(200).json({
        success: true,
        token: 'demo-token-123',
        user: {
          id: 1,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth header received:', authHeader);
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No valid auth header');
      }
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    // Only log token details in development mode and limit frequency
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) { // Log only 10% of requests
      console.log('🔍 Token extracted:', token);
      console.log('🔍 Token starts with mock-jwt-token-:', token.startsWith('mock-jwt-token-'));
    }
    
    // For demo purposes, accept the demo token and mock tokens FIRST
    if (token === 'demo-token-123' || token.startsWith('mock-jwt-token-')) {
      console.log('✅ Demo/Mock token accepted');
      return res.status(200).json({
        success: true,
        user: {
          id: 1,
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin'
        }
      });
    }
    
    // Enhanced token validation for real JWT tokens
    if (!token || 
        token === 'null' || 
        token === 'undefined' || 
        token === '' ||
        token.length < 10 || // JWT tokens are much longer
        !token.includes('.')) { // JWT tokens have dots
      console.log('❌ Invalid token format:', token);
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify JWT token
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verifying JWT token...');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ JWT token verified for user:', decoded.id);
    }
    
    // Get user from database
    const result = await sql`
      SELECT id, email, name, role
      FROM users
      WHERE id = ${decoded.id}
    `;

    if (result.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found in database');
      }
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User found:', result[0].email);
    }
    res.status(200).json({
      success: true,
      user: result[0]
    });
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    // Get tenant from query parameter or default to demo
    const tenantSlug = req.query.tenant || 'demo';
    
    // Get tenant ID
    const tenant = await sql`
      SELECT id FROM tenants WHERE slug = ${tenantSlug} AND is_active = true
    `;
    
    if (tenant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }
    
    const tenantId = tenant[0].id;
    
    // Get rooms from database for this tenant
    const result = await sql`
      SELECT id, name, capacity, category, description, price_per_hour, is_active
      FROM rooms
      WHERE tenant_id = ${tenantId} AND is_active = true
      ORDER BY id
    `;

    // Normalize room data for frontend compatibility
    const rooms = result.map(row => ({
      ...row,
      // Ensure both ID formats are available
      _id: row.id,
      // Map pricing fields
      pricePerHour: parseFloat(row.price_per_hour || 0),
      hourlyRate: parseFloat(row.price_per_hour || 0),
      // Map status fields
      isActive: row.is_active,
      status: row.is_active ? 'active' : 'inactive',
      isBookable: row.is_active
    }));

    res.status(200).json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Database error:', error);
    
    // Fallback to static data with normalized fields
    const rooms = [
      { 
        id: 1, 
        name: 'Room A', 
        capacity: 4, 
        category: 'Standard', 
        isActive: true,
        is_active: true,
        status: 'active',
        isBookable: true,
        hourlyRate: 25,
        pricePerHour: 25
      },
      { 
        id: 2, 
        name: 'Room B', 
        capacity: 6, 
        category: 'Premium', 
        isActive: true,
        is_active: true,
        status: 'active',
        isBookable: true,
        hourlyRate: 35,
        pricePerHour: 35
      },
      { 
        id: 3, 
        name: 'Room C', 
        capacity: 8, 
        category: 'VIP', 
        isActive: true,
        is_active: true,
        status: 'active',
        isBookable: true,
        hourlyRate: 50,
        pricePerHour: 50
      }
    ];

    res.status(200).json({
      success: true,
      data: rooms
    });
  }
});

// Create new room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, capacity, category, description, price_per_hour, amenities, is_active } = req.body;
    
    // Validate required fields
    if (!name || !capacity || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, capacity, and category are required'
      });
    }

    // Insert new room
    const result = await sql`
      INSERT INTO rooms (name, capacity, category, description, price_per_hour, amenities, is_active)
      VALUES (${name}, ${capacity}, ${category}, ${description || ''}, ${price_per_hour || 0}, ${JSON.stringify(amenities || [])}, ${is_active !== false})
      RETURNING *
    `;

    const newRoom = result[0];
    
    res.status(201).json({
      success: true,
      data: {
        id: newRoom.id,
        name: newRoom.name,
        capacity: newRoom.capacity,
        category: newRoom.category,
        description: newRoom.description,
        pricePerHour: newRoom.price_per_hour,
        amenities: newRoom.amenities,
        isActive: newRoom.is_active,
        created_at: newRoom.created_at
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
});

// Update room
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, category, description, price_per_hour, amenities, is_active } = req.body;

    // Check if room exists
    const existingRoom = await sql`
      SELECT * FROM rooms WHERE id = ${id}
    `;

    if (existingRoom.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Update room
    const result = await sql`
      UPDATE rooms 
      SET name = ${name || existingRoom[0].name},
          capacity = ${capacity || existingRoom[0].capacity},
          category = ${category || existingRoom[0].category},
          description = ${description || existingRoom[0].description},
          price_per_hour = ${price_per_hour || existingRoom[0].price_per_hour},
          amenities = ${JSON.stringify(amenities || existingRoom[0].amenities)},
          is_active = ${is_active !== undefined ? is_active : existingRoom[0].is_active},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    const updatedRoom = result[0];
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedRoom.id,
        name: updatedRoom.name,
        capacity: updatedRoom.capacity,
        category: updatedRoom.category,
        description: updatedRoom.description,
        pricePerHour: updatedRoom.price_per_hour,
        amenities: updatedRoom.amenities,
        isActive: updatedRoom.is_active,
        updated_at: updatedRoom.updated_at
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update room'
    });
  }
});

// Delete room
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room exists
    const existingRoom = await sql`
      SELECT * FROM rooms WHERE id = ${id}
    `;

    if (existingRoom.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Soft delete (set is_active to false)
    await sql`
      UPDATE rooms 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    
    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete room'
    });
  }
});

app.get('/api/business-hours', async (req, res) => {
  try {
    
    // Get business hours from database
    const result = await sql`
      SELECT day_of_week, open_time, close_time, is_closed
      FROM business_hours
      ORDER BY day_of_week
    `;

    const businessHours = result.map(row => ({
      dayOfWeek: row.day_of_week,
      openTime: row.open_time,
      closeTime: row.close_time,
      isClosed: row.is_closed
    }));

    res.status(200).json({
      success: true,
      data: businessHours
    });
  } catch (error) {
    console.error('Database error:', error);
    
    // Fallback to static data
    const businessHours = [
      { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '10:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 0, openTime: '10:00', closeTime: '21:00', isClosed: false }
    ];

    res.status(200).json({
      success: true,
      data: businessHours
    });
  }
});

// Update business hours
app.put('/api/business-hours', async (req, res) => {
  try {
    const { hours } = req.body;
    
    // Validate input
    if (!Array.isArray(hours) || hours.length !== 7) {
      return res.status(400).json({ 
        success: false, 
        error: 'Must provide exactly 7 days of business hours' 
      });
    }

    // Validate each day
    for (const day of hours) {
      if (typeof day.day_of_week !== 'number' || day.day_of_week < 0 || day.day_of_week > 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid day of week. Must be 0-6' 
        });
      }
      if (!day.open_time || !day.close_time) {
        return res.status(400).json({ 
          success: false, 
          error: 'Open time and close time are required' 
        });
      }
    }

    // Clear existing business hours
    await sql`DELETE FROM business_hours`;

    // Insert new business hours
    for (const day of hours) {
      await sql`
        INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed)
        VALUES (${day.day_of_week}, ${day.open_time}, ${day.close_time}, ${day.is_closed || false})
      `;
    }

    // Fetch updated hours
    const result = await sql`
      SELECT day_of_week, open_time, close_time, is_closed
      FROM business_hours
      ORDER BY day_of_week
    `;

    const businessHours = result.map(row => ({
      day_of_week: row.day_of_week,
      open_time: row.open_time,
      close_time: row.close_time,
      is_closed: row.is_closed
    }));

    res.status(200).json({
      success: true,
      data: businessHours
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business hours'
    });
  }
});

// =============================================
// BOOKING MANAGEMENT ROUTES
// =============================================

// Get all bookings for a tenant
app.get('/api/bookings', async (req, res) => {
  try {
    const tenantSlug = req.query.tenant || 'demo';
    
    // Get tenant ID
    const tenant = await sql`
      SELECT id FROM tenants WHERE slug = ${tenantSlug} AND is_active = true
    `;
    
    if (tenant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }
    
    const tenantId = tenant[0].id;
    
    // Get bookings from database for this tenant
    const result = await sql`
      SELECT b.id, b.room_id, b.customer_name, b.customer_email, b.customer_phone,
             b.start_time, b.end_time, b.status, b.notes, b.total_price,
             b.created_at, b.updated_at, 
             r.name as room_name, r.capacity, r.category, r.description, 
             r.price_per_hour as "pricePerHour", r.is_active as "isActive"
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.tenant_id = ${tenantId}
      ORDER BY b.start_time DESC
    `;
    
    res.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bookings' 
    });
  }
});

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const tenantSlug = req.query.tenant || 'demo';
    const {
      room_id,
      roomId,
      customer_name,
      customerName,
      customer_email,
      customerEmail,
      customer_phone,
      customerPhone,
      start_time,
      startTime,
      end_time,
      endTime,
      notes,
      total_price,
      totalPrice
    } = req.body;
    
    // Normalize field names for backend compatibility
    const normalizedData = {
      room_id: room_id || roomId,
      customer_name: customer_name || customerName,
      customer_email: customer_email || customerEmail,
      customer_phone: customer_phone || customerPhone,
      start_time: start_time || startTime,
      end_time: end_time || endTime,
      notes: notes,
      total_price: total_price || totalPrice
    };
    
    // Get tenant ID
    const tenant = await sql`
      SELECT id FROM tenants WHERE slug = ${tenantSlug} AND is_active = true
    `;
    
    if (tenant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }
    
    const tenantId = tenant[0].id;
    
    // Validate required fields using normalized data
    if (!normalizedData.room_id || !normalizedData.customer_name || !normalizedData.start_time || !normalizedData.end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: room_id, customer_name, start_time, end_time'
      });
    }
    
    // Create booking using normalized data
    const newBooking = await sql`
      INSERT INTO bookings (
        tenant_id, room_id, customer_name, customer_email, customer_phone,
        start_time, end_time, status, notes, total_price
      ) VALUES (
        ${tenantId}, ${normalizedData.room_id}, ${normalizedData.customer_name}, 
        ${normalizedData.customer_email || null}, ${normalizedData.customer_phone || null}, 
        ${normalizedData.start_time}, ${normalizedData.end_time}, 'confirmed', 
        ${normalizedData.notes || null}, ${normalizedData.total_price || 0}
      ) RETURNING id, room_id, customer_name, customer_email, customer_phone,
                start_time, end_time, status, notes, total_price, created_at
    `;
    
    res.status(201).json({
      success: true,
      data: newBooking[0]
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSlug = req.query.tenant || 'demo';
    
    // Get tenant ID
    const tenant = await sql`
      SELECT id FROM tenants WHERE slug = ${tenantSlug} AND is_active = true
    `;
    
    if (tenant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }
    
    const tenantId = tenant[0].id;
    
    // Get booking from database
    const result = await sql`
      SELECT b.id, b.room_id, b.customer_name, b.customer_email, b.customer_phone,
             b.start_time, b.end_time, b.status, b.notes, b.total_price,
             b.created_at, b.updated_at, 
             r.name as room_name, r.capacity, r.category, r.description, 
             r.price_per_hour as "pricePerHour", r.is_active as "isActive"
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ${id} AND b.tenant_id = ${tenantId}
    `;
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// Update booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSlug = req.query.tenant || 'demo';
    const updateData = req.body;
    
    // Get tenant ID
    const tenant = await sql`
      SELECT id FROM tenants WHERE slug = ${tenantSlug} AND is_active = true
    `;
    
    if (tenant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }
    
    const tenantId = tenant[0].id;
    
    // Check if booking exists and belongs to tenant
    const existingBooking = await sql`
      SELECT id FROM bookings WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    if (existingBooking.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Update booking
    const allowedFields = [
      'customer_name', 'customer_email', 'customer_phone', 'start_time', 
      'end_time', 'status', 'notes', 'total_price'
    ];
    
    const updateFields = Object.keys(updateData).filter(key => 
      allowedFields.includes(key) && updateData[key] !== undefined
    );
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    const setClause = updateFields.map(field => `${field} = $${updateFields.indexOf(field) + 1}`).join(', ');
    const values = updateFields.map(field => updateData[field]);
    
    const query = `
      UPDATE bookings 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${updateFields.length + 1} AND tenant_id = $${updateFields.length + 2}
      RETURNING id, room_id, customer_name, customer_email, customer_phone,
                start_time, end_time, status, notes, total_price, updated_at
    `;
    
    const result = await sql(query, [...values, id, tenantId]);
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantSlug = req.query.tenant || 'demo';
    
    // Get tenant ID
    const tenant = await sql`
      SELECT id FROM tenants WHERE slug = ${tenantSlug} AND is_active = true
    `;
    
    if (tenant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tenant not found' 
      });
    }
    
    const tenantId = tenant[0].id;
    
    // Check if booking exists and belongs to tenant
    const existingBooking = await sql`
      SELECT id FROM bookings WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    if (existingBooking.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    // Delete booking
    await sql`
      DELETE FROM bookings WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Update business hours for specific day
app.put('/api/business-hours/:day', async (req, res) => {
  try {
    const { day } = req.params;
    const { open_time, close_time, is_closed } = req.body;
    const dayOfWeek = parseInt(day);

    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day of week. Must be 0-6'
      });
    }

    if (!open_time || !close_time) {
      return res.status(400).json({
        success: false,
        error: 'Open time and close time are required'
      });
    }

    // Update or insert business hours for specific day
    await sql`
      INSERT INTO business_hours (tenant_id, day_of_week, open_time, close_time, is_closed)
      VALUES (1, ${dayOfWeek}, ${open_time}, ${close_time}, ${is_closed || false})
      ON CONFLICT (tenant_id, day_of_week) 
      DO UPDATE SET 
        open_time = EXCLUDED.open_time,
        close_time = EXCLUDED.close_time,
        is_closed = EXCLUDED.is_closed
    `;

    // Fetch updated hours for this day
    const result = await sql`
      SELECT day_of_week, open_time, close_time, is_closed
      FROM business_hours
      WHERE day_of_week = ${dayOfWeek}
    `;

    const businessHours = result.map(row => ({
      day_of_week: row.day_of_week,
      open_time: row.open_time,
      close_time: row.close_time,
      is_closed: row.is_closed
    }));

    res.status(200).json({
      success: true,
      data: businessHours[0]
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update business hours for day'
    });
  }
});

// =============================================
// SETTINGS ROUTES
// =============================================

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await sql`
      SELECT key, value, type, category, description, updated_at
      FROM settings
      ORDER BY category, key
    `;

    // Convert to object format
    const settings = {};
    result.forEach(row => {
      if (!settings[row.category]) {
        settings[row.category] = {};
      }
      settings[row.category][row.key] = {
        value: row.value,
        type: row.type,
        description: row.description,
        updated_at: row.updated_at
      };
    });

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

// Update settings (bulk)
app.put('/api/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Settings object is required'
      });
    }

    // Update each setting
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, settingData] of Object.entries(categorySettings)) {
        const value = typeof settingData === 'object' ? settingData.value : settingData;
        
        await sql`
          INSERT INTO settings (tenant_id, key, value, category, updated_at)
          VALUES (1, ${key}, ${JSON.stringify(value)}, ${category}, CURRENT_TIMESTAMP)
          ON CONFLICT (tenant_id, key) 
          DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = EXCLUDED.updated_at
        `;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

// Update specific setting
app.put('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category = 'general' } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Value is required'
      });
    }

    await sql`
      INSERT INTO settings (tenant_id, key, value, category, updated_at)
      VALUES (1, ${key}, ${JSON.stringify(value)}, ${category}, CURRENT_TIMESTAMP)
      ON CONFLICT (tenant_id, key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update setting'
    });
  }
});

// Handle OPTIONS requests for all API routes
app.options('/api/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.status(200).end();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // Check if this is a health check request
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('healthcheck')) {
    console.log('Health check requested at root');
    return res.status(200).json({ 
      status: 'OK', 
      message: 'Boom Karaoke Booking System is running (Local)',
      timestamp: new Date().toISOString(),
      environment: 'development'
    });
  }
  
  // For regular requests, serve the React app
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log('✅ Application ready!');
  console.log(`🌐 Server listening on http://localhost:${PORT}`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log(`📱 Frontend available at http://localhost:${PORT}`);
  console.log('');
  console.log('🚀 Ready for local development!');
});