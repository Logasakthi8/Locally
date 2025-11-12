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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('🔍 Checking user session...');
        const response = await fetch(`${config.apiUrl}/check-session`, {
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

  // Handle actions that require login (checkout, wishlist, etc.)
  const requireLogin = (actionCallback) => {
    if (!user) {
      setPendingAction(() => actionCallback);
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    
    // Execute pending action after login
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    setPendingAction(null);
  };

  // Protected route wrapper for features that require login
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/shops" replace />;
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
        <Navbar 
          user={user} 
          onLogout={() => setUser(null)}
          onRequireLogin={requireLogin}
        />
        
        <Routes>
          {/* ✅ Default route shows shops without login */}
          <Route path="/" element={<Navigate to="/shops" replace />} />
          
          {/* ✅ Public routes - no login required */}
          <Route path="/shops" element={<Shops onRequireLogin={requireLogin} />} />
          <Route 
            path="/products/:shopId" 
            element={<Products onRequireLogin={requireLogin} />} 
          />
          <Route path="/return-policy" element={<ReturnPolicy />} />
          
          {/* ✅ Login page - redirect to shops if already logged in */}
          <Route
            path="/login"
            element={
              user ? <Navigate to="/shops" /> : <Login onLogin={setUser} />
            }
          />

          {/* ✅ Protected routes - require login */}
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
        </Routes>

        {/* ✅ Feedback System */}
        <FeedbackSystem user={user} />

        {/* ✅ Login Modal for checkout and other protected actions */}
        {showLoginModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="close-button" 
                onClick={handleCloseLogin}
              >
                ×
              </button>
              <Login 
                onLogin={handleLoginSuccess}
                onClose={handleCloseLogin}
              />
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
