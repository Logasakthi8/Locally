import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(''); // ✅ variant state

  // Add product to wishlist
  const handleLike = async () => {
    try {
      if (!selectedVariant) {
        setError('Please select a size/variant');
        return;
      }

      setIsAdding(true);
      setError('');

      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          product_id: product._id, 
          quantity: 1,
          selected_variant: selectedVariant // ✅ send variant
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
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty, selected_variant: selectedVariant })
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
        src={product.image_url} 
        alt={product.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
      />

      <div className="card-info">
        <h3>{product.name}</h3>
        <p className="description">{product.description}</p>

        {/* ✅ Variant selector */}
        {product.variants && product.variants.length > 0 && (
          <select 
            value={selectedVariant} 
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            <option value="">-- Select Size --</option>
            {product.variants.map((v, i) => (
              <option key={i} value={v.label}>
                {v.label} - ₹{v.price}
              </option>
            ))}
          </select>
        )}

        <div className="price-quantity">
          <span className="price">₹{product.price}</span>
          <span className="quantity">Stock: {product.quantity}</span>
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
