import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import config from '../config';

function Products({ onRequireLogin }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const { shopId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchShopInfo();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${config.apiUrl}/shops/${shopId}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products data:', data); // Debug log
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/shops/${shopId}`);
      if (response.ok) {
        const shopData = await response.json();
        setShopInfo(shopData);
      }
    } catch (error) {
      console.error('Error fetching shop info:', error);
    }
  };

  // Enhanced callback function when wishlist is updated
  const handleWishlistUpdate = (product) => {
    console.log('Wishlist update requested for:', product.name);
    
    // Use the onRequireLogin to handle authentication
    if (onRequireLogin(() => {
      // This will execute after successful login
      console.log('User logged in, proceeding with wishlist update for:', product.name);
      // Actual wishlist update logic will be handled in ProductCard after login
    })) {
      // User is already logged in, proceed directly
      console.log('User already logged in, proceeding with wishlist update');
    }
  };

  // Handle add to cart with login check
  const handleAddToCart = (product) => {
    console.log('Add to cart requested for:', product.name);
    
    if (onRequireLogin(() => {
      // This will execute after successful login
      console.log('User logged in, proceeding with add to cart for:', product.name);
      // Actual add to cart logic will be handled in ProductCard after login
    })) {
      // User is already logged in, proceed directly
      console.log('User already logged in, proceeding with add to cart');
    }
  };

  // Handle checkout action
  const handleCheckout = () => {
    console.log('Checkout requested');
    
    if (onRequireLogin(() => {
      // This will execute after successful login
      console.log('User logged in, proceeding to checkout');
      // Navigate to checkout or open checkout modal
      // navigate('/checkout');
    })) {
      // User is already logged in, proceed directly
      console.log('User already logged in, proceeding to checkout');
      // navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <button onClick={() => navigate('/shops')} className="back-btn">
          ← Back to Shops
        </button>
        <div className="loading-state">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <button onClick={() => navigate('/shops')} className="back-btn">
          ← Back to Shops
        </button>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchProducts} className="primary-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header with back button and shop info */}
      <div className="products-header">
        <button onClick={() => navigate('/shops')} className="back-btn">
          ← Back to Shops
        </button>
        
        {shopInfo && (
          <div className="shop-info-banner">
            <h2>{shopInfo.name}</h2>
            {shopInfo.address && (
              <p className="shop-address">📍 {shopInfo.address}</p>
            )}
            {shopInfo.category && (
              <p className="shop-category">🏷️ {shopInfo.category}</p>
            )}
          </div>
        )}
      </div>

      {/* Products Count */}
      <div className="products-count">
        <h2 className="page-title">
          Available Products 
          <span className="count-badge">({products.length})</span>
        </h2>
      </div>
      
      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products available in this shop.</p>
          <button onClick={() => navigate('/shops')} className="primary-btn">
            Browse Other Shops
          </button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(product => (
              <ProductCard 
                key={product._id} 
                product={product}
                shopId={shopId}
                onWishlistUpdate={() => handleWishlistUpdate(product)}
                onAddToCart={() => handleAddToCart(product)}
                onRequireLogin={onRequireLogin}
              />
            ))}
          </div>
          
          {/* Checkout Footer Button */}
          <div className="checkout-footer">
            <button 
              onClick={handleCheckout}
              className="checkout-btn"
            >
              🛒 Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Products;
