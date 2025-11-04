import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config'; 

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // In your Navbar component
const handleLogout = async () => {
  try {
    const response = await fetch(`${config.apiUrl}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Clear local storage
      localStorage.removeItem('userSession');
      // Update app state
      onLogout();
      // Redirect to login
      navigate('/');
    }
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <img 
          src="/myLogo2.png" 
          alt="Locally" 
          onClick={() => handleNavClick(user ? '/shops' : '/')} 
          className="logo" 
        />
        
        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          ☰
        </button>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          {user ? (
            <>
              <button onClick={() => handleNavClick('/shops')}>Shops</button>
              <button onClick={() => handleNavClick('/wishlist')} className="cart-button">
                Cart
              </button>
              <button onClick={() => handleNavClick('/return-policy')}>Return Products</button>
              <div className="user-info">
                <span>👤 {user.mobile}</span>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <button onClick={() => handleNavClick('/')}>Login</button>
          )}  
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
