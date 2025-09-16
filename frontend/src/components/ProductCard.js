import React, { useState, useEffect } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [availableStock, setAvailableStock] = useState(product.quantity || 0);

  useEffect(() => {
    if (selectedVariant && product.variants) {
      const variantObj = product.variants.find(v => v.label === selectedVariant);
      if (variantObj) {
        setCurrentPrice(variantObj.price);
        setAvailableStock(variantObj.stock);
        if (quantity > variantObj.stock) setQuantity(variantObj.stock);
      }
    } else {
      setCurrentPrice(product.price);
      setAvailableStock(product.quantity);
    }
  }, [selectedVariant, product]);

  const handleLike = async () => {
    if (!selectedVariant && product.variants && product.variants.length > 0) {
      setError('Please select a variant');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product._id,
          quantity,
          selected_variant: selectedVariant
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
      console.error(err);
      setError('Network error. Please check your connection.');
    } finally {
      setIsAdding(false);
    }
  };

  const updateQuantity = (newQty) => {
    if (newQty < 1 || newQty > availableStock) return;
    setQuantity(newQty);
  };

  const clearError = () => setError('');

  return (
    <div style={styles.card}>
      {error && (
        <div style={styles.error}>
          <span>{error}</span>
          <button onClick={clearError} style={styles.errorBtn}>×</button>
        </div>
      )}

      <img 
        src={product.image_url || 'https://via.placeholder.com/300x200?text=Product'} 
        alt={product.name} 
        style={styles.image}
      />

      <div style={styles.info}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>

        {product.variants && product.variants.length > 0 && (
          <select 
            value={selectedVariant} 
            onChange={(e) => setSelectedVariant(e.target.value)}
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

        <div style={styles.priceQty}>
          <span style={styles.price}>₹{currentPrice}</span>

          <div style={styles.qtyControls}>
            <button 
              onClick={() => updateQuantity(quantity - 1)} 
              style={styles.qtyBtn}
              disabled={quantity <= 1}
            >-</button>
            <span style={styles.qtyText}>{quantity}</span>
            <button 
              onClick={() => updateQuantity(quantity + 1)} 
              style={styles.qtyBtn}
              disabled={quantity >= availableStock}
            >+</button>
          </div>

          <span style={styles.stock}>Stock: {availableStock}</span>
        </div>

        {!isLiked ? (
          <button 
            onClick={handleLike} 
            style={{...styles.likeBtn, opacity: isAdding ? 0.6 : 1}}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Wishlist'}
          </button>
        ) : (
          <div style={styles.addedBadge}>Added to Wishlist ✅</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid #ddd',
    borderRadius: '10px',
    padding: '15px',
    display: 'flex',
    gap: '15px',
    backgroundColor: '#fff',
    marginBottom: '15px'
  },
  image: {
    width: '150px',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '10px'
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  name: { margin: 0, fontSize: '18px' },
  description: { fontSize: '14px', color: '#555' },
  select: { padding: '5px', borderRadius: '5px', border: '1px solid #ccc' },
  priceQty: { display: 'flex', alignItems: 'center', gap: '15px' },
  price: { fontWeight: 'bold', fontSize: '16px' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '5px' },
  qtyBtn: { padding: '5px 10px', borderRadius: '5px', border: '1px solid #ccc', cursor: 'pointer' },
  qtyText: { minWidth: '20px', textAlign: 'center' },
  stock: { fontSize: '12px', color: '#888' },
  likeBtn: { padding: '10px', borderRadius: '5px', backgroundColor: '#1890ff', color: '#fff', cursor: 'pointer', border: 'none' },
  addedBadge: { padding: '10px', color: '#52c41a', fontWeight: 'bold' },
  error: { backgroundColor: '#fff1f0', padding: '5px 10px', borderRadius: '5px', color: '#cf1322', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  errorBtn: { border: 'none', background: 'transparent', cursor: 'pointer', color: '#cf1322', fontWeight: 'bold' }
};

export default ProductCard;
