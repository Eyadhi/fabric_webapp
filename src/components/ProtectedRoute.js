import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, validateToken } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Check if user exists and token is valid
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Validate token on each protected route access
  if (!validateToken()) {
    // Token validation will handle redirect, but return navigate as fallback
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
