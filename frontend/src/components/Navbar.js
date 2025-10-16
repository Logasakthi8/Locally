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
        <h1 onClick={() => navigate(user ? '/shops' : '/')} className="logo">Locally</h1>
        <div className="nav-links">
          {user ? (
            <>
              <button onClick={() => navigate('/shops')}>Shops</button>
              <button onClick={() => navigate('/wishlist')}>Cart</button>
              {/* Added Return Products button */}
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
