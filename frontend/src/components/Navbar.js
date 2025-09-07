import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const navigate = useNavigate();

  // Array of startup messages to rotate through
  const startupMessages = [
    "Discover the best local shops near you",
    "Get exclusive deals from your favorite stores",
    "Fast, convenient, and personalized shopping experience",
    "Support local businesses with every purchase",
    "Your one-stop app for all shopping needs",
    "Buy Products from your Trusted  shops"
  ];

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/check-auth`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated && data.user) {
            onLogin(data.user);
            navigate('/shops');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    checkAuthStatus();

    // Set up interval to rotate messages every 3 seconds
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === startupMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [startupMessages.length, navigate, onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        onLogin(data.user);
        navigate('/shops');
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Welcome to ShopApp</h2>
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
          />
          <button type="submit">Continue</button>
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
