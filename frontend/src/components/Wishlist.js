import React, { useState, useEffect } from 'react';
import config from '../config';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) return;
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty })
      });

      if (response.ok) {
        setWishlist(prev =>
          prev.map(item =>
            item._id === productId ? { ...item, quantity: newQty } : item
          )
        );
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  if (loading) return <p>Loading wishlist...</p>;

  if (wishlist.length === 0) {
    return <p>Your wishlist is empty.</p>;
  }

  return (
    <div className="wishlist-container">
      <h2>Your Wishlist</h2>
      <ul className="wishlist-list">
        {wishlist.map(item => (
          <li key={item._id} className="wishlist-item">
            <img
              src={item.image_url}
              alt={item.name}
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
            />
            <div>
              <h3>{item.name}</h3>
              <p>₹{item.price}</p>
              <div className="quantity-controls">
                <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>+</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Wishlist;
