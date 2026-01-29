import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility function to check if token is expired
const isTokenExpired = (tokenExpiry) => {
  if (!tokenExpiry) return false;
  return new Date() > new Date(tokenExpiry);
};

// Utility function to decode JWT and check expiration
const isJWTExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return false; // Assume invalid rather than expired if we can't decode
  }
};

// Function to handle auth errors with specific messages
const handleAuthError = (message) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Only show message if not already on login page
  if (window.location.pathname !== '/login') {
    alert(message);
  }

  window.location.href = '/login';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to clear auth data and redirect to login
  const clearAuthAndRedirect = (message = 'Please log in again.') => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);

    // Only show message if not already on login page
    if (window.location.pathname !== '/login') {
      alert(message);
    }

    window.location.href = '/login';
  };

  // Function to validate token
  const validateToken = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || token === 'undefined' || token === 'null') {
      return false;
    }

    // Check if JWT is expired
    if (isJWTExpired(token)) {
      clearAuthAndRedirect('Token expired. Please log in again.');
      return false;
    }

    // Check custom expiry if available
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.tokenExpiry && isTokenExpired(parsedUser.tokenExpiry)) {
          clearAuthAndRedirect('Token expired. Please log in again.');
          return false;
        }
      } catch (error) {
        clearAuthAndRedirect('Invalid token. Please log in again.');
        return false;
      }
    }

    return true;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && token !== 'undefined' && token !== 'null' && userData) {
      if (validateToken()) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          clearAuthAndRedirect('Invalid token. Please log in again.');
        }
      }
    } else {
      // Clean up invalid tokens
      if (token === 'undefined' || token === 'null') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Set up periodic token validation
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        if (!validateToken()) {
          // Token validation failed during periodic check
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);

      // Handle the ApiResponse wrapper structure
      const responseData = response.data.data || response.data;

      // Handle different possible response structures
      let token, userData;

      if (responseData.token) {
        // If token is directly in responseData
        token = responseData.token;
        userData = {
          username: responseData.username,
          tokenExpiry: responseData.tokenExpiry,
          role: responseData.role || 'user',
          roleId: responseData.roleId || 2
        };
      } else if (responseData.accessToken) {
        // If token is named accessToken
        token = responseData.accessToken;
        userData = { ...responseData };
        delete userData.accessToken;
      } else if (responseData.jwt) {
        // If token is named jwt
        token = responseData.jwt;
        userData = { ...responseData };
        delete userData.jwt;
      } else {
        // If the entire response is the token
        token = responseData;
        userData = {
          username: credentials.username,
          role: 'user',
          roleId: 2
        };
      }

      // Decode JWT to get role information if not provided
      if (!userData.role || !userData.roleId) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userData.roleId = payload.roleId || 2;
          userData.role = payload.roleId === 1 ? 'admin' : 'user';
        } catch (error) {
          // Default to user role if can't decode
          userData.roleId = 2;
          userData.role = 'user';
        }
      }

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => {
    return user && (user.roleId === 1 || user.role === 'admin');
  };

  const isUser = () => {
    return user && (user.roleId === 2 || user.role === 'user');
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    switch (permission) {
      case 'create_role':
      case 'create_shift':
      case 'create_user':
        return isAdmin();
      case 'view_roles':
      case 'view_shifts':
      case 'view_users':
        return true; // Both admin and user can view
      default:
        return true;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    validateToken,
    isAdmin,
    isUser,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};