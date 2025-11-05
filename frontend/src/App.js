import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext'; // Import AuthContext
import Navbar from './components/Navbar';
import Login from './components/Login';
import Shops from './components/Shops';
import Products from './components/Products';
import Wishlist from './components/Wishlist';
import FeedbackSystem from './components/Feedback';
import ReturnPolicy from './components/ReturnPolicy';
import './App.css';

// Main App component wrapped with AuthProvider
function AppContent() {
  const { user, logout, loading } = useAuth();

  // Protected Route component that uses AuthContext
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading">Loading...</div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Public Route component - redirect to shops if already logged in
  const PublicRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading">Loading...</div>
        </div>
      );
    }
    
    if (user) {
      return <Navigate to="/shops" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={logout} />
        <Routes>
          {/* Public route - shows login only if not authenticated */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
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
          
          {/* Return Policy Route - Protected */}
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
        
        {/* Feedback System - Only show when user is logged in */}
        {user && <FeedbackSystem user={user} />}
      </div>
    </Router>
  );
}

// Main App component that provides AuthContext
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
