import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initClientLogReporter } from './utils/logReporter'

// Initialize log reporter only in development
initClientLogReporter({ enabled: import.meta.env.DEV })

// Suppress React DevTools warning and filter console noise
// Apply filtering in both development and production for cleaner demo experience
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Filter out demo-specific and debugging console logs
console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string') {
    // Filter out React DevTools warning
    if (args[0].includes('Download the React DevTools')) {
      return;
    }
    // Filter out demo-specific logs
    if (args[0].includes('🔐 Attempting login') || 
        args[0].includes('✅ Login successful') ||
        args[0].includes('❌ Login failed') ||
        args[0].includes('📝 Attempting registration') ||
        args[0].includes('✅ Registration successful') ||
        args[0].includes('❌ Registration failed') ||
        args[0].includes('🚪 Logging out') ||
        args[0].includes('✅ Logout completed') ||
        args[0].includes('✅ Session valid') ||
        args[0].includes('❌ Session invalid') ||
        args[0].includes('🌐 API Request:') ||
        args[0].includes('🎯 Using mock API') ||
        args[0].includes('🔍 API Client -')) {
      return;
    }
  }
  originalConsoleLog.apply(console, args);
};

// Filter out Chrome extension errors and demo-specific errors
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
      (args[0].includes('chrome-extension://') || 
       args[0].includes('net::ERR_FILE_NOT_FOUND') ||
       args[0].includes('🌐 API Error:') ||
       args[0].includes('Login error:') ||
       args[0].includes('Registration error:') ||
       args[0].includes('Session check failed:'))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)