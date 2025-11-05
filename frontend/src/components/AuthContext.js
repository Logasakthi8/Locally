// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import config from './config';

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

  // Session timeout - 7 days
  const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

  // Check session on app startup
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      
      // Check localStorage first for faster access
      const cachedSession = localStorage.getItem('userSession');
      if (cachedSession) {
        const sessionData = JSON.parse(cachedSession);
        const isSessionValid = Date.now() - sessionData.timestamp < SESSION_TIMEOUT;
        
        if (isSessionValid) {
          setUser(sessionData.user);
          setLoading(false);
          return;
        } else {
          // Clear expired session
          localStorage.removeItem('userSession');
        }
      }

      // If no cached session or expired, check server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.apiUrl}/check-session`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Cache the session
          localStorage.setItem('userSession', JSON.stringify({
            user: data.user,
            timestamp: Date.now()
          }));
          setUser(data.user);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Session check failed:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    const sessionData = {
      user: userData,
      timestamp: Date.now(),
      mobile: userData.mobile
    };
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${config.apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userSession');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
