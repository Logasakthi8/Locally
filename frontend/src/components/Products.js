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
  const [isSyncing, setIsSyncing] = useState(false);
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
      const savedCart = localStorage.getItem('guest_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        // Filter cart items for current shop only
        const shopCartItems = cartData.filter(item => item.shopId === shopId);
        setCartItems(shopCartItems);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
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
  const handleAddToCart = (product, quantity = 1) => {
    const existingItemIndex = cartItems.findIndex(item => item.product._id === product._id);
    
    let updatedCart;
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      updatedCart = cartItems.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Add new item to cart
      updatedCart = [...cartItems, { 
        product, 
        quantity: quantity,
        shopId: shopId,
        addedAt: new Date().toISOString()
      }];
    }
    
    setCartItems(updatedCart);
    saveCartToLocal(updatedCart);
    console.log('Added to cart:', product.name);
  };

  // Save cart to localStorage
  const saveCartToLocal = (items) => {
    try {
      // Get existing cart
      const existingCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      
      // Remove items from current shop
      const otherShopItems = existingCart.filter(item => item.shopId !== shopId);
      
      // Combine with current shop items
      const updatedCart = [...otherShopItems, ...items];
      
      localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  };

  // Navigate to wishlist function
  const navigateToWishlist = () => {
    console.log('🚀 Navigating to wishlist with cart items:', cartItems.length);
    
    // Save current cart to a special key that wishlist can read
    localStorage.setItem('pending_cart', JSON.stringify(cartItems));
    console.log('💾 Saved to pending_cart');
    
    // Clear the guest cart for this shop only
    try {
      const existingCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      const updatedCart = existingCart.filter(item => item.shopId !== shopId);
      localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
      console.log('🗑️ Cleared guest cart for shop:', shopId);
    } catch (error) {
      console.error('Error clearing guest cart:', error);
    }
    
    setCartItems([]);
    
    // Navigate to wishlist page
    navigate('/wishlist');
    console.log('📍 Navigated to wishlist page');
  };

  // Handle checkout - requires login
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add some products first!');
      return;
    }

    console.log('🛒 Checkout clicked, cart items:', cartItems.length);

    // Check the return value of onRequireLogin and handle both cases
    const canProceed = onRequireLogin(() => {
      console.log('✅ Login successful, navigating to wishlist');
      navigateToWishlist();
    });

    // If user is already logged in, proceed directly
    if (canProceed) {
      console.log('✅ User already logged in, proceeding to wishlist');
      navigateToWishlist();
    } else {
      console.log('🔄 Showing login modal...');
      // Login modal will be shown, and after login it will call navigateToWishlist
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
                disabled={isSyncing}
              >
                {isSyncing ? 'Processing...' : '🛒 Proceed to Checkout'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Products;
