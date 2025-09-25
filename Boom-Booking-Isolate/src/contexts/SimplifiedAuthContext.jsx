/**
 * Simplified Authentication Context
 * 
 * This replaces the complex authentication system with a clean, straightforward
 * implementation that handles authentication consistently.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../lib/unifiedApiClient.js';
import { isValidToken, clearStoredAuth } from '../utils/authUtils.js';
import { getStorage } from '../utils/testEnvironment.js';
import { QUERY_CONFIGS } from '../config/queryConfig.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    try {
      const storage = getStorage();
      return storage.getItem('authToken');
    } catch (error) {
      console.warn('Error accessing storage:', error);
      return null;
    }
  });

  // Use React Query for session management to prevent excessive API calls
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['userSession'],
    queryFn: async () => {
      if (!token || !isValidToken(token)) {
        throw new Error('No valid token');
      }
      return await authAPI.getSession();
    },
    ...QUERY_CONFIGS.userSession,
    enabled: !!token && isValidToken(token),
    retry: false, // Don't retry auth failures
    onError: (error) => {
      // Session error logging is now filtered in main.jsx
      console.error('Session check failed:', error);
      clearStoredAuth();
      setToken(null);
      setUser(null);
    },
    onSuccess: (data) => {
      if (data.success) {
        // Session success logging is now filtered in main.jsx
        console.log('✅ Session valid, user authenticated');
        setUser(data.user);
      } else {
        // Session failure logging is now filtered in main.jsx
        console.log('❌ Session invalid, clearing auth');
        clearStoredAuth();
        setToken(null);
        setUser(null);
      }
    },
  });

  // Update loading state based on session query
  useEffect(() => {
    if (!token || !isValidToken(token)) {
      setLoading(false);
      setUser(null);
    } else {
      setLoading(sessionLoading);
    }
  }, [token, sessionLoading]);

  const login = async (credentials) => {
    try {
      // Login logging is now filtered in main.jsx
      console.log('🔐 Attempting login...');
      
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        // Login API returns {success: true, token: "...", user: {...}}
        const { token: newToken, user: userData } = response;
        
        // Store authentication data
        const storage = getStorage();
        storage.setItem('authToken', newToken);
        storage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(newToken);
        setUser(userData);
        
        // Login success logging is now filtered in main.jsx
        console.log('✅ Login successful');
        return { success: true };
      } else {
        // Login failure logging is now filtered in main.jsx
        console.log('❌ Login failed:', response.error);
        return {
          success: false,
          error: response.error || 'Login failed'
        };
      }
    } catch (error) {
      // Login error logging is now filtered in main.jsx
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed - please try again'
      };
    }
  };

  const register = async (userData) => {
    try {
      // Registration logging is now filtered in main.jsx
      console.log('📝 Attempting registration...');
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Register API returns {success: true, token: "...", user: {...}}
        const { token: newToken, user: userInfo } = response;
        
        // Store authentication data
        const storage = getStorage();
        storage.setItem('authToken', newToken);
        storage.setItem('user', JSON.stringify(userInfo));
        
        // Update state
        setToken(newToken);
        setUser(userInfo);
        
        // Registration success logging is now filtered in main.jsx
        console.log('✅ Registration successful');
        return { success: true };
      } else {
        // Registration failure logging is now filtered in main.jsx
        console.log('❌ Registration failed:', response.error);
        return {
          success: false,
          error: response.error || 'Registration failed'
        };
      }
    } catch (error) {
      // Registration error logging is now filtered in main.jsx
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed - please try again'
      };
    }
  };

  const logout = async () => {
    try {
      // Logout logging is now filtered in main.jsx
      console.log('🚪 Logging out...');
      
      // Call logout API
      await authAPI.logout();
    } catch (error) {
      // Logout warning logging is now filtered in main.jsx
      console.warn('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local authentication data
      clearStoredAuth();
      setToken(null);
      setUser(null);
      // Logout completion logging is now filtered in main.jsx
      console.log('✅ Logout completed');
    }
  };

  const clearAuth = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  // Demo login for easy testing
  const demoLogin = async () => {
    return login({
      email: 'demo@example.com',
      password: 'demo123'
    });
  };

  const value = {
    // State
    user,
    token,
    loading,
    isAuthenticated: !!user,
    
    // Actions
    login,
    register,
    logout,
    clearAuth,
    demoLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
