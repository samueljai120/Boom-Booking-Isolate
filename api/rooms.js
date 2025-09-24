// Vercel API Route: /api/rooms
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

  try {
    // For now, return static data (we'll add database later)
    const rooms = [
      {
        id: 1,
        name: 'VIP Room 1',
        capacity: 8,
        amenities: ['Karaoke', 'TV', 'Air Conditioning'],
        price_per_hour: 50,
        is_available: true
      },
      {
        id: 2,
        name: 'Standard Room 1',
        capacity: 6,
        amenities: ['Karaoke', 'TV'],
        price_per_hour: 35,
        is_available: true
      },
      {
        id: 3,
        name: 'Standard Room 2',
        capacity: 6,
        amenities: ['Karaoke', 'TV'],
        price_per_hour: 35,
        is_available: true
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        rooms
      }
    });
  } catch (error) {
    console.error('Rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: error.message
    });
  }
}
