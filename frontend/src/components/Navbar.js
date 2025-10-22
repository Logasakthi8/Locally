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
        {/* Replace text logo with image logo */}
        <img 
          src="/myLogo1.png" 
          alt="Locally" 
          onClick={() => navigate(user ? '/shops' : '/')} 
          className="logo" 
          style={{cursor: 'pointer', height: '40px'}}
        />
        <div className="nav-links">
          {user ? (
            <>
              <button onClick={() => navigate('/shops')}>Shops</button>
              {/* Replace cart symbol with logo image */}
              <button onClick={() => navigate('/wishlist')} className="cart-button">
                <img 
                  src="/locallyLogo.png" 
                  alt="Cart" 
                  style={{height: '20px', verticalAlign: 'middle'}}
                />
                Cart
              </button>
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
