import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const whatsappNumber = '9361437687';

  const handleWhatsAppRequest = () => {
    const message = `Hi, I'm interested in ${product.name}. Please provide more details.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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
        body: JSON.stringify({ product_id: product._id, quantity: quantity }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsLiked(true);
        onWishlistUpdate && onWishlistUpdate();
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
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);

    try {
      await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQty }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error updating wishlist quantity:', error);
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

        <div className="price-quantity-container">
          <div className="price-section">
            <span className="price">₹{product.price}</span>
          </div>

          {/* Product quantity display on the right side of price */}
          {product.quantity && (
            <div className="quantity-section">
              <span className="quantity-label">Quantity: </span>
              <span className="quantity-value">{product.quantity}</span>
            </div>
          )}
        </div>

        {/* WhatsApp Inquiry Button */}
        <button
          className="whatsapp-inquiry-btn"
          onClick={handleWhatsAppRequest}
        >
          💬 Inquire via WhatsApp
        </button>

        {/* Show quantity controls only after adding to wishlist */}
        {isLiked ? (
          <div className="quantity-control">
            <button onClick={() => handleQuantityChange(-1)}>-</button>
            <span>{quantity}</span>
            <button onClick={() => handleQuantityChange(1)}>+</button>
          </div>
        ) : (
          <button
            className={`like-btn ${isLiked ? 'liked' : ''} ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Wishlist'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
