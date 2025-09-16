import React, { useState, useEffect } from 'react';

function WishlistItem({ product, onRemove, onQuantityChange, isSelected, onToggleSelection }) {
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [selectedVariant, setSelectedVariant] = useState(product.selected_variant || '');
  const [currentPrice, setCurrentPrice] = useState(product.price);

  // Update price when variant changes
  useEffect(() => {
    if (selectedVariant && product.variants) {
      const variantObj = product.variants.find(v => v.label === selectedVariant);
      setCurrentPrice(variantObj ? variantObj.price : product.price);
    } else {
      setCurrentPrice(product.price);
    }
  }, [selectedVariant, product]);

  // Handle quantity increment/decrement
  const handleQuantityChange = (newQty) => {
    if (newQty < 1) return;
    setQuantity(newQty);
    onQuantityChange(product._id, newQty, selectedVariant);
  };

  const handleVariantChange = (e) => {
    const variant = e.target.value;
    setSelectedVariant(variant);
    // Optionally, reset quantity to 1 when variant changes
    setQuantity(1);
    onQuantityChange(product._id, 1, variant);
  };

  return (
    <div className="wishlist-item">
      <input 
        type="checkbox" 
        checked={isSelected} 
        onChange={() => onToggleSelection(product._id)}
      />

      <img 
        src={product.image_url || 'https://via.placeholder.com/100x100?text=Product'} 
        alt={product.name} 
      />

      <div className="item-info">
        <h4>{product.name}</h4>
        <p className="description">{product.description}</p>

        {/* Variant selector */}
        {product.variants && product.variants.length > 0 && (
          <select value={selectedVariant} onChange={handleVariantChange}>
            <option value="">-- Select Size --</option>
            {product.variants.map((v, i) => (
              <option key={i} value={v.label}>
                {v.label} - ₹{v.price}
              </option>
            ))}
          </select>
        )}

        <div className="price-quantity">
          <span className="price">₹{currentPrice}</span>
          <span className="quantity">
            <button onClick={() => handleQuantityChange(quantity - 1)}>-</button>
            {quantity}
            <button onClick={() => handleQuantityChange(quantity + 1)}>+</button>
          </span>
        </div>
      </div>

      <button 
        className="remove-btn" 
        onClick={() => onRemove(product._id)}
      >
        Remove
      </button>
    </div>
  );
}

export default WishlistItem;
