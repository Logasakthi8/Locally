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
        {/* ✅ Replaced text 'Locally' with logo */}
        <div 
          className="logo" 
          onClick={() => navigate(user ? '/shops' : '/')} 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}
        >
          <img 
            src="/images/locally-logo.png" 
            alt="Locally Logo" 
            style={{
              width: '45px',
              height: '45px',
              objectFit: 'contain',
              backgroundColor: 'white',
              borderRadius: '50%',
              padding: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          />
          <h1 style={{ color: '#2196F3', margin: 0, fontWeight: '700', fontSize: '1.5rem' }}>Locally</h1>
        </div>

        <div className="nav-links">
          {user ? (
            <>
              <button onClick={() => navigate('/shops')}>Shops</button>
              {/* 🗑️ Removed Cart button here */}
              <button onClick={() => navigate('/return-policy')}>Return Products</button>
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
