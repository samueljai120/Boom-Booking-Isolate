// Secure CORS configuration for Vercel API routes
export function setSecureCORSHeaders(res, allowedOrigin = null) {
  // Get allowed origins from environment or use default
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://boom-karaoke-booking.vercel.app', 'http://localhost:3000'];
  
  // Determine the origin to use
  const origin = allowedOrigin || allowedOrigins[0];
  
  // Set secure CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, X-CSRF-Token'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export function handlePreflightRequest(res) {
  setSecureCORSHeaders(res);
  res.status(200).end();
  return true;
}
