import React, { useState } from 'react';

function WishlistItem({ product, onRemove, onQuantityChange, isSelected, onToggleSelection }) {
  const [quantity, setQuantity] = useState(product.quantity || 1);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    onQuantityChange(product._id, newQuantity);
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  return (
    <div className="wishlist-item">
      <div className="product-selection">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(product._id)}
          className="selection-checkbox"
        />
      </div>
      
      <div className="product-info">
        <img 
          src={product.image_url || '/images/placeholder.jpg'} 
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = '/images/noimage.png';
          }}
        />
        <div className="product-details">
          <h4 className="product-name">{product.name}</h4>
          <p className="product-price">₹{product.price}</p>
        </div>
      </div>
      
      <div className="product-controls">
        <div className="quantity-controls">
          <button 
            onClick={decrementQuantity}
            className="quantity-btn minus"
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
          onClick={() => onRemove(product._id)}
          className="remove-btn"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default WishlistItem;
