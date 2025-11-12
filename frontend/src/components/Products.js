import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import config from '../config';

function Products({ onRequireLogin }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const { shopId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchShopInfo();
    loadLocalCart();
  }, [shopId]);

  // Load cart from localStorage
  const loadLocalCart = () => {
    try {
      const savedCart = localStorage.getItem(`cart_${shopId}`);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  };

  // Save cart to localStorage
  const saveCartToLocal = (items) => {
    try {
      localStorage.setItem(`cart_${shopId}`, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${config.apiUrl}/shops/${shopId}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
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

  // Handle add to cart - no login required
  const handleAddToCart = (product) => {
    const existingItemIndex = cartItems.findIndex(item => item.product._id === product._id);
    
    let updatedCart;
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      updatedCart = cartItems.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // Add new item to cart
      updatedCart = [...cartItems, { product, quantity: 1 }];
    }
    
    setCartItems(updatedCart);
    saveCartToLocal(updatedCart);
    console.log('Added to cart:', product.name);
  };

  // Handle checkout - requires login
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add some products first!');
      return;
    }

    if (onRequireLogin) {
      onRequireLogin(() => {
        // After login, move to wishlist page (or checkout page)
        navigate('/wishlist');
        // Or you can process the cart here
        processCartAfterLogin();
      });
    } else {
      // User is already logged in, proceed directly
      navigate('/wishlist');
      processCartAfterLogin();
    }
  };

  const processCartAfterLogin = async () => {
    try {
      // Sync local cart with server after login
      for (const item of cartItems) {
        await fetch(`${config.apiUrl}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            product_id: item.product._id, 
            quantity: item.quantity,
            shop_id: shopId 
          }),
          credentials: 'include',
        });
      }
      
      // Clear local cart after successful sync
      localStorage.removeItem(`cart_${shopId}`);
      setCartItems([]);
      
      console.log('Cart synced with server after login');
    } catch (error) {
      console.error('Error syncing cart with server:', error);
    }
  };

  // Calculate total items in cart
  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Calculate total cart value
  const getTotalCartValue = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
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

      {/* Products Count and Cart Summary */}
      <div className="products-header-row">
        <h2 className="page-title">
          Available Products 
          <span className="count-badge">({products.length})</span>
        </h2>
        
        {cartItems.length > 0 && (
          <div className="cart-summary">
            <span className="cart-items-count">🛒 {getTotalCartItems()} items</span>
            <span className="cart-total-value">₹{getTotalCartValue()}</span>
          </div>
        )}
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
                onWishlistUpdate={() => console.log('Wishlist updated')}
                onAddToCart={handleAddToCart}
                onRequireLogin={onRequireLogin}
              />
            ))}
          </div>
          
          {/* Checkout Footer Button */}
          {cartItems.length > 0 && (
            <div className="checkout-footer">
              <div className="checkout-summary">
                <span className="total-items">{getTotalCartItems()} items</span>
                <span className="total-price">₹{getTotalCartValue()}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="checkout-btn"
              >
                🛒 Proceed to Checkout
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Products;
