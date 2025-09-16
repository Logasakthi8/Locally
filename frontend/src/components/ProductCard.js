import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [inWishlist, setInWishlist] = useState(product.inWishlist || false);
  const [quantity, setQuantity] = useState(product.quantity || 0);

  // Add to wishlist
  const addToWishlist = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: product._id })
      });
      if (response.ok) {
        setInWishlist(true);
        setQuantity(1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update quantity
  const updateQuantity = async (newQty) => {
    if (newQty < 1) return; // prevent 0
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty })
      });
      if (response.ok) {
        setQuantity(newQty);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      {!inWishlist ? (
        <button onClick={addToWishlist} className="primary-btn">
          Add to Wishlist
        </button>
      ) : (
        <div className="quantity-controls">
          <button onClick={() => updateQuantity(quantity - 1)}>-</button>
          <span>{quantity}</span>
          <button onClick={() => updateQuantity(quantity + 1)}>+</button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;
