import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config'; 

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

 const handleLogout = async () => {
  try {
    console.log('🔄 Starting logout...');
    
    const response = await fetch(`${config.apiUrl}/logout`, {
      method: 'POST',
      credentials: 'include', // This is crucial for sending cookies
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
      
      // Force reload to clear any cached state
      window.location.href = '/';
      
      console.log('✅ Logout successful');
    } else {
      console.error('❌ Logout failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Even if API call fails, clear local state
    localStorage.removeItem('userSession');
    onLogout();
    window.location.href = '/';
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
