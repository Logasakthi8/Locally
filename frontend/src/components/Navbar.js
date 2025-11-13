import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config'; 

function Navbar({ user, onLogout, onRequireLogin }) {
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
        // Clear all local storage
        localStorage.removeItem('userSession');
        sessionStorage.clear();
        
        // Clear any app state
        onLogout();
        
        // Reset cart count
        setCartCount(0);
        
        // Navigate to shops (public page) instead of login
        navigate('/shops');
        
        console.log('✅ Logout successful');
      } else {
        console.error('❌ Logout failed:', data.error);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API call fails, clear local state
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

  // Handle cart click - navigates to wishlist page (which is now the cart page)
  const handleCartClick = () => {
    if (onRequireLogin) {
      onRequireLogin(() => {
        navigate('/wishlist');
      });
    } else {
      navigate('/wishlist');
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
          <button onClick={() => handleNavClick('/shops')}>
            🏪 Shops
          </button>

          {/* Cart Button - Navigates to wishlist page */}
          <button onClick={handleCartClick} className="cart-button">
            🛒 Cart
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </button>

          {/* Returns - Public page, no login required */}
          <button onClick={() => handleNavClick('/return-policy')}>
            🔄 Return Policy
          </button>

          {/* User-specific links */}
          {user ? (
            <div className="user-info">
              <span className="user-mobile">👤 {user.mobile}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
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
