# Boom Booking - Advanced Calendar & Scheduling Platform

A comprehensive booking and scheduling platform built with React, Node.js, and modern web technologies. This project provides a complete solution for businesses to manage bookings, appointments, and scheduling operations.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Support for multiple businesses with isolated data
- **Advanced Calendar System**: Interactive calendar with drag-and-drop booking
- **Real-time Booking Management**: Live updates and notifications
- **User Authentication**: Secure login with JWT tokens and role-based access
- **Email Integration**: Automated email notifications and confirmations
- **Payment Processing**: Stripe integration for secure payments
- **Analytics Dashboard**: Comprehensive reporting and insights

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: WebSocket integration for live data
- **API-first Architecture**: RESTful APIs with comprehensive documentation
- **Database Management**: SQLite for development, PostgreSQL for production
- **Docker Support**: Containerized deployment ready
- **CI/CD Ready**: Automated testing and deployment pipelines

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **State Management**: Context API with custom hooks
- **Routing**: React Router for navigation
- **Testing**: Vitest and Playwright for comprehensive testing

### Backend (Node.js)
- **Runtime**: Node.js with Express.js
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: JWT with bcrypt password hashing
- **API**: RESTful endpoints with comprehensive error handling
- **Security**: CORS, rate limiting, and input validation

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Deployment**: Railway, Netlify, and Vercel ready
- **Monitoring**: Health checks and logging
- **Environment**: Development, staging, and production configs

## 📁 Project Structure

```
Boom-Booking-Isolate/
├── backend/                 # Node.js backend
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware
│   ├── database/           # Database configuration
│   └── scripts/            # Database scripts
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── utils/              # Utility functions
├── docs/                   # Documentation
├── tests/                  # Test files
└── docker/                 # Docker configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Boom-Booking-Isolate
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp env.example .env
   cp backend/env.example backend/.env
   ```

4. **Database Setup**
   ```bash
   cd backend
   node scripts/init-database.js
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

### Docker Deployment

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.production.yml up
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Boom Booking
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
DATABASE_URL=sqlite:./data/database.sqlite
STRIPE_SECRET_KEY=sk_test_...
EMAIL_SERVICE_API_KEY=your-email-api-key
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Booking Endpoints
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### Business Endpoints
- `GET /api/business` - Get business settings
- `PUT /api/business` - Update business settings
- `GET /api/business/hours` - Get business hours
- `PUT /api/business/hours` - Update business hours

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd backend && npm test

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway up
```

### Netlify Deployment
```bash
# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Open an issue on GitHub
- **Email**: Contact support at support@boombooking.com

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] User authentication and authorization
- [x] Basic booking management
- [x] Calendar interface
- [x] Email notifications

### Phase 2: Advanced Features ✅
- [x] Multi-tenant architecture
- [x] Payment processing
- [x] Analytics dashboard
- [x] Mobile responsiveness

### Phase 3: Enterprise Features 🚧
- [ ] Advanced reporting
- [ ] API integrations
- [ ] White-label solutions
- [ ] Advanced automation

### Phase 4: AI Integration 🔮
- [ ] AI-powered scheduling
- [ ] Predictive analytics
- [ ] Smart notifications
- [ ] Automated optimization

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first styling
- Express.js for the robust backend framework
- All contributors and community members

---

**Built with ❤️ by the Boom Booking Team**
