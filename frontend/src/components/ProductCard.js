import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate, onAddToCart, onRequireLogin, shopId }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);

  const whatsappNumber = '9361437687';

  const handleWhatsAppRequest = () => {
    const message = `Hi, I'm interested in ${product.name} (₹${product.price}). Please provide more details.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleLike = async () => {
    // Use onRequireLogin to handle authentication
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
      setIsAdding(true);
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
      setIsAdding(false);
    }
  };

  const handleAddToCart = () => {
    // Use onRequireLogin to handle authentication for cart
    if (onRequireLogin) {
      onRequireLogin(async () => {
        await addToCart();
      });
    } else {
      addToCart();
    }
  };

  const addToCart = async () => {
    try {
      setIsAdding(true);
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
        // Show success message or update cart count
        console.log('Added to cart:', product.name);
      } else {
        if (response.status === 401) {
          setError('Please login to add to cart');
        } else if (response.status === 404) {
          setError('Product not found');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to add to cart');
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = async (delta) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);

    // Only update on server if already in wishlist
    if (isLiked) {
      try {
        await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: newQty }),
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error updating wishlist quantity:', error);
      }
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

        {/* Action Buttons */}
        <div className="product-actions">
          {/* WhatsApp Inquiry Button - Always available */}
          <button
            className="whatsapp-inquiry-btn"
            onClick={handleWhatsAppRequest}
            disabled={product.quantity === 0}
          >
            💬 WhatsApp
          </button>

          {/* Add to Cart Button */}
          <button
            className={`cart-btn ${isInCart ? 'in-cart' : ''} ${product.quantity === 0 ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdding || product.quantity === 0}
          >
            {isAdding ? '...' : isInCart ? '✅ Added' : '🛒 Add to Cart'}
          </button>

          {/* Wishlist Button */}
          <button
            className={`wishlist-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isAdding}
            title={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isLiked ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Quantity Controls - Show for wishlist items */}
        {isLiked && (
          <div className="quantity-control">
            <span className="quantity-label">Qty:</span>
            <button onClick={() => handleQuantityChange(-1)}>-</button>
            <span className="quantity-value">{quantity}</span>
            <button onClick={() => handleQuantityChange(1)}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
