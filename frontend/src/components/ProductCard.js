import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Handle variant change
  const handleVariantChange = (e) => {
    const variant = product.variants.find(v => v.size === e.target.value);
    setSelectedVariant(variant);
  };

  // Add product with variant to wishlist
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
          variant: selectedVariant,   // ✅ send selected variant
          quantity: 1
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

  // Update quantity
  const updateQuantity = async (newQty) => {
    if (newQty < 1) {
      setIsLiked(false);
      return;
    }
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty })
      });

      if (response.ok) {
        setQuantity(newQty);
      } else {
        console.error('Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  return (
    <div className="product-card">
      {error && <div className="error-message">{error}</div>}

      <img
        src={selectedVariant?.image_url || product.image_url}
        alt={product.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
      />

      <div className="card-info">
        <h3>{product.name} ({selectedVariant?.size})</h3>
        <p className="description">{product.description}</p>
        <div className="price-quantity">
          <span className="price">₹{selectedVariant?.price}</span>
        </div>

        {/* Variant selector */}
        {product.variants && product.variants.length > 1 && (
          <select value={selectedVariant?.size} onChange={handleVariantChange}>
            {product.variants.map(v => (
              <option key={v.size} value={v.size}>
                {v.size} - ₹{v.price}
              </option>
            ))}
          </select>
        )}

        {/* Wishlist / Quantity */}
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
