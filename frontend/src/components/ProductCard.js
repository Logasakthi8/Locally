// src/components/ProductCard.jsx
import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const getId = () => product._id || product.id || (product._id && product._id.$oid) || null;
  const getImage = (p) => p?.image_url || p?.image || p?.imageUrl || '';
  const getVariants = () => product?.variants || [];

  // UI state
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  // selectedVariant is an object (e.g. { label: "500g", price: 90, image: "..."} )
  const [selectedVariant, setSelectedVariant] = useState(getVariants()?.[0] || null);

  // If product changes (loaded async), reset default variant
  useEffect(() => {
    const variants = getVariants();
    setSelectedVariant(variants && variants.length ? variants[0] : null);
  }, [product]);

  // helper to normalize label (support label or size keys)
  const getVariantLabel = (v) => (v?.label ?? v?.size ?? v?.name ?? '');

  const handleVariantChange = (e) => {
    const chosenLabel = e.target.value;
    const v = getVariants().find(item => String(getVariantLabel(item)) === String(chosenLabel));
    setSelectedVariant(v || null);
  };

  const clearError = () => setError('');

  const productId = getId();

  // Add product + variant to wishlist
  const handleLike = async () => {
    if (!productId) {
      setError('Product id missing');
      return;
    }

    try {
      setIsAdding(true);
      setError('');

      const body = {
        product_id: productId,
        quantity: 1,
        variant: selectedVariant || null
      };

      const res = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsLiked(true);
        setQuantity(1);
      } else if (res.status === 401) {
        setError('Please login to add to wishlist');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to add to wishlist');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Check console.');
    } finally {
      setIsAdding(false);
    }
  };

  // Update quantity (updates the wishlist entry)
  const updateQuantity = async (newQty) => {
    if (newQty < 1) return;
    try {
      const payload = { quantity: newQty };
      // if variant exists, send its label so backend updates the correct wishlist entry
      if (selectedVariant) payload.variant = selectedVariant;

      const res = await fetch(`${config.apiUrl}/wishlist/${productId}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) setQuantity(newQty);
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Network error.');
    }
  };

  // Render
  const imageSrc = selectedVariant?.image || getImage(product);
  const title = selectedVariant?.name || selectedVariant?.label || product?.name;
  const description = selectedVariant?.description || product?.description || '';
  const price = selectedVariant?.price ?? product?.price ?? '—';

  return (
    <div className="product-card">
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <div className="card-media">
        <img
          src={imageSrc || 'https://via.placeholder.com/300x200?text=Product+Image'}
          alt={title || 'product'}
          onError={(e) => (e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image')}
        />
      </div>

      <div className="card-info">
        <h3 className="product-title">{title}</h3>
        <p className="description">{description}</p>

        <div className="price-row">
          <div className="price">₹{price}</div>
          <div className="stock">Stock: {product.quantity ?? '—'}</div>
        </div>

        {/* Variant selector */}
        {getVariants() && getVariants().length > 0 && (
          <div className="variant-selector">
            <label htmlFor={`variant-${productId}`}>Size</label>
            <select
              id={`variant-${productId}`}
              value={selectedVariant ? String(getVariantLabel(selectedVariant)) : ''}
              onChange={handleVariantChange}
            >
              {getVariants().map((v, idx) => {
                const label = getVariantLabel(v);
                return (
                  <option key={idx} value={label}>
                    {label} {v.price ? `- ₹${v.price}` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* wishlist controls */}
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
