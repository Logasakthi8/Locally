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
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Checking session at:', `${config.apiUrl}/check-session`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${config.apiUrl}/check-session`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Session check response:', data);
          if (data.user) {
            setUser(data.user);
          }
        } else {
          console.log('ℹ️ No active session found');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
        
        let errorMessage = 'Cannot connect to server. ';
        
        if (error.name === 'AbortError') {
          errorMessage += 'Request timed out. ';
        }
        
        errorMessage += `Please check if the backend server is running and accessible at ${config.apiUrl}`;
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Test backend connection separately
  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        console.log('🔍 Testing backend connection...');
        const response = await fetch(`${config.apiUrl}/`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Backend is accessible:', data);
        } else {
          console.warn('⚠️ Backend responded with error:', response.status);
        }
      } catch (error) {
        console.error('❌ Backend connection test failed:', error);
      }
    };

    testBackendConnection();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="App">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  // Show connection error
  if (error && !user) {
    return (
      <div className="App">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          maxWidth: '600px',
          margin: '0 auto',
          color: '#d32f2f'
        }}>
          <h3>Connection Issue</h3>
          <p>{error}</p>
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <p><strong>Troubleshooting steps:</strong></p>
            <ul style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>Check if the backend server is running</li>
              <li>Verify the domain api.locallys.in is correctly configured</li>
              <li>Check for SSL certificate issues</li>
              <li>Test network connectivity</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <Routes>
          <Route
            path="/"
            element={
              user ? <Navigate to="/shops" /> : <Login onLogin={setUser} />
            }
          />
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
          <Route
            path="/return-policy"
            element={
              <ProtectedRoute>
                <ReturnPolicy />
              </ProtectedRoute>
            }
          />
        </Routes>

        <FeedbackSystem user={user} />
      </div>
    </Router>
  );
}

export default App;
