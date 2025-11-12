import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate, onAddToCart, onRequireLogin, shopId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);

  const handleAddToCart = () => {
    // Add to cart directly without login requirement
    addToCart();
  };

  const addToCart = async () => {
    try {
      setIsAddingToCart(true);
      setError('');

      const response = await fetch(`${config.apiUrl}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          product_id: product._id, 
          quantity: quantity,
          shop_id: shopId 
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsInCart(true);
        onAddToCart && onAddToCart(product);
        console.log('Added to cart:', product.name);
      } else {
        if (response.status === 401) {
          // User not logged in - still add to local cart or show message
          setIsInCart(true);
          onAddToCart && onAddToCart(product);
          console.log('Added to local cart (login required for checkout):', product.name);
        } else if (response.status === 404) {
          setError('Product not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to add to cart');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      // Even if network fails, add to local state
      setIsInCart(true);
      onAddToCart && onAddToCart(product);
      console.log('Added to local cart:', product.name);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleLike = async () => {
    // Wishlist requires login
    if (onRequireLogin) {
      onRequireLogin(async () => {
        await addToWishlist();
      });
    } else {
      await addToWishlist();
    }
  };

  const addToWishlist = async () => {
    try {
      setIsAddingToWishlist(true);
      setError('');

      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          product_id: product._id, 
          quantity: quantity,
          shop_id: shopId 
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsLiked(true);
        onWishlistUpdate && onWishlistUpdate(product);
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
      setIsAddingToWishlist(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);
    
    // If already in cart, update quantity on server (if logged in)
    if (isInCart) {
      updateCartQuantity(newQty);
    }
  };

  const updateCartQuantity = async (newQty) => {
    try {
      await fetch(`${config.apiUrl}/cart/${product._id}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQty }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error updating cart quantity:', error);
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

      <div className="product-image-container">
        <img
          src={product.image_url}
          alt={product.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
          }}
        />
        {/* Product status badges */}
        {product.quantity === 0 && (
          <div className="product-badge out-of-stock">Out of Stock</div>
        )}
        {product.discount && (
          <div className="product-badge discount">-{product.discount}%</div>
        )}
      </div>

      <div className="card-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="description">{product.description}</p>

        <div className="price-quantity-container">
          <div className="price-section">
            <span className="price">₹{product.price}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="original-price">₹{product.original_price}</span>
            )}
          </div>

          {/* Product stock display */}
          {product.quantity !== undefined && (
            <div className="stock-section">
              <span className={`stock-status ${product.quantity === 0 ? 'out-of-stock' : 'in-stock'}`}>
                {product.quantity === 0 ? 'Out of Stock' : `${product.quantity} available`}
              </span>
            </div>
          )}
        </div>

        {/* Quantity Selector - Always visible */}
        <div className="quantity-control">
          <span className="quantity-label">Qty:</span>
          <button 
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="quantity-value">{quantity}</span>
          <button 
            onClick={() => handleQuantityChange(1)}
            disabled={product.quantity && quantity >= product.quantity}
          >
            +
          </button>
        </div>

        {/* Action Buttons */}
        <div className="product-actions">
          {/* Add to Cart Button - No login required */}
          <button
            className={`cart-btn ${isInCart ? 'in-cart' : ''} ${product.quantity === 0 ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.quantity === 0}
          >
            {isAddingToCart ? 'Adding...' : isInCart ? '✅ Added to Cart' : '🛒 Add to Cart'}
          </button>

          {/* Wishlist Button - Requires login */}
          <button
            className={`wishlist-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isAddingToWishlist || product.quantity === 0}
            title={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isAddingToWishlist ? '...' : isLiked ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
