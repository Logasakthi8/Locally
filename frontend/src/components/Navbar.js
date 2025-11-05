import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
 

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link to="/shops" className="nav-logo">
          🛍️ Locally
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          <Link to="/shops" className="nav-link">
            Shops
          </Link>
          <Link to="/wishlist" className="nav-link">
            Wishlist
          </Link>
          <Link to="/return-policy" className="nav-link">
            Return Policy
          </Link>
        </div>

        {/* User Section */}
        <div className="nav-user">
          {user ? (
            <div className="user-section">
              <span className="user-mobile">📱 {user.mobile}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/" className="login-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
