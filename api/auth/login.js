// Vercel API Route: /api/auth/login
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // For now, use demo login (we'll add database later)
    if (email === 'demo@example.com' && password === 'demo123') {
      // Create a simple JWT token (in production, use a proper JWT library)
      const token = Buffer.from(JSON.stringify({
        userId: 1,
        email: 'demo@example.com',
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      })).toString('base64');

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: 1,
            email: 'demo@example.com',
            name: 'Demo User'
          },
          token
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}
