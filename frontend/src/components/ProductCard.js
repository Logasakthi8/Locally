import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentQuantity, setCurrentQuantity] = useState(1); // Track the current quantity in wishlist

  // Check if product is already in wishlist when component mounts
  useEffect(() => {
    checkIfInWishlist();
  }, [product._id]);

  const checkIfInWishlist = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const wishlistItems = await response.json();
        const inWishlist = wishlistItems.find(item => item._id === product._id);
        
        if (inWishlist) {
          setIsLiked(true);
          setQuantity(inWishlist.quantity || 1);
          setCurrentQuantity(inWishlist.quantity || 1);
        }
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

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
        credentials: 'include',
      });

      if (response.ok) {
        setIsLiked(true);
        setCurrentQuantity(quantity);
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

  const handleQuantityChange = async (delta) => {
    const newQty = Math.max(1, currentQuantity + delta);
    setCurrentQuantity(newQty);

    try {
      // Use the correct endpoint from your backend
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQty }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to update quantity');
        // Revert if update fails
        setCurrentQuantity(currentQuantity);
      }
    } catch (error) {
      console.error('Error updating wishlist quantity:', error);
      // Revert if update fails
      setCurrentQuantity(currentQuantity);
    }
  };

  const clearError = () => {
    setError('');
  };

  return (
    <div className="product-card">
      {error && (
        <div className="error-message">
          <span>{error}</span>
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
          {product.quantity && (
            <span className="available">Available: {product.quantity}</span>
          )}
        </div>

        {/* Quantity selection before adding to wishlist */}
        {!isLiked && (
          <div className="quantity-selector">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span>{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(product.quantity || 10, quantity + 1))}
              disabled={quantity >= (product.quantity || 10)}
            >
              +
            </button>
          </div>
        )}

        {!isLiked ? (
          <button
            className={`like-btn ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding || product.quantity === 0}
          >
            {isAdding ? 'Adding...' : 
             (product.quantity === 0 ? 'Out of Stock' : 'Add to Wishlist')}
          </button>
        ) : (
          <div className="quantity-control">
            <button 
              onClick={() => handleQuantityChange(-1)}
              disabled={currentQuantity <= 1}
            >
              -
            </button>
            <span>{currentQuantity}</span>
            <button 
              onClick={() => handleQuantityChange(1)}
              disabled={currentQuantity >= (product.quantity || 10)}
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
