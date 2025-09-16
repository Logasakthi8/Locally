import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Update price/stock/image/description when variant changes
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]); // default first variant
      setQuantity(1);
    }
  }, [product.variants]);

  const handleVariantChange = (e) => {
    const variant = product.variants.find(v => v.label === e.target.value);
    setSelectedVariant(variant);
    setQuantity(1); // reset quantity when variant changes
  };

  const handleQuantityChange = (newQty) => {
    if (!selectedVariant) return;
    if (newQty < 1) return;
    if (newQty > selectedVariant.quantity) return; // respect stock
    setQuantity(newQty);
  };

  const handleLike = async () => {
    if (!selectedVariant) {
      setError('Please select a variant');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product._id,
          quantity,
          selected_variant: selectedVariant.label
        })
      });

      if (response.ok) {
        setIsLiked(true);
        setQuantity(1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setIsAdding(false);
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
        src={selectedVariant?.image_url || product.image_url}
        alt={product.name}
        onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image'}
      />

      <div className="card-info">
        <h3>{product.name}</h3>
        <p>{selectedVariant?.description || product.description}</p>

        {product.variants && product.variants.length > 0 && (
          <select value={selectedVariant.label} onChange={handleVariantChange}>
            {product.variants.map(v => (
              <option key={v.label} value={v.label}>
                {v.label} - ₹{v.price} (Stock: {v.quantity})
              </option>
            ))}
          </select>
        )}

        <div className="price-quantity">
          <span className="price">₹{selectedVariant?.price || product.price}</span>
          <div className="quantity-controls">
            <button onClick={() => handleQuantityChange(quantity - 1)}>-</button>
            <span>{quantity}</span>
            <button onClick={() => handleQuantityChange(quantity + 1)}>+</button>
          </div>
        </div>

        <button
          className={`like-btn ${isAdding ? 'adding' : ''}`}
          onClick={handleLike}
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : 'Add to Wishlist'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
