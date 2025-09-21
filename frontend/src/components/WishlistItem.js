import React, { useState } from 'react';
import config from '../config';

function WishlistItem({ product, onRemove, onQuantityChange, isSelected, onToggleSelection }) {
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [imageError, setImageError] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) {
      return imagePath;
    }
    return `${config.baseUrl || ''}${imagePath}`;
  };

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
        if (onQuantityChange) {
          onQuantityChange(product._id, newQuantity);
        }
      } else {
        console.error('Failed to update quantity. Status:', response.status);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const incrementQuantity = () => {
    updateQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      updateQuantity(quantity - 1);
    }
  };

  return (
    <div className="wishlist-item">
      <div className="product-selection">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(product._id)}
          className="selection-checkbox"
        />
      </div>

      <div className="product-info">
        <img
          src={imageError ? '/images/noimage.png' : (getImageUrl(product.image) || '/images/placeholder.jpg')}
          alt={product.name}
          className="product-image"
          onError={() => setImageError(true)}
        />
        <div className="product-details">
          <h4 className="product-name">{product.name}</h4>
          <p className="product-price">₹{product.price}</p>
        </div>
      </div>

      <div className="product-controls">
        <div className="quantity-controls">
          <button
            onClick={decrementQuantity}
            className="quantity-btn minus"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="quantity">{quantity}</span>
          <button
            onClick={incrementQuantity}
            className="quantity-btn plus"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(product._id)}
          className="remove-btn"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default WishlistItem;
