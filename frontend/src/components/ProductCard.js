import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate }) {
  const [addingToCart, setAddingToCart] = useState(false);

  const addToWishlist = async () => {
    try {
      setAddingToCart(true);
      
      const response = await fetch(`${config.apiUrl}/api/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          product_id: product._id,
          quantity: 1
        }),
        credentials: 'include' // Important for session authentication
      });

      const data = await response.json();

      if (response.ok) {
        alert('Product added to cart successfully!');
        onWishlistUpdate(); // Notify parent component
      } else {
        if (response.status === 401) {
          alert('Please login to add products to cart');
          // You can redirect to login page here if needed
        } else {
          alert(data.error || 'Failed to add product to cart');
        }
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      alert('Network error. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image_url} 
          alt={product.name}
          onError={(e) => {
            e.target.src = '/images/placeholder-product.jpg';
          }}
        />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">₹{product.price}</p>
        <button 
          className={`add-to-cart-btn ${addingToCart ? 'loading' : ''}`}
          onClick={addToWishlist}
          disabled={addingToCart}
        >
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
