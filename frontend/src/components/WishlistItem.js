import React from 'react';

function WishlistItem({ product, onRemove }) {
  return (
    <div className="wishlist-item">
      <img src={product.image_url} alt={product.name} />
      <div className="card-info">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <p className="price">₹{product.price}</p>
        <button 
          className="remove-btn"
          onClick={() => onRemove(product._id)}
        >
          Remove from Wishlist
        </button>
      </div>
    </div>
  );
}

export default WishlistItem;