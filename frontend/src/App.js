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
        
        console.log('Checking session at:', `${config.apiUrl}/check-session`);
        
        const response = await fetch(`${config.apiUrl}/check-session`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Session check response:', data);
          if (data.user) {
            setUser(data.user);
          }
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setError(`Cannot connect to server: ${error.message}. Please make sure the backend is running on ${config.apiUrl}`);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show connection error
  if (error && !user) {
    return (
      <div className="App">
        <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry Connection</button>
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
