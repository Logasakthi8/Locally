import React, { useState } from 'react';
import config from '../config';

function WishlistItem({ product, onRemove, onQuantityChange, isSelected, onToggleSelection, isLocal = false }) {
  // For local items, use product.quantity, for server items use product.quantity
  const [quantity, setQuantity] = useState(product.quantity || product.quantity || 1);
  const [imageError, setImageError] = useState(false);

  // Get the correct product ID (server items have _id, local items have product._id)
  const getProductId = () => {
    return product._id || product.product?._id;
  };

  // Get the correct product name
  const getProductName = () => {
    return product.name || product.product?.name;
  };

  // Get the correct product price
  const getProductPrice = () => {
    return product.price || product.product?.price;
  };

  // Get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return it as is
    if (imagePath.startsWith('http') || imagePath.startsWith('https')) {
      return imagePath;
    }
    
    // If it's a relative path, prepend your base URL
    return `${config.baseUrl || ''}${imagePath}`;
  };

  const getProductImage = () => {
    const imagePath = product.image_url || product.product?.image_url;
    return getImageUrl(imagePath);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    if (onQuantityChange) {
      const productId = getProductId();
      onQuantityChange(productId, newQuantity, isLocal);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const handleRemove = () => {
    const productId = getProductId();
    onRemove(productId, isLocal);
  };

  const handleToggleSelection = () => {
    const productId = getProductId();
    onToggleSelection(productId);
  };

  return (
    <div className={`wishlist-item ${isSelected ? 'selected' : ''}`}>
      <div className="selection-control">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleToggleSelection}
          className="item-checkbox"
        />
      </div>

      <div className="product-info">
        <img 
          src={imageError ? '/images/noimage.png' : (getProductImage() || '/images/placeholder.jpg')} 
          alt={getProductName()}
          className="product-image"
          onError={() => setImageError(true)}
        />
        <div className="product-details">
          <h4 className="product-name">{getProductName()}</h4>
          <p className="product-price">₹{getProductPrice()}</p>
          {isLocal && (
            <span className="local-badge">🔄 Syncing...</span>
          )}
        </div>
      </div>

      <div className="product-controls">
        <div className="quantity-controls">
          <button 
            onClick={decrementQuantity}
            className="quantity-btn minus"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="quantity">{quantity}</span>
          <button 
            onClick={incrementQuantity}
            className="quantity-btn plus"
          >
            +
          </button>
        </div>

        <button 
          onClick={handleRemove}
          className="remove-btn"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default WishlistItem;
