// Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import config from '../config';

function Login() {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();

  const startupMessages = [
    "🏪 Buy from shops you already trust — now just a click away!",
    "🤝 Support local businesses and help Whitefield grow together.",
    "🚚 Fast, friendly, and convenient doorstep delivery from nearby stores.",
    "💬 Stay connected with your favorite shopkeepers — online and offline.",
    "❤️ Your trusted neighborhood, your trusted marketplace."
  ];

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/shops');
    }
  }, [user, authLoading, navigate]);

  // Rotating messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === startupMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [startupMessages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading || mobile.length !== 10) return;
    
    setLoading(true);
    setStatusMessage('Checking account...');

    try {
      setStatusMessage('Processing...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${config.apiUrl}/auth/mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
      }

      const data = await response.json();
      
      setStatusMessage('Success! Redirecting...');
      login(data.user); // Use context login
      navigate('/shops');
      
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error.name === 'AbortError') {
        setStatusMessage('Request timeout. Please check your connection.');
      } else {
        setStatusMessage('Something went wrong. Please try again.');
      }
      
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  if (authLoading) {
    return (
      <div className="login-container">
        <div className="loading">Checking authentication...</div>
      </div>
    );
  }

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
