// Vercel API Route: /api/business-hours
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

  // Business hours data
  const businessHours = [
    { day: 'monday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'tuesday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'wednesday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'thursday', open: '09:00', close: '22:00', isOpen: true },
    { day: 'friday', open: '09:00', close: '23:00', isOpen: true },
    { day: 'saturday', open: '10:00', close: '23:00', isOpen: true },
    { day: 'sunday', open: '10:00', close: '21:00', isOpen: true }
  ];

  res.status(200).json({
    success: true,
    data: {
      businessHours
    }
  });
}
