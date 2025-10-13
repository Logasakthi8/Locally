import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Shops from './components/Shops';
import Products from './components/Products';
import Wishlist from './components/Wishlist';
import FeedbackSystem from './components/FeedbackSystem'; // Add this import
import './App.css';
import config from './config';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/user`, {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking session:', error);
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
        </Routes>
        
        {/* ✅ ADD FEEDBACK SYSTEM HERE - Outside Routes but inside Router */}
        <FeedbackSystem />
      </div>
    </Router>
  );
}

export default App;
