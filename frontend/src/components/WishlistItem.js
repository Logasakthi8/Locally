import React, { useState, useEffect } from 'react';
import config from '../config';

function WishlistItem({ product, onRemove, onQuantityChange }) {
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [selectedVariant, setSelectedVariant] = useState(product.selected_variant || '');
  const [error, setError] = useState('');

  // Update displayed info when variant changes
  const [displayPrice, setDisplayPrice] = useState(product.price);
  const [displayImage, setDisplayImage] = useState(product.image_url);
  const [displayDescription, setDisplayDescription] = useState(product.description);

  useEffect(() => {
    if (selectedVariant && product.variants && product.variants.length > 0) {
      const variantObj = product.variants.find(v => v.label === selectedVariant);
      if (variantObj) {
        setDisplayPrice(variantObj.price);
        setDisplayImage(variantObj.image_url || product.image_url);
        setDisplayDescription(variantObj.description || product.description);
      }
    } else {
      setDisplayPrice(product.price);
      setDisplayImage(product.image_url);
      setDisplayDescription(product.description);
    }
  }, [selectedVariant, product]);

  const handleQuantityChange = async (newQty) => {
    if (newQty < 1) return;
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty, selected_variant: selectedVariant })
      });

      if (response.ok) {
        setQuantity(newQty);
        onQuantityChange(product._id, newQty);
      } else {
        setError('Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Network error. Try again.');
    }
  };

  const clearError = () => setError('');

  return (
    <div className="wishlist-item-card">
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <img 
        src={displayImage} 
        alt={product.name}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image'; }}
      />

      <div className="card-info">
        <h3>{product.name}</h3>
        <p className="description">{displayDescription}</p>

        {/* Variant selector */}
        {product.variants && product.variants.length > 0 && (
          <select 
            value={selectedVariant} 
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            <option value="">-- Select Variant --</option>
            {product.variants.map((v, i) => (
              <option key={i} value={v.label}>
                {v.label} - ₹{v.price} ({v.quantity} in stock)
              </option>
            ))}
          </select>
        )}

        <div className="price-quantity">
          <span className="price">₹{displayPrice}</span>
          <span className="quantity">Available: {selectedVariant 
            ? (product.variants.find(v => v.label === selectedVariant)?.quantity || 0) 
            : product.quantity}</span>
        </div>

        <div className="quantity-controls">
          <button onClick={() => handleQuantityChange(quantity - 1)}>-</button>
          <span>{quantity}</span>
          <button onClick={() => handleQuantityChange(quantity + 1)}>+</button>
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
