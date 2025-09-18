import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(product);
  const [wishlistItemId, setWishlistItemId] = useState(null);

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
    
    // Check if any variant of this product is in wishlist
    checkWishlistStatus();
  }, [product]);

  // Check if any variant of this product is in wishlist
  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const wishlistItems = await response.json();
        const item = wishlistItems.find(item => item._id === product._id);
        
        if (item) {
          setIsLiked(true);
          setQuantity(item.quantity || 1);
          setWishlistItemId(item.wishlist_id);
          
          // If the item has a variant, select it
          if (item.variant_id && product.variants) {
            const variant = product.variants.find(v => v.id === item.variant_id);
            if (variant) {
              setSelectedVariant(variant);
              setCurrentProduct({
                ...product,
                price: variant.price,
                quantity: variant.quantity,
                name: variant.name || product.name,
                description: variant.description || product.description,
                image_url: variant.image_url || product.image_url
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking wishlist status:', err);
    }
  };

  // Handle variant selection
  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setCurrentProduct({
      ...product,
      price: variant.price,
      quantity: variant.quantity,
      name: variant.name || product.name,
      description: variant.description || product.description,
      image_url: variant.image_url || product.image_url
    });
    
    // Check if this specific variant is in wishlist
    checkVariantWishlistStatus(variant.id);
  };

  // Check if specific variant is in wishlist
  const checkVariantWishlistStatus = async (variantId) => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const wishlistItems = await response.json();
        const item = wishlistItems.find(item => 
          item._id === product._id && item.variant_id === variantId
        );
        
        if (item) {
          setIsLiked(true);
          setQuantity(item.quantity || 1);
          setWishlistItemId(item.wishlist_id);
        } else {
          setIsLiked(false);
          setQuantity(1);
          setWishlistItemId(null);
        }
      }
    } catch (err) {
      console.error('Error checking variant wishlist status:', err);
    }
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
        // Get the wishlist item ID from response if possible
        const data = await response.json();
        if (data.wishlist_item_id) {
          setWishlistItemId(data.wishlist_item_id);
        }
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
        const response = await fetch(`${config.apiUrl}/wishlist/${wishlistItemId || product._id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variant_id: selectedVariant ? selectedVariant.id : null })
        });

        if (response.ok) {
          setIsLiked(false);
          setQuantity(1);
          setWishlistItemId(null);
        }
      } catch (err) {
        console.error('Error removing from wishlist:', err);
      }
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${wishlistItemId || product._id}/quantity`, {
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
        
        {/* Variant Selector - Dropdown style like Flipkart */}
        {product.variants && product.variants.length > 0 && (
          <div className="variant-selector">
            <label>Select Size:</label>
            <select 
              className="variant-dropdown"
              value={selectedVariant ? selectedVariant.id : ''}
              onChange={(e) => {
                const variant = product.variants.find(v => v.id === e.target.value);
                if (variant) handleVariantChange(variant);
              }}
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} - ₹{variant.price}
                </option>
              ))}
            </select>
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
            <span className="quantity-label">Qty:</span>
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
