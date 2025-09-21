import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

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
          quantity: quantity
        }),
        credentials: 'include'
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (response.ok) {
          setIsLiked(true);
          setIsAdding(false);
        } else {
          setError(data.error || 'Failed to add to wishlist');
          setIsAdding(false);
        }
      } else {
        // Handle non-JSON response
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 200));
        setError('Server error. Please try again later.');
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

  // Handle image errors gracefully
  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
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
        src={imageError ? 'https://via.placeholder.com/300x200?text=Product+Image' : product.image_url}
        alt={product.name}
        onError={handleImageError}
        className="product-image"
      />
      
      <div className="card-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        
        <div className="price-quantity">
          <span className="price">₹{product.price}</span>
          {product.quantity && (
            <span className="available-quantity">Available: {product.quantity}</span>
          )}
        </div>
        
        {/* Quantity controls - only show if product is available */}
        {product.quantity > 0 && !isLiked && (
          <div className="quantity-controls">
            <button 
              onClick={decrementQuantity} 
              disabled={quantity <= 1}
              className="quantity-btn"
            >
              -
            </button>
            <span className="quantity-display">{quantity}</span>
            <button 
              onClick={incrementQuantity} 
              disabled={quantity >= product.quantity}
              className="quantity-btn"
            >
              +
            </button>
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
