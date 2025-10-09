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
    const checkAuth = async () => {
      try {
        // First try session-based auth
        const sessionResponse = await fetch(`${config.apiUrl}/api/verify-session`, {
          method: 'GET',
          credentials: 'include'
        });

        if (sessionResponse.ok) {
          const data = await sessionResponse.json();
          setUser(data.user);
          setLoading(false);
          return;
        }

        // If session fails, try persistent token for mobile PWA
        const persistentToken = localStorage.getItem('persistent_token');
        if (persistentToken) {
          const tokenResponse = await fetch(`${config.apiUrl}/api/verify-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: persistentToken }),
            credentials: 'include'
          });

          if (tokenResponse.ok) {
            const data = await tokenResponse.json();
            setUser(data.user);
            setLoading(false);
            return;
          } else {
            // Token invalid, remove it
            localStorage.removeItem('persistent_token');
          }
        }

        setUser(null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up periodic auth checks (every hour for mobile)
    const interval = setInterval(() => {
      if (user) {
        checkAuth();
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (userData, persistentToken = null) => {
    setUser(userData);
    
    // Store in localStorage for mobile PWA
    localStorage.setItem('lastLogin', Date.now().toString());
    
    if (persistentToken) {
      localStorage.setItem('persistent_token', persistentToken);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${config.apiUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear all local storage
      localStorage.removeItem('lastLogin');
      localStorage.removeItem('persistent_token');
    }
  };

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

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
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/shops" /> : <Login onLogin={handleLogin} />
            } 
          />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
