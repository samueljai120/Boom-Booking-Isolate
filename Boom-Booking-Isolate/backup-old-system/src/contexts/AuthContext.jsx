import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { getApiBaseUrl } from '../utils/apiConfig';
import { isValidToken, clearStoredAuth } from '../utils/authUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      return null;
    }
  });
  const [authRetryCount, setAuthRetryCount] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('🔐 AuthProvider initialized');
    return () => {
      console.log('🔐 AuthProvider unmounted');
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Enhanced token validation using utility function
      const tokenIsValid = isValidToken(token);

      if (tokenIsValid && authRetryCount < 2) { // Reduced retry count
        console.log('🔍 Valid token found, checking session...');
        try {
          // Use authAPI for session check with smart fallback
          const response = await authAPI.getSession();
          
          if (response.success) {
            console.log('✅ Session valid, user authenticated');
            setUser(response.user);
            setAuthRetryCount(0); // Reset retry count on success
          } else {
            console.log('❌ Session invalid, clearing auth');
            // Session invalid, clear auth immediately
            clearStoredAuth();
            setToken(null);
            setUser(null);
            setAuthRetryCount(0);
          }
        } catch (error) {
          console.error('Session check failed:', error);
          
          // Check if it's a token-related error
          if (error.message.includes('Invalid token') || error.message.includes('401')) {
            console.log('❌ Token validation failed, clearing auth immediately');
            clearStoredAuth();
            setToken(null);
            setUser(null);
            setAuthRetryCount(0);
          } else {
            // Increment retry count for network errors
            const newRetryCount = authRetryCount + 1;
            setAuthRetryCount(newRetryCount);
            
            if (newRetryCount >= 2) {
              console.log('❌ Max auth retries reached, clearing all auth data');
              clearStoredAuth();
              setToken(null);
              setUser(null);
              setAuthRetryCount(0);
            } else {
              console.log(`❌ Network error, retry ${newRetryCount}/2`);
            }
          }
        }
      } else {
        console.log('❌ No valid token, skipping session check');
        // No token or invalid token, clear any stored data
        clearStoredAuth();
        setToken(null);
        setUser(null);
        setAuthRetryCount(0);
      }
      setLoading(false);
    };

    initAuth();
  }, [token, authRetryCount]);

  const login = async (credentials) => {
    try {
      // Use the authAPI which has smart fallback to mock data
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { token, user } = response;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed - please try again'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { token, user } = response;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const clearAuth = () => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Logout error - error handling removed for clean version
    } finally {
      clearAuth();
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    clearAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};