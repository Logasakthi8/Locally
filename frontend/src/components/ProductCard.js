import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(product);

  // Set default variant when component mounts
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      setCurrentProduct({
        ...product,
        price: product.variants[0].price,
        quantity: product.variants[0].quantity
      });
    }
  }, [product]);

  // Handle variant selection
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setCurrentProduct({
      ...product,
      name: variant.name || product.name,
      description: variant.description || product.description,
      price: variant.price,
      quantity: variant.quantity,
      image_url: variant.image_url || product.image_url
    });
  };

  // Add product to wishlist
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
          variant_id: selectedVariant ? selectedVariant.id : null
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
    if (newQty < 1) {
      // If quantity becomes 0, remove from wishlist
      try {
        const response = await fetch(`${config.apiUrl}/wishlist/${product._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setIsLiked(false);
          setQuantity(1);
        }
      } catch (err) {
        console.error('Error removing from wishlist:', err);
      }
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          quantity: newQty,
          variant_id: selectedVariant ? selectedVariant.id : null
        })
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
        src={currentProduct.image_url} 
        alt={currentProduct.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
      />

      <div className="card-info">
        <h3>{currentProduct.name}</h3>
        <p className="description">{currentProduct.description}</p>
        
        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="variant-selector">
            <label>Select Size:</label>
            <div className="variant-options">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  className={`variant-btn ${selectedVariant && selectedVariant.id === variant.id ? 'active' : ''}`}
                  onClick={() => handleVariantChange(variant)}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="price-quantity">
          <span className="price">₹{currentProduct.price}</span>
          {selectedVariant && (
            <span className="variant-quantity">Available: {currentProduct.quantity}</span>
          )}
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
            <span className="quantity-display">{quantity}</span>
            <button onClick={() => updateQuantity(quantity + 1)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
