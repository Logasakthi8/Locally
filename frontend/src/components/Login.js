import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

// Session timeout - 7 days
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const startupMessages = [
    "🏪 Buy from shops you already trust — now just a click away!",
    "🤝 Support local businesses and help Whitefield grow together.",
    "🚚 Fast, friendly, and convenient doorstep delivery from nearby stores.",
    "💬 Stay connected with your favorite shopkeepers — online and offline.",
    "❤️ Your trusted neighborhood, your trusted marketplace."
  ];

  // Enhanced session check with caching
  const checkExistingSession = useCallback(async () => {
  try {
    // Check localStorage first for faster access
    const cachedSession = localStorage.getItem('userSession');
    if (cachedSession) {
      const sessionData = JSON.parse(cachedSession);
      const isSessionValid = Date.now() - sessionData.timestamp < SESSION_TIMEOUT;
      
      if (isSessionValid) {
        onLogin(sessionData.user);
        navigate('/shops');
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

    const data = await response.json(); // ← Read first
    
    clearTimeout(timeoutId);

    if (response.ok && data.user) {
      // Cache the session
      localStorage.setItem('userSession', JSON.stringify({
        user: data.user,
        timestamp: Date.now()
      }));
      onLogin(data.user);
      navigate('/shops');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Session check failed:', error);
    }
    // Continue to login page if session check fails
  }
}, [onLogin, navigate]);
  // Optimized login handler with request queuing prevention
  // Optimized login handler with request queuing prevention
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (loading || mobile.length !== 10) return;
  
  setLoading(true);
  setStatusMessage('Checking account...');

  try {
    // Single API call for login/registration
    setStatusMessage('Processing...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${config.apiUrl}/auth/mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile }),
      credentials: 'include',
      signal: controller.signal
    });

    // FIRST read the response data
    const data = await response.json();
    
    clearTimeout(timeoutId);

    // THEN check if response is ok
    if (!response.ok) {
      // Use the actual error message from the server
      const errorMessage = data.error || data.message || `Auth failed: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    // Store session with timestamp
    const sessionData = {
      user: data.user,
      timestamp: Date.now(),
      mobile: mobile // Store mobile for quick access
    };
    
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    
    setStatusMessage('Success! Redirecting...');
    onLogin(data.user);
    
    // Immediate navigation without delay for better UX
    navigate('/shops');
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    let userMessage = 'Something went wrong. Please try again.';
    
    if (error.name === 'AbortError') {
      userMessage = 'Request timeout. Please check your connection.';
    } else if (error.message.includes('Invalid mobile number')) {
      userMessage = 'Please enter a valid 10-digit mobile number.';
    } else if (error.message.includes('Mobile number is required')) {
      userMessage = 'Mobile number is required.';
    } else if (error.message.includes('Authentication failed')) {
      userMessage = 'Login failed. Please try again.';
    }
    
    setStatusMessage(userMessage);
    
    // Auto-clear message after 3 seconds
    setTimeout(() => setStatusMessage(''), 3000);
  } finally {
    setLoading(false);
  }
};

  // Mobile input validation
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-form">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-circle">
              {/* Your logo here */}
            </div>
            <h1 className="app-title" style={{ color: '#2196F3', fontWeight: '700' }}>Locally</h1>
            <p className="app-tagline" style={{ color: '#444' }}>Your Local Shopping Companion</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="form-section">
          <h2 className="form-title">Welcome!</h2>
          <p className="form-subtitle">Enter your mobile number to get started</p>
          
          <form onSubmit={handleSubmit} className="mobile-form">
            <div className="input-container">
              <div className="input-prefix">+91</div>
              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={handleMobileChange}
                required
                pattern="[0-9]{10}"
                title="Please enter a 10-digit mobile number"
                disabled={loading}
                className="mobile-input"
                maxLength="10"
                inputMode="numeric"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || mobile.length !== 10}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <div className="button-loading">
                  <span className="spinner"></span>
                  {statusMessage || "Processing..."}
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          {/* Status message */}
          {statusMessage && (
            <div className={`status-message ${loading ? 'status-loading' : ''}`}>
              <div className="status-icon">
                {loading ? '⏳' : statusMessage.includes('Success') ? '✅' : '❌'}
              </div>
              {statusMessage}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="features-header">
            <h3>Why Choose Locally?</h3>
          </div>
          
          <div className="startup-messages">
            <div className="message-container">
              <div className="message-icon">✨</div>
              <p key={currentTextIndex} className="fade-in">
                {startupMessages[currentTextIndex]}
              </p>
            </div>
          </div>

          <div className="static-features">
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <span>Fast Delivery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Trusted Shops</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>Best Prices</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
