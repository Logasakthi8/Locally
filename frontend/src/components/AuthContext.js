// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthContext.js - Add session refresh
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/check-session`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const sessionData = {
            user: data.user,
            timestamp: Date.now()
          };
          localStorage.setItem('userSession', JSON.stringify(sessionData));
          setUser(data.user);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  };

  // Use this in your components when you get 401 errors
  const handleAuthError = async () => {
    console.log('🔄 Attempting to refresh session...');
    const refreshed = await refreshSession();
    if (!refreshed) {
      // If refresh fails, logout completely
      logout();
    }
    return refreshed;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkSession,
    refreshSession: handleAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
