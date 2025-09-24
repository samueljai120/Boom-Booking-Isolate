# 🎤 Boom Karaoke Booking System

> **Professional karaoke room booking platform with real-time scheduling and management**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18.0+-blue?style=for-the-badge&logo=react)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?style=for-the-badge&logo=postgresql)](https://postgresql.org)

## 📋 **Table of Contents**

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)
- [🌐 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 **Overview**

Boom Karaoke Booking System is a modern, full-stack web application designed for karaoke room management and booking. Built with React, Node.js, and PostgreSQL, it provides a seamless experience for both customers and administrators.

### **Key Highlights:**
- 🎵 **Real-time Booking** - Live calendar with instant availability
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔐 **Secure Authentication** - JWT-based user management
- 💳 **Payment Integration** - Ready for payment processing
- 📊 **Analytics Dashboard** - Business insights and reporting
- 🌐 **Multi-tenant Ready** - Scalable for multiple locations

## ✨ **Features**

### **🎤 Customer Features**
- **Room Booking** - Easy room selection and time slot booking
- **Real-time Calendar** - Live availability updates
- **User Authentication** - Secure login and registration
- **Booking Management** - View and modify existing bookings
- **Room Details** - Comprehensive room information and amenities

### **🏢 Admin Features**
- **Room Management** - Add, edit, and manage karaoke rooms
- **Booking Oversight** - Monitor and manage all bookings
- **Business Hours** - Configure operating hours and availability
- **Analytics Dashboard** - Business performance insights
- **User Management** - Customer account administration

### **🔧 Technical Features**
- **RESTful API** - Clean, well-documented API endpoints
- **Real-time Updates** - WebSocket integration for live updates
- **Database Integration** - PostgreSQL with Neon serverless
- **Responsive UI** - Mobile-first design approach
- **Error Handling** - Comprehensive error management
- **Security** - CORS protection and input validation

## 🏗️ **Architecture**

### **Frontend (React + Vite)**
```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── contexts/           # React contexts
└── styles/             # CSS and styling
```

### **Backend (Vercel Functions)**
```
api/
├── auth/               # Authentication endpoints
├── rooms/              # Room management
├── bookings/           # Booking management
└── health/             # System health checks
```

### **Database (Neon PostgreSQL)**
- **Users** - Customer and admin accounts
- **Rooms** - Karaoke room information
- **Bookings** - Reservation data
- **Business Hours** - Operating schedule

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18.0 or higher
- npm or yarn package manager
- Git

### **1. Clone the Repository**
```bash
git clone https://github.com/samueljai120/Advanced-Calendar.git
cd Advanced-Calendar
```

### **2. Install Dependencies**
```bash
# Install frontend dependencies
cd Boom-Booking-Isolate
npm install

# Install backend dependencies (if needed)
cd backend
npm install
```

### **3. Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Database Configuration
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API Configuration
VITE_API_BASE_URL=/api
VITE_WS_URL=
```

### **4. Start Development Server**
```bash
# Start Vercel development server (recommended)
vercel dev

# OR start regular development server
npm run dev
```

### **5. Access the Application**
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

## 📁 **Project Structure**

```
Ver alpha scale up/
├── Boom-Booking-Isolate/          # Main React application
│   ├── src/                       # Source code
│   ├── public/                    # Static assets
│   ├── api/                       # Vercel API routes
│   ├── lib/                       # Shared libraries
│   └── package.json               # Dependencies
├── docs/                          # Documentation
│   ├── business/                  # Business documents
│   ├── development/               # Development guides
│   ├── deployment/                # Deployment guides
│   └── troubleshooting/           # Fix guides
├── config/                        # Configuration files
│   ├── vercel.json               # Vercel configuration
│   ├── railway.json              # Railway configuration
│   └── package.json              # Root dependencies
├── assets/                        # Static assets
├── scripts/                       # Utility scripts
└── dist/                          # Build output
```

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | No | 7d |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | No | 30d |
| `VITE_API_BASE_URL` | Frontend API base URL | No | /api |
| `VITE_WS_URL` | WebSocket URL | No | - |

### **Database Setup**
1. Create a Neon PostgreSQL database
2. Copy the connection string to `DATABASE_URL`
3. The application will automatically initialize tables

## 🌐 **Deployment**

### **Vercel Deployment (Recommended)**
1. **Connect Repository** - Link your GitHub repository to Vercel
2. **Configure Environment** - Add environment variables in Vercel dashboard
3. **Deploy** - Automatic deployment on every push to main branch

### **Manual Deployment**
```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

### **Environment Variables for Production**
Add these variables in your Vercel dashboard:
- `DATABASE_URL` - Your Neon database URL
- `JWT_SECRET` - Secure JWT secret key
- `JWT_EXPIRES_IN` - Token expiration (e.g., 7d)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (e.g., 30d)

## 🧪 **Testing**

### **Local Testing**
```bash
# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/business-hours
curl http://localhost:3000/api/rooms

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

### **Frontend Testing**
1. Open http://localhost:3000
2. Test login with demo credentials
3. Verify calendar functionality
4. Test booking flow

## 📚 **Documentation**

### **Available Documentation**
- **[Local Testing Guide](docs/development/LOCAL_TESTING_GUIDE.md)** - Complete local testing instructions
- **[Neon Database Setup](docs/development/NEON_DATABASE_SETUP_GUIDE.md)** - Database configuration
- **[Deployment Guides](docs/deployment/)** - Various deployment options
- **[Troubleshooting](docs/troubleshooting/)** - Common issues and solutions
- **[Business Plans](docs/business/)** - Business strategy and planning

### **API Documentation**
- **Health Check**: `GET /api/health`
- **Business Hours**: `GET /api/business-hours`
- **Rooms**: `GET /api/rooms`
- **Login**: `POST /api/auth/login`
- **User Info**: `GET /api/auth/me`

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Getting Help**
- 📖 **Documentation**: Check the [docs/](docs/) directory
- 🐛 **Issues**: Report bugs on [GitHub Issues](https://github.com/samueljai120/Advanced-Calendar/issues)
- 💬 **Discussions**: Join our [GitHub Discussions](https://github.com/samueljai120/Advanced-Calendar/discussions)

### **Common Issues**
- **CORS Errors**: Ensure API base URL is set correctly
- **Database Connection**: Verify DATABASE_URL is properly configured
- **Build Errors**: Check Node.js version compatibility

---

## 🎉 **Acknowledgments**

- **React Team** - For the amazing frontend framework
- **Vercel** - For seamless deployment and hosting
- **Neon** - For serverless PostgreSQL database
- **Open Source Community** - For the incredible tools and libraries

---

**Built with ❤️ for the karaoke community**

*Last updated: September 2024*
