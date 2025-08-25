import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 onClick={() => navigate(user ? '/shops' : '/')} className="logo">Locally</h1>
        <div className="nav-links">
          {user ? (
            <>
              <button onClick={() => navigate('/shops')}>Shops</button>
              <button onClick={() => navigate('/wishlist')}>Cart</button>
              <div className="user-info">
                <span>👤 {user.mobile}</span>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <button onClick={() => navigate('/')}>Login</button>
          )}  
        </div>
      </div>
    </nav>
  );
}

export default Navbar;