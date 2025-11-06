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
        const response = await fetch(`${config.apiUrl}/check-session`, { // ✅ Fixed endpoint
          credentials: 'include'
        });

        console.log('📡 Session check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Session active:', data.user ? 'User found' : 'No user');
          setUser(data.user);
        } else {
          console.log('❌ Session check failed');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Small wrapper for protected routes
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Show loading spinner while checking session
  if (loading) {
    return (
      <div className="loading-spinner">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <Routes>
          {/* ✅ If user already logged in, redirect from "/" to "/shops" */}
          <Route
            path="/"
            element={
              user ? <Navigate to="/shops" /> : <Login onLogin={setUser} />
            }
          />

          {/* ✅ Protect shops, products, wishlist */}
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
          
          {/* ✅ Add Return Policy Route - Protected since it's in navbar */}
          <Route
            path="/return-policy"
            element={
              <ProtectedRoute>
                <ReturnPolicy />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* ✅ ADD FEEDBACK SYSTEM HERE - Outside Routes but inside Router */}
        <FeedbackSystem user={user} />
      </div>
    </Router>
  );
}

export default App;
