import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleLike = async () => {
    try {
      setIsAdding(true);
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: product._id }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsLiked(true);
        // Show success message for 2 seconds
        setTimeout(() => {
          setIsLiked(false);
          setIsAdding(false);
        }, 2000);
      } else {
        console.error('Failed to add to wishlist');
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsAdding(false);
    }
  };

  return (
    <div className="product-card">
      <img 
        src={product.image_url} 
        alt={product.name}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
        }}
      />
      <div className="card-info">
        <h3>{product.name}</h3>
        <p className="description">{product.description}</p>
        <div className="price-quantity">
          <span className="price">₹{product.price}</span>
          <span className="quantity">Qty: {product.quantity}</span>
        </div>
        <button 
          className={`like-btn ${isLiked ? 'liked' : ''} ${isAdding ? 'adding' : ''}`}
          onClick={handleLike}
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : (isLiked ? 'Added to Wishlist!' : 'Add to Wishlist')}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
