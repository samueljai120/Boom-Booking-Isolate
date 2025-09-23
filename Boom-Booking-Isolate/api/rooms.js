// Vercel API Route: /api/rooms
export default function handler(req, res) {
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

  // Rooms data
  const rooms = [
    { id: 1, name: 'Room A', capacity: 4, category: 'Standard', isActive: true },
    { id: 2, name: 'Room B', capacity: 6, category: 'Premium', isActive: true },
    { id: 3, name: 'Room C', capacity: 8, category: 'VIP', isActive: true }
  ];

  res.status(200).json({
    success: true,
    data: rooms
  });
}
