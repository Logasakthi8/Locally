import React, { useState, useEffect } from 'react';

function WishlistItem({ product, onRemove, onQuantityChange, isSelected, onToggleSelection }) {
  const [selectedVariant, setSelectedVariant] = useState(product.selected_variant || '');
  const [quantity, setQuantity] = useState(product.quantity || 1);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [availableStock, setAvailableStock] = useState(product.quantity || 0);

  // Update price and stock when variant changes
  useEffect(() => {
    if (selectedVariant && product.variants) {
      const variantObj = product.variants.find(v => v.label === selectedVariant);
      if (variantObj) {
        setCurrentPrice(variantObj.price);
        setAvailableStock(variantObj.stock);
        // Reset quantity if it exceeds new stock
        if (quantity > variantObj.stock) {
          setQuantity(variantObj.stock);
          onQuantityChange(product._id, variantObj.stock, selectedVariant);
        }
      }
    } else {
      setCurrentPrice(product.price);
      setAvailableStock(product.quantity);
    }
  }, [selectedVariant, product]);

  const handleQuantityChange = (newQty) => {
    if (newQty < 1) return;
    if (newQty > availableStock) return; // Limit to stock
    setQuantity(newQty);
    onQuantityChange(product._id, newQty, selectedVariant);
  };

  const handleVariantChange = (e) => {
    const variant = e.target.value;
    setSelectedVariant(variant);
    // Reset quantity to 1 when variant changes
    setQuantity(1);
    onQuantityChange(product._id, 1, variant);
  };

  return (
    <div className="wishlist-item" style={styles.container}>
      <input 
        type="checkbox" 
        checked={isSelected} 
        onChange={() => onToggleSelection(product._id)}
        style={styles.checkbox}
      />

      <img 
        src={product.image_url || 'https://via.placeholder.com/100x100?text=Product'} 
        alt={product.name} 
        style={styles.image}
      />

      <div style={styles.info}>
        <h4 style={styles.name}>{product.name}</h4>
        <p style={styles.description}>{product.description}</p>

        {product.variants && product.variants.length > 0 && (
          <select 
            value={selectedVariant} 
            onChange={handleVariantChange} 
            style={styles.select}
          >
            <option value="">-- Select Variant --</option>
            {product.variants.map((v, i) => (
              <option key={i} value={v.label}>
                {v.label} - ₹{v.price} ({v.stock} in stock)
              </option>
            ))}
          </select>
        )}

        <div style={styles.priceQuantity}>
          <span style={styles.price}>₹{currentPrice}</span>

          <div style={styles.quantityControls}>
            <button 
              onClick={() => handleQuantityChange(quantity - 1)} 
              style={styles.qtyBtn}
              disabled={quantity <= 1}
            >-</button>
            <span style={styles.qtyText}>{quantity}</span>
            <button 
              onClick={() => handleQuantityChange(quantity + 1)} 
              style={styles.qtyBtn}
              disabled={quantity >= availableStock}
            >+</button>
          </div>

          <span style={styles.stock}>Stock: {availableStock}</span>
        </div>
      </div>

      <button 
        style={styles.removeBtn} 
        onClick={() => onRemove(product._id)}
      >
        Remove
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #ddd',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    gap: '10px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
  },
  image: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '8px'
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  name: {
    margin: 0,
    fontSize: '16px'
  },
  description: {
    margin: 0,
    fontSize: '14px',
    color: '#555'
  },
  select: {
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    width: 'fit-content',
    marginTop: '5px'
  },
  priceQuantity: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginTop: '5px'
  },
  price: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
  qtyBtn: {
    padding: '5px 10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer'
  },
  qtyText: {
    minWidth: '20px',
    textAlign: 'center'
  },
  stock: {
    fontSize: '12px',
    color: '#888'
  },
  removeBtn: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#ff4d4f',
    color: '#fff',
    cursor: 'pointer'
  }
};

export default WishlistItem;
