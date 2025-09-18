import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  // ✅ Pick the first variant as default (if variants exist)
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null
  );

  // Handle variant change
  const handleVariantChange = (e) => {
    const chosenSize = e.target.value;
    const variant = product.variants.find(v => v.size === chosenSize);
    setSelectedVariant(variant);
  };

  // Add product + variant to wishlist
  const handleLike = async () => {
    try {
      setIsAdding(true);
      setError('');

      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product._id,
          quantity: 1,
          variant: selectedVariant   // ✅ send variant info
        })
      });

      if (response.ok) {
        setIsLiked(true);
        setQuantity(1);
      } else if (response.status === 401) {
        setError('Please login to add to wishlist');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  // Update quantity in wishlist
  const updateQuantity = async (newQty) => {
    if (newQty < 1) return;
    try {
      const response = await fetch(
        `${config.apiUrl}/wishlist/${product._id}/quantity`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            quantity: newQty,
            variant: selectedVariant   // ✅ update correct variant
          })
        }
      );

      if (response.ok) {
        setQuantity(newQty);
      } else {
        console.error('Failed to update quantity');
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
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <img 
        src={selectedVariant?.image || product.image_url} 
        alt={selectedVariant?.name || product.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
      />

      <div className="card-info">
        <h3>{selectedVariant?.name || product.name}</h3>
        <p className="description">{selectedVariant?.description || product.description}</p>
        <div className="price-quantity">
          <span className="price">₹{selectedVariant?.price || product.price}</span>
          <span className="quantity">Qty: {quantity}</span>
        </div>

        {/* ✅ Size dropdown */}
        {product.variants && product.variants.length > 0 && (
          <div className="variant-selector">
            <label htmlFor={`variant-${product._id}`}>Size: </label>
            <select
              id={`variant-${product._id}`}
              value={selectedVariant?.size}
              onChange={handleVariantChange}
            >
              {product.variants.map(v => (
                <option key={v.size} value={v.size}>
                  {v.size}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isLiked ? (
          <button 
            className={`like-btn ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Wishlist'}
          </button>
        ) : (
          <div className="quantity-controls">
            <button onClick={() => updateQuantity(quantity - 1)}>-</button>
            <span>{quantity}</span>
            <button onClick={() => updateQuantity(quantity + 1)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
