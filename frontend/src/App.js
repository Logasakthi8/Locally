import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Shops from './components/Shops';
import Products from './components/Products';
import Wishlist from './components/Wishlist';
import './App.css';
import config from './config';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔐 Checking user session...');
        const response = await fetch(`${config.apiUrl}/user`, { // ✅ Fixed: added /api/
          method: 'GET',
          credentials: 'include'
        });

        console.log('📡 Session check response status:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User session valid:', userData);
          setUser(userData);
        } else {
          console.log('❌ No valid session found');
          setUser(null);
        }
      } catch (error) {
        console.error('🚨 Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${config.apiUrl}/logout`, { // ✅ Fixed: added /api/
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // Small wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          {/* ✅ If user already logged in, redirect from "/" to "/shops" */}
          <Route
            path="/"
            element={
              user ? <Navigate to="/shops" /> : <Login onLogin={handleLogin} />
            }
          />
          
          {/* ✅ Protect shops, products, wishlist */}
          <Route
            path="/shops"
            element={
              <ProtectedRoute>
                <Shops user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:shopId"
            element={
              <ProtectedRoute>
                <Products user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist user={user} />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
