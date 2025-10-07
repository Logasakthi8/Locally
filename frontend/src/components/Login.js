import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    // Check if user is already logged in
    // Check authentication on app load
const checkExistingAuth = async () => {
  try {
    const response = await fetch(`${config.apiUrl}/api/verify-session`, {
      method: 'GET',
      credentials: 'include' // Important for sessions
    });

    if (response.ok) {
      const data = await response.json();
      onLogin(data.user);
      navigate('/shops');
    }
  } catch (error) {
    console.error('Session verification failed:', error);
  }
};

    checkExistingAuth();

    // Set up interval to rotate messages every 3 seconds
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === startupMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [startupMessages.length, navigate, onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!mobile || mobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${config.apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store authentication data
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        onLogin(data.user);
        navigate('/shops');
      } else {
        console.error('Login failed:', data.message);
        alert(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
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
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            required
            pattern="[0-9]{10}"
            title="Please enter a 10-digit mobile number"
            disabled={loading}
          />
          <button type="submit" disabled={loading || mobile.length !== 10}>
            {loading ? "Logging in..." : "Continue"}
          </button>
        </form>

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
