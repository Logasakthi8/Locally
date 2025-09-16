import React, { useState, useEffect } from 'react';
import WishlistItem from './WishlistItem';
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
      const res = await fetch(`${config.apiUrl}/wishlist`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      const res = await fetch(`${config.apiUrl}/wishlist/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (res.ok) {
        setWishlist(prev => prev.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = (id, newQty) => {
    setWishlist(prev =>
      prev.map(item => item._id === id ? { ...item, quantity: newQty } : item)
    );
  };

  if (loading) return <p>Loading wishlist...</p>;
  if (wishlist.length === 0) return <p>Your wishlist is empty!</p>;

  return (
    <div className="wishlist-container">
      {wishlist.map(product => (
        <WishlistItem 
          key={product._id} 
          product={product} 
          onRemove={removeItem}
          onQuantityChange={updateQuantity}
        />
      ))}
    </div>
  );
}

export default Wishlist;
