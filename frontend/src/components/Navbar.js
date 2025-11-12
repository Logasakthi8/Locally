import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config'; 

function Navbar({ user, onLogout, onRequireLogin, onCartClick }) {
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

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Handle cart click - opens cart sidebar on current page
  const handleCartClick = () => {
    if (onCartClick) {
      // If onCartClick prop is provided, use it to open cart sidebar
      onCartClick();
    } else {
      // Fallback: if no onCartClick handler, use require login and navigate
      if (onRequireLogin) {
        onRequireLogin(() => {
          navigate('/wishlist');
        });
      } else {
        navigate('/wishlist');
      }
    }
    setIsMenuOpen(false);
  };

  // Handle protected navigation (requires login)
  const handleProtectedNavClick = (path) => {
    if (onRequireLogin) {
      onRequireLogin(() => {
        navigate(path);
      });
    } else {
      navigate(path);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo - Always goes to shops (public page) */}
        <img 
          src="/myLogo2.png" 
          alt="Locally" 
          onClick={() => handleNavClick('/shops')} 
          className="logo" 
        />

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          ☰
        </button>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          {/* Always show Shops link - it's public */}
          <button onClick={() => handleNavClick('/shops')}>🏪 Shops</button>

          {/* Cart Button - Opens cart sidebar on current page */}
          <button onClick={handleCartClick} className="cart-button">
            🛒 Cart
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </button>

          <button onClick={() => handleProtectedNavClick('/return-policy')}>
            🔄 Returns
          </button>

          {/* User-specific links */}
          {user ? (
            <div className="user-info">
              <span className="user-mobile">👤 {user.mobile}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <button 
              onClick={() => handleNavClick('/login')} 
              className="login-btn"
            >
              🔑 Login
            </button>
          )}  
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
