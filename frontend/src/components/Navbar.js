import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import config from '../config'; 

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count when user is logged in
  useEffect(() => {
    if (user) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/cart/count`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔄 Starting logout...');
      
      const response = await fetch(`${config.apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📋 Logout response:', data);

      if (data.success) {
        localStorage.removeItem('userSession');
        sessionStorage.clear();
        onLogout();
        setCartCount(0);
        navigate('/shops');
        console.log('✅ Logout successful');
      } else {
        console.error('❌ Logout failed:', data.error);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      localStorage.removeItem('userSession');
      onLogout();
      setCartCount(0);
      navigate('/shops');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link to="/shops" className="nav-logo">
          <img 
            src="/myLogo2.png" 
            alt="Locally" 
            className="logo" 
          />
        </Link>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          ☰
        </button>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          {/* Navigation Links using Link for reliable navigation */}
          <Link to="/shops" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            🏪 Shops
          </Link>
          
          <Link to="/wishlist" className="nav-link cart-button" onClick={() => setIsMenuOpen(false)}>
            🛒 Cart
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>
          
          <Link to="/return-policy" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            🔄 Return Policy
          </Link>

          {/* User Section */}
          <div className="nav-user">
            {user ? (
              <div className="user-section">
                <span className="user-mobile">👤 {user.mobile}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="login-link" onClick={() => setIsMenuOpen(false)}>
                🔑 Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
