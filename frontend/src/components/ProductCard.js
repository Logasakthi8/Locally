import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);

  const whatsappNumber = '9361437687';

  // Check if product is already in wishlist when component mounts
  useEffect(() => {
    checkIfInWishlist();
  }, [product._id]);

  const checkIfInWishlist = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const wishlist = await response.json();
        const productInWishlist = wishlist.find(item => item._id === product._id);
        if (productInWishlist) {
          setIsLiked(true);
          setIsInWishlist(true);
          setQuantity(productInWishlist.quantity || 1);
        }
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleWhatsAppRequest = () => {
    const message = `Hi, I'm interested in ${product.name} (₹${product.price}). Please provide more details.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleLike = async () => {
    try {
      setIsAdding(true);
      setError('');

      console.log('🛒 Adding to wishlist:', product._id, 'Quantity:', quantity);

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

      console.log('📡 Wishlist response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Added to wishlist:', result);
        setIsLiked(true);
        setIsInWishlist(true);
        onWishlistUpdate && onWishlistUpdate();
      } else {
        if (response.status === 401) {
          setError('Please login to add to wishlist');
          console.error('❌ Authentication failed');
        } else if (response.status === 404) {
          setError('Product not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to add to wishlist');
          console.error('❌ Wishlist error:', errorData);
        }
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = async (delta) => {
    if (!isInWishlist) {
      // If not in wishlist yet, just update local state
      const newQty = Math.max(1, quantity + delta);
      setQuantity(newQty);
      return;
    }

    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);

    try {
      console.log('📦 Updating quantity:', product._id, 'to', newQty);
      
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQty }),
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Quantity updated successfully');
        onWishlistUpdate && onWishlistUpdate();
      } else {
        console.error('❌ Failed to update quantity');
      }
    } catch (error) {
      console.error('❌ Error updating wishlist quantity:', error);
    }
  };

  const removeFromWishlist = async () => {
    try {
      console.log('🗑️ Removing from wishlist:', product._id);
      
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Removed from wishlist');
        setIsLiked(false);
        setIsInWishlist(false);
        setQuantity(1);
        onWishlistUpdate && onWishlistUpdate();
      } else {
        console.error('❌ Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
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
        src={product.image_url || 'https://via.placeholder.com/300x200?text=Product+Image'}
        alt={product.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
        className="product-image"
      />

      <div className="card-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="description">{product.description}</p>
        
        <div className="price-quantity-container">
          <div className="price-section">
            <span className="price">₹{product.price}</span>
          </div>
          
          {/* Product stock quantity display */}
          {product.quantity !== undefined && (
            <div className="stock-section">
              <span className="stock-label">In Stock: </span>
              <span className="stock-value">{product.quantity}</span>
            </div>
          )}
        </div>

        {/* WhatsApp Inquiry Button - Always visible */}
        <button
          className="whatsapp-inquiry-btn"
          onClick={handleWhatsAppRequest}
          disabled={isAdding}
        >
          💬 Inquire via WhatsApp
        </button>

        {/* Wishlist Controls */}
        <div className="wishlist-controls">
          {isInWishlist ? (
            <div className="wishlist-added">
              <div className="quantity-control">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >-</button>
                <span className="quantity-display">{quantity}</span>
                <button onClick={() => handleQuantityChange(1)}>+</button>
              </div>
              <button
                className="remove-btn"
                onClick={removeFromWishlist}
                title="Remove from wishlist"
              >
                🗑️ Remove
              </button>
            </div>
          ) : (
            <div className="wishlist-add">
              <div className="quantity-selector">
                <span>Qty: </span>
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                >-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(prev => prev + 1)}>+</button>
              </div>
              <button
                className={`like-btn ${isLiked ? 'liked' : ''} ${isAdding ? 'adding' : ''}`}
                onClick={handleLike}
                disabled={isAdding}
              >
                {isAdding ? 'Adding...' : '❤️ Add to Wishlist'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
