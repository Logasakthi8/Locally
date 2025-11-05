import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  // Array of startup messages to rotate through
  const startupMessages = [
    "🏪 Buy from shops you already trust — now just a click away!",
    "🤝 Support local businesses and help Whitefield grow together.",
    "🚚 Fast, friendly, and convenient doorstep delivery from nearby stores.",
    "💬 Stay connected with your favorite shopkeepers — online and offline.",
    "❤️ Your trusted neighborhood, your trusted marketplace."
  ];

  // Enhanced session check with better error handling
  const checkExistingSession = useCallback(async () => {
    try {
      console.log('🔍 Checking for existing session...');
      
      const response = await fetch(`${config.apiUrl}/check-session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Session check response:', data);
        
        if (data.user) {
          console.log('✅ Valid session found, user:', data.user.mobile);
          
          // Store session info
          localStorage.setItem('userSession', JSON.stringify({
            user: data.user,
            timestamp: Date.now(),
            sessionActive: true
          }));

          onLogin(data.user);
          navigate('/shops');
        } else {
          console.log('❌ No active session');
          // Clear any stale localStorage data
          localStorage.removeItem('userSession');
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Clear localStorage on error
      localStorage.removeItem('userSession');
    }
  }, [onLogin, navigate]);

  // Check for existing session on component mount
  useEffect(() => {
    // First check localStorage for quick UX
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        // If session is less than 1 hour old, use it temporarily
        const sessionAge = Date.now() - sessionData.timestamp;
        if (sessionAge < 60 * 60 * 1000) { // 1 hour
          console.log('⚡ Using cached session data');
          onLogin(sessionData.user);
        }
      } catch (e) {
        console.error('Error parsing stored session:', e);
        localStorage.removeItem('userSession');
      }
    }

    // Always verify with server
    checkExistingSession();
  }, [checkExistingSession, onLogin]);

  // Rotating messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === startupMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [startupMessages.length]);

  // Enhanced mobile number validation
  const validateMobile = (number) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    // Validate mobile number
    if (!validateMobile(mobile)) {
      setStatusMessage('Please enter a valid 10-digit mobile number');
      setTimeout(() => setStatusMessage(''), 3000);
      return;
    }

    setLoading(true);
    setStatusMessage('Checking existing account...');

    try {
      // Step 1: Quick check if user exists
      setStatusMessage('Verifying customer account...');

      const checkResponse = await fetch(`${config.apiUrl}/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
        credentials: 'include'
      });

      if (!checkResponse.ok) {
        throw new Error('User check failed');
      }

      const checkData = await checkResponse.json();
      console.log('👤 User check result:', checkData);

      // Step 2: Proceed with login/registration
      let authResponse;
      
      if (checkData.userExists) {
        setStatusMessage('Logging you in...');
        authResponse = await fetch(`${config.apiUrl}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            mobile,
            rememberMe: true // Enable long-term session
          }),
          credentials: 'include'
        });
      } else {
        setStatusMessage('Creating your account...');
        authResponse = await fetch(`${config.apiUrl}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mobile }),
          credentials: 'include'
        });
      }

      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('✅ Authentication successful:', authData);

        // Store session info in localStorage for faster future access
        localStorage.setItem('userSession', JSON.stringify({
          user: authData.user,
          timestamp: Date.now(),
          sessionActive: true
        }));

        setStatusMessage(checkData.userExists ? 'Welcome back!' : 'Account created!');

        // Call the onLogin callback
        onLogin(authData.user);

        // Navigate after a brief delay to show success message
        setTimeout(() => {
          navigate('/shops');
        }, 800);

      } else {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

    } catch (error) {
      console.error('Authentication error:', error);
      setStatusMessage(error.message || 'Something went wrong. Please try again.');
      
      // Clear any potentially corrupted session data
      localStorage.removeItem('userSession');
    } finally {
      setLoading(false);
      // Clear status message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  // Check if mobile is valid for enabling the button
  const isMobileValid = validateMobile(mobile);

  return (
    <div className="login-container">
      {/* Background gradient */}
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
                pattern="[6-9][0-9]{9}"
                title="Please enter a valid 10-digit Indian mobile number"
                disabled={loading}
                className="mobile-input"
                maxLength="10"
                inputMode="numeric"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !isMobileValid}
              className={`submit-btn ${loading ? 'loading' : ''} ${!isMobileValid ? 'disabled' : ''}`}
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

          {/* Enhanced Status message display */}
          {statusMessage && (
            <div className={`status-message ${loading ? 'status-loading' : statusMessage.includes('Welcome') || statusMessage.includes('created') ? 'status-success' : 'status-error'}`}>
              <div className="status-icon">
                {loading ? '⏳' : 
                 statusMessage.includes('Welcome') || statusMessage.includes('created') ? '✅' : '❌'}
              </div>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Session info for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info">
              <small>Session Debug: Check console for details</small>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="features-header">
            <h3>Why Choose Locally?</h3>
          </div>

          {/* Rotating startup messages section */}
          <div className="startup-messages">
            <div className="message-container">
              <div className="message-icon">✨</div>
              <p key={currentTextIndex} className="fade-in">
                {startupMessages[currentTextIndex]}
              </p>
            </div>
          </div>

          {/* Static Features */}
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
