import React, { useState } from 'react';

function WishlistItem({ product, onRemove, onQuantityChange, isSelected, onToggleSelection }) {
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(product._id);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleQuantityInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      handleQuantityChange(value);
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <div className={`wishlist-item ${isRemoving ? 'removing' : ''}`}>
      <div className="product-selection">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(product._id)}
          className="selection-checkbox"
          aria-label={`Select ${product.name}`}
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
          loading="lazy"
        />
        <div className="product-details">
          <h4 className="product-name">{product.name}</h4>
          <p className="product-description">{product.description}</p>
          <p className="product-price">₹{product.price} each</p>
          <p className="product-total-price">Total: ₹{totalPrice}</p>
        </div>
      </div>
      
      <div className="product-controls">
        <div className="quantity-section">
          <label className="quantity-label">Quantity:</label>
          <div className="quantity-controls">
            <button 
              onClick={decrementQuantity}
              className="quantity-btn minus"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityInputChange}
              min="1"
              className="quantity-input"
              aria-label="Quantity"
            />
            <button 
              onClick={incrementQuantity}
              className="quantity-btn plus"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleRemove}
          className="remove-btn"
          disabled={isRemoving}
          aria-label="Remove from wishlist"
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </div>

      {/* Stock availability indicator */}
      {product.quantity !== undefined && (
        <div className="stock-info">
          {product.quantity > 0 ? (
            <span className="in-stock">In stock ({product.quantity} available)</span>
          ) : (
            <span className="out-of-stock">Out of stock</span>
          )}
        </div>
      )}
    </div>
  );
}

export default WishlistItem;
