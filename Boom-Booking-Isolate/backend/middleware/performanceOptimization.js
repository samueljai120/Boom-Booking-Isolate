/**
 * Performance Optimization Middleware
 * 
 * Advanced caching strategies, database query optimization,
 * response compression, and performance monitoring.
 */

import compression from 'compression';
import { pool } from '../database/postgres.js';

// In-memory cache for frequently accessed data
class MemoryCache {
  constructor(maxSize = 1000, ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  set(key, value, customTtl = null) {
    const ttl = customTtl || this.ttl;
    const expiry = Date.now() + ttl;

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < oldestTime) {
        oldestTime = item.expiry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Create cache instances for different data types
const caches = {
  rooms: new MemoryCache(100, 600000), // 10 minutes
  businessHours: new MemoryCache(50, 1800000), // 30 minutes
  settings: new MemoryCache(20, 3600000), // 1 hour
  bookings: new MemoryCache(500, 120000), // 2 minutes
  users: new MemoryCache(200, 900000) // 15 minutes
};

// Cache key generators
const cacheKeys = {
  rooms: (tenantId, filters = {}) => `rooms:${tenantId}:${JSON.stringify(filters)}`,
  room: (tenantId, roomId) => `room:${tenantId}:${roomId}`,
  businessHours: (tenantId) => `business_hours:${tenantId}`,
  settings: (tenantId) => `settings:${tenantId}`,
  bookings: (tenantId, filters = {}) => `bookings:${tenantId}:${JSON.stringify(filters)}`,
  booking: (tenantId, bookingId) => `booking:${tenantId}:${bookingId}`,
  user: (userId) => `user:${userId}`
};

// Response compression middleware
export const responseCompression = compression({
  level: 6, // Compression level (1-9, 6 is good balance)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Use compression for all other requests
    return compression.filter(req, res);
  }
});

// Database query caching middleware
export const cacheMiddleware = (cacheType, keyGenerator, ttl = null) => {
  return async (req, res, next) => {
    const cache = caches[cacheType];
    if (!cache) {
      return next();
    }

    const key = keyGenerator(req);
    const cachedData = cache.get(key);

    if (cachedData) {
      console.log(`📦 Cache HIT for ${cacheType}: ${key}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheKey: key
      });
    }

    console.log(`📦 Cache MISS for ${cacheType}: ${key}`);
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      if (data.success && data.data) {
        cache.set(key, data.data, ttl);
        console.log(`📦 Cached ${cacheType}: ${key}`);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation helpers
export const invalidateCache = {
  rooms: (tenantId) => {
    // Invalidate all room-related cache entries
    const roomCache = caches.rooms;
    for (const [key] of roomCache.cache.entries()) {
      if (key.includes(`rooms:${tenantId}`) || key.includes(`room:${tenantId}`)) {
        roomCache.cache.delete(key);
      }
    }
    console.log(`🗑️ Invalidated room cache for tenant: ${tenantId}`);
  },

  bookings: (tenantId, bookingId = null) => {
    const bookingCache = caches.bookings;
    for (const [key] of bookingCache.cache.entries()) {
      if (bookingId) {
        if (key.includes(`booking:${tenantId}:${bookingId}`) || 
            key.includes(`bookings:${tenantId}`)) {
          bookingCache.cache.delete(key);
        }
      } else if (key.includes(`bookings:${tenantId}`)) {
        bookingCache.cache.delete(key);
      }
    }
    console.log(`🗑️ Invalidated booking cache for tenant: ${tenantId}${bookingId ? `, booking: ${bookingId}` : ''}`);
  },

  settings: (tenantId) => {
    const settingsCache = caches.settings;
    for (const [key] of settingsCache.cache.entries()) {
      if (key.includes(`settings:${tenantId}`)) {
        settingsCache.cache.delete(key);
      }
    }
    console.log(`🗑️ Invalidated settings cache for tenant: ${tenantId}`);
  },

  businessHours: (tenantId) => {
    const businessHoursCache = caches.businessHours;
    for (const [key] of businessHoursCache.cache.entries()) {
      if (key.includes(`business_hours:${tenantId}`)) {
        businessHoursCache.cache.delete(key);
      }
    }
    console.log(`🗑️ Invalidated business hours cache for tenant: ${tenantId}`);
  },

  all: (tenantId) => {
    invalidateCache.rooms(tenantId);
    invalidateCache.bookings(tenantId);
    invalidateCache.settings(tenantId);
    invalidateCache.businessHours(tenantId);
  }
};

// Database query optimization
export const optimizeQueries = {
  // Optimized room queries with proper indexing hints
  getRooms: async (tenantId, filters = {}) => {
    const { category, is_active } = filters;
    
    let query = `
      SELECT r.*, 
             COUNT(b.id) as active_bookings_count,
             MAX(b.end_time) as last_booking_time
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.tenant_id = $1 
        AND b.status != 'cancelled'
        AND b.start_time > NOW()
      WHERE r.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (category) {
      query += ` AND r.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND r.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    query += `
      GROUP BY r.id
      ORDER BY r.name
    `;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Optimized booking queries with conflict checking
  getBookings: async (tenantId, filters = {}) => {
    const { room_id, status, start_date, end_date } = filters;
    
    let query = `
      SELECT b.*, 
             r.name as room_name, 
             r.capacity as room_capacity, 
             r.category as room_category,
             r.price_per_hour
      FROM bookings b
      INNER JOIN rooms r ON b.room_id = r.id
      WHERE b.tenant_id = $1 AND r.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;

    if (room_id) {
      query += ` AND b.room_id = $${paramIndex}`;
      params.push(room_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND b.start_time >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND b.end_time <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ' ORDER BY b.start_time';

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Optimized availability checking
  checkAvailability: async (tenantId, roomId, startTime, endTime, excludeBookingId = null) => {
    let query = `
      SELECT COUNT(*) as conflict_count
      FROM bookings b
      WHERE b.tenant_id = $1 
        AND b.room_id = $2 
        AND b.status != 'cancelled'
        AND ((b.start_time < $4 AND b.end_time > $3))
    `;
    
    const params = [tenantId, roomId, startTime, endTime];

    if (excludeBookingId) {
      query += ` AND b.id != $5`;
      params.push(excludeBookingId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].conflict_count) === 0;
  }
};

// Performance monitoring middleware
export const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Override res.end to capture performance metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const metrics = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: endTime - startTime,
      memoryDelta: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal
      },
      timestamp: new Date().toISOString(),
      tenantId: req.tenant_id,
      userId: req.user?.id
    };

    // Log slow requests
    if (metrics.duration > 1000) {
      console.warn('🐌 Slow request detected:', metrics);
    }

    // Store performance metrics
    storePerformanceMetrics(metrics);

    return originalEnd.apply(this, args);
  };

  next();
};

// Store performance metrics
const storePerformanceMetrics = async (metrics) => {
  try {
    await pool.query(
      `INSERT INTO performance_metrics (method, url, status_code, duration, memory_delta, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        metrics.method,
        metrics.url,
        metrics.statusCode,
        metrics.duration,
        JSON.stringify(metrics.memoryDelta)
      ]
    );
  } catch (error) {
    console.error('Failed to store performance metrics:', error);
  }
};

// Database connection pooling optimization
export const optimizeDatabasePool = () => {
  // Configure pool for optimal performance
  pool.on('connect', (client) => {
    console.log('🔗 New database client connected');
    
    // Set optimal connection parameters
    client.query('SET statement_timeout = 30000'); // 30 second timeout
    client.query('SET idle_in_transaction_session_timeout = 60000'); // 1 minute
    client.query('SET lock_timeout = 10000'); // 10 second lock timeout
  });

  pool.on('error', (err) => {
    console.error('💥 Unexpected error on idle database client:', err);
  });

  // Monitor pool statistics
  setInterval(() => {
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    if (poolStats.waitingCount > 0) {
      console.warn('⚠️ Database pool has waiting connections:', poolStats);
    }
  }, 30000); // Check every 30 seconds
};

// Cache statistics endpoint
export const getCacheStats = async (req, res) => {
  try {
    const stats = {};
    for (const [cacheName, cache] of Object.entries(caches)) {
      stats[cacheName] = cache.getStats();
    }

    res.json({
      success: true,
      data: {
        caches: stats,
        totalMemoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      code: 'CACHE_STATS_ERROR'
    });
  }
};

// Clear all caches endpoint (admin only)
export const clearAllCaches = async (req, res) => {
  try {
    for (const cache of Object.values(caches)) {
      cache.clear();
    }

    console.log('🗑️ All caches cleared by admin');
    
    res.json({
      success: true,
      message: 'All caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    res.status(500).json({
      error: 'Failed to clear caches',
      code: 'CACHE_CLEAR_ERROR'
    });
  }
};

// Preload frequently accessed data
export const preloadData = async (tenantId) => {
  try {
    console.log(`🔄 Preloading data for tenant: ${tenantId}`);

    // Preload rooms
    const rooms = await optimizeQueries.getRooms(tenantId);
    caches.rooms.set(cacheKeys.rooms(tenantId), rooms);

    // Preload business hours
    const businessHours = await pool.query(
      'SELECT * FROM business_hours WHERE tenant_id = $1 ORDER BY day_of_week',
      [tenantId]
    );
    caches.businessHours.set(cacheKeys.businessHours(tenantId), businessHours.rows);

    // Preload settings
    const settings = await pool.query(
      'SELECT * FROM settings WHERE tenant_id = $1',
      [tenantId]
    );
    caches.settings.set(cacheKeys.settings(tenantId), settings.rows);

    console.log(`✅ Data preloaded for tenant: ${tenantId}`);
  } catch (error) {
    console.error('Error preloading data:', error);
  }
};

export default {
  caches,
  cacheKeys,
  invalidateCache,
  responseCompression,
  cacheMiddleware,
  optimizeQueries,
  performanceMonitor,
  optimizeDatabasePool,
  getCacheStats,
  clearAllCaches,
  preloadData
};
