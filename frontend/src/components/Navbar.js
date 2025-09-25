import React from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config'; 

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${config.apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      onLogout();
      navigate("/"); // redirect to login
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="logo-container" onClick={() => navigate(user ? '/shops' : '/')}>
          <img src="/logo1.png" alt="Locally Logo" className="nav-logo-big" />
        </div>

        {/* Links */}
        <div className="nav-links">
          {user ? (
            <>
              <button onClick={() => navigate('/shops')}>Shops</button>
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
