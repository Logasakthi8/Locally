import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [wishlistQty, setWishlistQty] = useState(1); // ✅ track wishlist quantity

  const handleLike = async () => {
    try {
      setIsAdding(true);
      setError('');

      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: product._id, quantity: 1 }), // ✅ send initial quantity
        credentials: 'include'
      });

      if (response.ok) {
        setIsLiked(true);
        setWishlistQty(1);
      } else {
        if (response.status === 401) {
          setError('Please login to add to wishlist');
        } else if (response.status === 404) {
          setError('Product not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  // ✅ update quantity in wishlist
  const updateWishlistQty = async (newQty) => {
    if (newQty < 1) return; // don’t allow 0

    try {
      setIsAdding(true);
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'PUT', // ✅ use PUT for updating
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product._id, quantity: newQty }),
        credentials: 'include'
      });

      if (response.ok) {
        setWishlistQty(newQty);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  const clearError = () => {
    setError('');
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
          <span className="quantity">Qty: {product.quantity}</span>
        </div>

        {!isLiked ? (
          <button
            className={`like-btn ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Wishlist'}
          </button>
        ) : (
          <div className="wishlist-qty-controls">
            <button
              onClick={() => updateWishlistQty(wishlistQty - 1)}
              disabled={isAdding}
            >
              –
            </button>
            <span>{wishlistQty}</span>
            <button
              onClick={() => updateWishlistQty(wishlistQty + 1)}
              disabled={isAdding}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
