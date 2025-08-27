import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Shops from './components/Shops';
import Products from './components/Products';
import Wishlist from './components/Wishlist';
import './App.css';
import config from './config';
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (session exists)
    const checkSession = async () => {
      try {
        const response = await fetch('${config.apiUrl}', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkSession();
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <Routes>
          <Route path="/" element={<Login onLogin={setUser} />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/products/:shopId" element={<Products />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
