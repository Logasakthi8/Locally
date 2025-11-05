import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Shops from './components/Shops';
import Products from './components/Products';
import Wishlist from './components/Wishlist';
import FeedbackSystem from './components/Feedback';
import ReturnPolicy from './components/ReturnPolicy';
import './App.css';
import config from './config';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking user session...');
        const response = await fetch(`${config.apiUrl}/check-session`, {
          method: 'GET',
          credentials: 'include'
        });

        console.log('📊 Session check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Session data:', data);
          if (data.user) {
            setUser(data.user);
            // Also store in localStorage for quick access
            localStorage.setItem('userSession', JSON.stringify({
              user: data.user,
              timestamp: Date.now()
            }));
          } else {
            setUser(null);
            localStorage.removeItem('userSession');
          }
        } else {
          console.error('❌ Session check failed');
          setUser(null);
          localStorage.removeItem('userSession');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        setUser(null);
        localStorage.removeItem('userSession');
      } finally {
        setLoading(false);
      }
    };

    // Check localStorage first for faster initial load
    const cachedSession = localStorage.getItem('userSession');
    if (cachedSession) {
      try {
        const sessionData = JSON.parse(cachedSession);
        const isSessionValid = Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000; // 24 hours
        
        if (isSessionValid) {
          setUser(sessionData.user);
          setLoading(false);
          console.log('✅ Using cached session');
          return;
        } else {
          localStorage.removeItem('userSession');
        }
      } catch (e) {
        localStorage.removeItem('userSession');
      }
    }

    checkSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Store in localStorage
    localStorage.setItem('userSession', JSON.stringify({
      user: userData,
      timestamp: Date.now()
    }));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userSession');
    // Optionally call logout API
    fetch(`${config.apiUrl}/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(console.error);
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Public Route component (redirect to shops if already logged in)
  const PublicRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      );
    }
    
    if (user) {
      return <Navigate to="/shops" replace />;
    }
    return children;
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Locally...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            {/* Public route - redirect to shops if already logged in */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login onLogin={handleLogin} />
                </PublicRoute>
              }
            />
            
            {/* Protected routes */}
            <Route
              path="/shops"
              element={
                <ProtectedRoute>
                  <Shops />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:shopId"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            
            {/* Return Policy - Protected since it's in navbar */}
            <Route
              path="/return-policy"
              element={
                <ProtectedRoute>
                  <ReturnPolicy />
                </ProtectedRoute>
              }
            />

            {/* Catch all route - redirect to shops */}
            <Route path="*" element={<Navigate to="/shops" replace />} />
          </Routes>
        </main>
        
        {/* Feedback System - Always visible but pass user prop */}
        <FeedbackSystem user={user} />
      </div>
    </Router>
  );
}

export default App;
