import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1); // 👈 Track quantity

  const handleLike = async () => {
    try {
      setIsAdding(true);
      setError('');

      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: product._id }),
        credentials: 'include'
      });

      if (response.ok) {
        setIsLiked(true);
        setQuantity(1); // default quantity
      } else {
        if (response.status === 401) {
          setError('Please login to add to wishlist');
        } else if (response.status === 404) {
          setError('Product not found');
        } else {
          try {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to add to wishlist');
          } catch {
            setError('Unexpected error from server');
          }
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  // 👇 Increment quantity
  const incrementQuantity = async () => {
    const newQuantity = quantity + 1;
    await updateQuantity(newQuantity);
  };

  // 👇 Decrement quantity (min 1)
  const decrementQuantity = async () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      await updateQuantity(newQuantity);
    }
  };

  // 👇 Call backend to update wishlist quantity
  const updateQuantity = async (newQuantity) => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: 'include',
      });

      if (response.ok) {
        setQuantity(newQuantity);
      } else {
        console.error('Failed to update quantity:', response.status);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const clearError = () => setError('');

  return (
    <div className="product-card">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <img
        src={product.image_url}
        alt={product.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
      />

      <div className="card-info">
        <h3>{product.name}</h3>
        <p className="description">{product.description}</p>
        <div className="price-quantity">
          <span className="price">₹{product.price}</span>
          <span className="quantity">Qty: {product.quantity}</span>
        </div>

        {!isLiked ? (
          <button
            className={`like-btn ${isLiked ? 'liked' : ''} ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding || isLiked}
          >
            {isAdding ? 'Adding...' : 'Add to Wishlist'}
          </button>
        ) : (
          <div className="quantity-controls">
            <button onClick={decrementQuantity} disabled={quantity <= 1}>-</button>
            <span>{quantity}</span>
            <button onClick={incrementQuantity}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
