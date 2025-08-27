import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from './config';

function Login({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      </div>
    </div>
  );
}

export default Login;
