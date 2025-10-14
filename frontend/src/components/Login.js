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
   " 🏪 Buy from shops you already trust — now just a click away!",
   "🤝 Support local businesses and help Whitefield grow together.",
  "🚚 Fast, friendly, and convenient doorstep delivery from nearby stores.",
   "💬 Stay connected with your favorite shopkeepers — online and offline.",
    "❤️ Your trusted neighborhood, your trusted marketplace."
  ];

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiUrl}/check-session`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          onLogin(data.user);
          navigate('/shops');
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }, [onLogin, navigate]);

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
    
    if (loading) return; // Prevent multiple submissions
    
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
      
      // Step 2: Proceed with login based on user existence
      if (checkData.userExists) {
        setStatusMessage('Logging you in...');
        
        const loginResponse = await fetch(`${config.apiUrl}/login`, {
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

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          
          // Store session info in localStorage for faster future access
          localStorage.setItem('userSession', JSON.stringify({
            user: loginData.user,
            timestamp: Date.now()
          }));
          
          setStatusMessage('Welcome back! Redirecting...');
          onLogin(loginData.user);
          
          // Small delay to show success message
          setTimeout(() => {
            navigate('/shops');
          }, 500);
          
        } else {
          throw new Error('Login failed');
        }
      } else {
        // New user flow
        setStatusMessage('Creating your account...');
        
        const registerResponse = await fetch(`${config.apiUrl}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mobile }),
          credentials: 'include'
        });

        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          setStatusMessage('Account created! Redirecting...');
          onLogin(registerData.user);
          
          setTimeout(() => {
            navigate('/shops');
          }, 500);
        } else {
          throw new Error('Registration failed');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div className="login-container">
      {/* Background gradient */}
      <div className="login-background"></div>
      
      <div className="login-form">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-circle">
              <img src="/images/logo.png" alt="Locally Logo" className="logo" />
            </div>
            <h1 className="app-title">Locally</h1>
            <p className="app-tagline">Your Local Shopping Companion</p>
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
                onChange={(e) => setMobile(e.target.value)}
                required
                pattern="[0-9]{10}"
                title="Please enter a 10-digit mobile number"
                disabled={loading}
                className="mobile-input"
                maxLength="10"
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

          {/* Status message display */}
          {statusMessage && (
            <div className={`status-message ${loading ? 'status-loading' : ''}`}>
              <div className="status-icon">
                {loading ? '⏳' : '✅'}
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
