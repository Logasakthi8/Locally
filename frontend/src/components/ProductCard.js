import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  // Check if product is already in wishlist when component mounts
  useEffect(() => {
    checkIfInWishlist();
  }, [product._id]);

  const checkIfInWishlist = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const wishlistItems = await response.json();
        console.log('Wishlist items:', wishlistItems); // Debug log
        const inWishlist = wishlistItems.find(item => item._id === product._id);
        console.log('Product in wishlist:', inWishlist); // Debug log
        
        if (inWishlist) {
          setIsLiked(true);
          setQuantity(inWishlist.quantity || 1);
        }
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleLike = async () => {
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
          quantity: quantity
        }),
        credentials: 'include'
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (response.ok) {
          setIsLiked(true); // This should make quantity controls visible
          if (onWishlistUpdate) {
            onWishlistUpdate(); // Notify parent component
          }
        } else {
          setError(data.error || 'Failed to add to wishlist');
        }
      } else {
        // Handle non-JSON response
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 200));
        setError('Server error. Please try again later.');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1 || newQuantity > product.quantity) return;
    
    setQuantity(newQuantity);
    
    // Update quantity on server
    updateWishlistQuantity(newQuantity);
  };

  const updateWishlistQuantity = async (newQuantity) => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${product._id}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const clearError = () => {
    setError('');
  };

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
  };

  // Debug log to check state
  console.log('ProductCard state:', { isLiked, quantity, productId: product._id });

  return (
    <div className="product-card">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}
      
      <img 
        src={imageError ? 'https://via.placeholder.com/300x200?text=Product+Image' : product.image_url}
        alt={product.name}
        onError={handleImageError}
        className="product-image"
      />
      
      <div className="card-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        
        <div className="price-quantity">
          <span className="price">₹{product.price}</span>
          {product.quantity && (
            <span className="available-quantity">Available: {product.quantity}</span>
          )}
        </div>
        
        {/* Show quantity controls only after adding to wishlist */}
        {isLiked && product.quantity > 0 && (
          <div className="quantity-controls" style={{border: '2px solid red', padding: '10px'}}>
            <button 
              onClick={decrementQuantity} 
              className="quantity-btn"
            >
              -
            </button>
            <span className="quantity-display">{quantity}</span>
            <button 
              onClick={incrementQuantity} 
              disabled={quantity >= product.quantity}
              className="quantity-btn"
            >
              +
            </button>
          </div>
        )}
        
        {/* Show Add to Wishlist button if not in wishlist */}
        {!isLiked && (
          <button 
            className={`like-btn ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding || product.quantity === 0}
          >
            {isAdding ? 'Adding...' : 
             (product.quantity === 0 ? 'Out of Stock' : 'Add to Wishlist')}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
