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
    "Discover the best local shops near you",
    "Get exclusive deals from your favorite stores",
    "Fast, convenient, and personalized shopping experience",
    "Support local businesses with every purchase",
    "Your one-stop app for all shopping needs",
    "Buy Products from your Trusted shops"
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
      <div className="login-form">
        <div className="logo-header">
          <img src="/images/logo.png" alt="Locally Logo" className="logo" />
          <h2>Locally</h2>
        </div>
        <p>Enter your mobile number to get started</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="tel"
            placeholder="Enter your mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            pattern="[0-9]{10}"
            title="Please enter a 10-digit mobile number"
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
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
            {statusMessage}
          </div>
        )}

        {/* Rotating startup messages section */}
        <div className="startup-messages">
          <p key={currentTextIndex} className="fade-in">
            {startupMessages[currentTextIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
               
export default Login;
