import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [loading, setLoading] = useState(false); // ✅ added loading state
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
    // Set up interval to rotate messages every 3 seconds
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => 
        prevIndex === startupMessages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [startupMessages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // ✅ show loading when request starts
    try {
      const response = await fetch(`${config.apiUrl}/login`, {
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
    } finally {
      setLoading(false); // ✅ stop loading after request finishes
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="logo-header">
          <img src="/logo.png" alt="Locally Logo" className="logo" />
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
            disabled={loading} // ✅ disable input while logging in
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Continue"} {/* ✅ dynamic text */}
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
