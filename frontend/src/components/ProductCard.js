import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1); // Add quantity state

  const handleLike = async () => {
    try {
      setIsAdding(true);
      setError('');
      
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          product_id: product._id,
          quantity: quantity // Send quantity to backend
        }),
        credentials: 'include'
      });

      // Check if response is successful (status 200-299)
      if (response.ok) {
        setIsLiked(true);
        // Don't automatically reset the liked status
        setIsAdding(false);
      } else {
        // Handle HTTP error statuses
        if (response.status === 401) {
          setError('Please login to add to wishlist');
        } else if (response.status === 404) {
          setError('Product not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to add to wishlist');
        }
        console.error('Failed to add to wishlist. Status:', response.status);
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
      setIsAdding(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  const incrementQuantity = () => {
    if (quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

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
          <span className="quantity">Available: {product.quantity}</span>
        </div>
        
        {/* Quantity adjustment controls */}
        {!isLiked && (
          <div className="quantity-controls">
            <button onClick={decrementQuantity} disabled={quantity <= 1}>-</button>
            <span className="quantity-display">{quantity}</span>
            <button onClick={incrementQuantity} disabled={quantity >= product.quantity}>+</button>
          </div>
        )}
        
        <button 
          className={`like-btn ${isLiked ? 'liked' : ''} ${isAdding ? 'adding' : ''}`}
          onClick={handleLike}
          disabled={isAdding || isLiked || product.quantity === 0}
        >
          {isAdding ? 'Adding...' : 
           (isLiked ? 'Added to Wishlist!' : 
            (product.quantity === 0 ? 'Out of Stock' : 'Add to Wishlist'))}
        </button>
      </div>
    </div>
  );
}
export default ProductCard;
