# Boom Karaoke Frontend - Standalone Version

This is a clean, isolated frontend version of the Boom Karaoke booking system that runs independently with mock data. Perfect for demonstrations, development, or as a starting point for new projects.

## 🚀 Features

- **Complete UI/UX**: Full karaoke room booking interface
- **Mock Data**: Pre-configured with sample rooms, bookings, and settings
- **No Backend Required**: Runs entirely in the browser
- **Modern Stack**: React 18, Vite, Tailwind CSS, React Query
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Calendar**: Drag-and-drop booking management
- **Real-time Simulation**: WebSocket-like behavior with mock data

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn

## 🛠️ Quick Start

1. **Install Dependencies**
   ```bash
   cd isolate
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - Use demo credentials: `demo@example.com` / `demo123`

## 🎯 Demo Credentials

- **Email**: `demo@example.com`
- **Password**: `demo123`

## 📁 Project Structure

```
isolate/
├── src/
│   ├── components/          # React components
│   │   ├── AppleCalendarDashboard.jsx
│   │   ├── BookingManagement.jsx
│   │   ├── LoginForm.jsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── SettingsContext.jsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.js          # Mock API layer
│   │   └── mockData.js     # Sample data
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── main.jsx           # App entry point
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind CSS config
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env.local` to customize:

```bash
cp env.example .env.local
```

Available options:
- `VITE_API_BASE_URL`: Override mock API with real backend
- `VITE_APP_NAME`: Customize app name
- `VITE_DEV_MODE`: Enable/disable development features

### Mock Data Customization

Edit `src/lib/mockData.js` to customize:
- Room configurations
- Sample bookings
- Business hours
- User settings

## 🎨 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Production Deployment

### Build
```bash
npm run build
```

### Deploy to Static Hosting
The `dist/` folder contains static files that can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any static hosting service

### Environment Variables for Production
Set these in your hosting platform:
- `VITE_API_BASE_URL`: Your production API URL
- `VITE_APP_NAME`: Your app name

## 🔌 Connecting to Real Backend

To connect to a real backend instead of mock data:

1. **Update API Configuration**
   ```javascript
   // In src/lib/api.js
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api.com/api';
   ```

2. **Set Environment Variable**
   ```bash
   VITE_API_BASE_URL=https://your-api.com/api
   ```

3. **Restore Real API Implementation**
   Replace the mock API calls with real HTTP requests using axios.

## 🎭 Mock Data Features

### Sample Rooms
- **Room A**: Standard room (4 people)
- **Room B**: Premium room (6 people) 
- **Room C**: VIP room (8 people)

### Sample Bookings
- Pre-configured with realistic booking data
- Various time slots and customer information
- Different booking statuses

### Business Hours
- Configurable weekly schedule
- Holiday exceptions support
- Timezone handling

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dependencies Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Build Errors**
   ```bash
   # Check for TypeScript/ESLint errors
   npm run lint
   ```

## 📚 Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query, Context API
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Calendar**: React Big Calendar
- **Drag & Drop**: @dnd-kit
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Date Handling**: Moment.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Boom Karaoke system. See the main project for licensing information.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the mock data configuration
3. Check browser console for errors
4. Ensure all dependencies are installed

---

**Note**: This is a standalone frontend with mock data. For production use, connect to a real backend API.