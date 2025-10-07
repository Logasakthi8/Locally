import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const navigate = useNavigate();

  const startupMessages = [
    "Discover the best local shops near you",
    "Get exclusive deals from your favorite stores",
    "Fast, convenient, and personalized shopping experience",
    "Support local businesses with every purchase",
    "Your one-stop app for all shopping needs",
    "Buy Products from your Trusted shops"
  ];

  useEffect(() => {
    // Check if user is already logged in using session
    const checkExistingAuth = async () => {
      try {
        console.log('Checking authentication...');
        const response = await fetch(`${config.apiUrl}/api/verify-session`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          onLogin(data.user);
          navigate('/shops');
        }
      } catch (error) {
        console.error('Session verification failed:', error);
        setNetworkError(true);
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
    setNetworkError(false);
    
    // Basic validation
    if (!mobile || mobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting login to:', `${config.apiUrl}/api/login`);
      
      const response = await fetch(`${config.apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
        credentials: 'include'
      });

      console.log('Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        onLogin(data.user);
        navigate('/shops');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Login failed:', errorData);
        alert(errorData.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setNetworkError(true);
      alert(`Cannot connect to server. Please check:\n\n1. Backend server is running\n2. Correct API URL: ${config.apiUrl}\n3. Network connection`);
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
        
        {networkError && (
          <div className="network-error">
            <p>⚠️ Cannot connect to server</p>
            <p style={{fontSize: '12px', color: '#666'}}>
              Make sure backend is running at: {config.apiUrl}
            </p>
          </div>
        )}
        
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

        {/* Debug info - remove in production */}
        <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
          API URL: {config.apiUrl}
        </div>

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
