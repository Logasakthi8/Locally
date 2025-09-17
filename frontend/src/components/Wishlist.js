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
      const res = await fetch(`${config.apiUrl}/wishlist`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading wishlist...</p>;
  if (wishlist.length === 0) return <p>Your wishlist is empty!</p>;

  return (
    <div className="wishlist-container">
      {wishlist.map(item => (
        <WishlistItem 
          key={item._id} 
          product={item}
        />
      ))}
    </div>
  );
}

export default Wishlist;
