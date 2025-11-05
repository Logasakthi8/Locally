import React, { useState, useEffect } from 'react';
import WishlistItem from './WishlistItem';
import config from '../config'; 

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [groupedWishlist, setGroupedWishlist] = useState({});
  const [shops, setShops] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [deliveryCharge] = useState(30);
  const [userDeliveryCount, setUserDeliveryCount] = useState(() => {
    const saved = localStorage.getItem('userDeliveryCount');
    return saved ? parseInt(saved) : 0;
  });
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  const YOUR_PHONE_NUMBER = '9361437687';

  // Test backend connection first
  useEffect(() => {
    testBackendConnection();
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    if (wishlist.length > 0) {
      groupProductsByShop();
      initializeSelectedProducts();
    }
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('userDeliveryCount', userDeliveryCount.toString());
  }, [userDeliveryCount]);

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection to:', config.apiUrl);
      setConnectionStatus('testing');
      
      const response = await fetch(`${config.apiUrl}/health`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        setConnectionStatus('connected');
        setError(null);
      } else {
        console.error('❌ Backend responded with error:', response.status);
        setConnectionStatus('error');
        setError(`Backend error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      setConnectionStatus('error');
      setError(`Cannot connect to server: ${error.message}`);
    }
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching wishlist from:', `${config.apiUrl}/wishlist`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Wishlist response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Wishlist data received, items:', data.length);
        setWishlist(data);

        if (data.length > 0) {
          await fetchShopDetails(data);
        }
      } else if (response.status === 401) {
        const errorMsg = 'Please login to view your wishlist';
        console.error('❌ Authentication failed:', errorMsg);
        setError(errorMsg);
      } else {
        const errorMsg = `Server error: ${response.status}`;
        console.error('❌ Failed to fetch wishlist:', errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('❌ Network error fetching wishlist:', error);
      
      let errorMessage = 'Network error: ';
      if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. ';
      }
      errorMessage += 'Please check your internet connection and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopDetails = async (products) => {
    try {
      const shopIds = [...new Set(products.map(product => product.shop_id))];
      console.log('🔍 Fetching details for shops:', shopIds);

      if (shopIds.length === 0) return;

      const response = await fetch(`${config.apiUrl}/shops/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop_ids: shopIds }),
        credentials: 'include'
      });

      if (response.ok) {
        const shopsData = await response.json();
        console.log('✅ Shop details received:', shopsData.length, 'shops');
        const shopsMap = {};
        shopsData.forEach(shop => {
          shopsMap[shop._id] = shop;
        });
        setShops(shopsMap);
      } else {
        console.error('❌ Failed to fetch shop details:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching shop details:', error);
    }
  };

  const groupProductsByShop = () => {
    const grouped = {};

    wishlist.forEach(product => {
      const shopId = product.shop_id;
      if (!grouped[shopId]) {
        grouped[shopId] = [];
      }
      grouped[shopId].push(product);
    });

    setGroupedWishlist(grouped);
  };

  const initializeSelectedProducts = () => {
    const selected = {};
    wishlist.forEach(product => {
      selected[product._id] = true;
    });
    setSelectedProducts(selected);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const removeFromWishlist = async (productId) => {
    try {
      console.log('🗑️ Removing product from wishlist:', productId);
      
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Product removed from wishlist');
        setWishlist(wishlist.filter(item => item._id !== productId));

        const newSelected = {...selectedProducts};
        delete newSelected[productId];
        setSelectedProducts(newSelected);
      } else {
        console.error('❌ Failed to remove from wishlist:', response.status);
      }
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      console.log('📦 Updating quantity for product:', productId, 'to', newQuantity);
      
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Quantity updated successfully');
        setWishlist(prevWishlist => 
          prevWishlist.map(item => 
            item._id === productId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } else {
        console.error('❌ Failed to update quantity:', response.status);
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    }
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  // Calculate delivery charge based on user's delivery count
  const calculateDeliveryCharge = () => {
    return userDeliveryCount < 2 ? 0 : deliveryCharge;
  };

  const checkoutViaWhatsApp = (shopId) => {
    const shop = shops[shopId];
    if (!shop) {
      console.error('❌ Shop not found for ID:', shopId);
      return;
    }

    // Check if shop is open
    const shopOpen = isShopOpen(shop);
    if (!shopOpen) {
      alert(`Sorry! The shop is closed. Please place the order after ${shop.opening_time}.`);
      return;
    }

    const selectedShopProducts = groupedWishlist[shopId].filter(
      product => selectedProducts[product._id]
    );

    if (selectedShopProducts.length === 0) {
      alert('Please select at least one product to checkout');
      return;
    }

    const subtotal = calculateShopSubtotal(selectedShopProducts);
    if (subtotal < 100) {
      alert(`Minimum order amount is ₹100. Please add more products to proceed with checkout.`);
      return;
    }

    // Calculate delivery charge based on user's delivery count
    const delivery = calculateDeliveryCharge();
    const total = subtotal + delivery;

    let message = `Hello, I would like to order the following products from ${shop.name}:%0A%0A`;

    selectedShopProducts.forEach((product, index) => {
      message += `${index + 1}. ${product.name} - ₹${product.price} x ${product.quantity || 1}%0A`;
    });

    message += `%0ASubtotal: ₹${subtotal}%0A`;
    message += `Delivery Charge: ${delivery === 0 ? 'FREE' : `₹${delivery}`}%0A`;
    if (userDeliveryCount < 2) {
      message += `🎉 Free delivery (${2 - userDeliveryCount} free delivery${2 - userDeliveryCount === 1 ? '' : 's'} left!)%0A`;
    }
    message += `Total: ₹${total}%0A%0A`;
    message += `Please confirm availability and proceed with the order.`;

    // Use your hardcoded phone number instead of shop.owner_mobile
    window.open(`https://wa.me/${YOUR_PHONE_NUMBER}?text=${message}`, '_blank');

    // Increment delivery count after successful order
    const newCount = userDeliveryCount + 1;
    setUserDeliveryCount(newCount);
  };

  const callToOrder = (shopMobile, shopId) => {
    const shop = shops[shopId];
    if (!shop) return;

    // Check if shop is open
    const shopOpen = isShopOpen(shop);
    if (!shopOpen) {
      alert(`Sorry! The shop is closed. Please place the order after ${shop.opening_time}.`);
      return;
    }

    // Use your hardcoded phone number instead of shop.owner_mobile
    window.location.href = `tel:${YOUR_PHONE_NUMBER}`;
  };

  const clearCart = async () => {
    try {
      console.log('🗑️ Clearing entire wishlist');
      
      const response = await fetch(`${config.apiUrl}/clear-cart`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Wishlist cleared successfully');
        setWishlist([]);
        setGroupedWishlist({});
        setSelectedProducts({});
      } else {
        console.error('❌ Failed to clear cart:', response.status);
      }
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
    }
  };

  const isShopOpen = (shop) => {
    if (!shop.opening_time || !shop.closing_time) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const convertTimeToMinutes = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!match) return 0;

      let [, hours, minutes, period] = match;
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    };

    const openingTime = convertTimeToMinutes(shop.opening_time);
    const closingTime = convertTimeToMinutes(shop.closing_time);

    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const calculateShopSubtotal = (products) => {
    return products.reduce((sum, item) => 
      sum + (item.price * (item.quantity || 1)), 0
    );
  };

  const calculateShopTotal = (products) => {
    const selectedProductsList = products.filter(product => selectedProducts[product._id]);
    const subtotal = calculateShopSubtotal(selectedProductsList);

    if (subtotal >= 100) {
      const delivery = calculateDeliveryCharge();
      return subtotal + delivery;
    }

    return subtotal;
  };

  const getSelectedProductsCount = (shopId) => {
    if (!groupedWishlist[shopId]) return 0;

    return groupedWishlist[shopId].filter(
      product => selectedProducts[product._id]
    ).length;
  };

  const getTotalItemsCount = () => {
    return wishlist.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const retryConnection = () => {
    setError(null);
    setConnectionStatus('checking');
    testBackendConnection();
    fetchWishlist();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <p>Loading your wishlist...</p>
          <p className="connection-status">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={retryConnection} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">
              Reload Page
            </button>
          </div>
          <div className="troubleshooting-tips">
            <h4>Troubleshooting Tips:</h4>
            <ul>
              <li>Check your internet connection</li>
              <li>Verify the backend server is running</li>
              <li>Check browser console for detailed errors</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const totalItems = getTotalItemsCount();
  const totalProducts = wishlist.length;
  const totalShops = Object.keys(groupedWishlist).length;

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Your Wishlist</h1>
        {totalItems > 0 && (
          <div className="cart-summary-badge">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {totalItems === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2 className="empty-title">Your wishlist is empty</h2>
          <p className="empty-description">Add some products from the shops to see them here!</p>
        </div>
      ) : (
        <>
          {Object.keys(groupedWishlist).map(shopId => {
            const shopProducts = groupedWishlist[shopId];
            const shop = shops[shopId] || {};
            const selectedProductsList = shopProducts.filter(product => selectedProducts[product._id]);
            const subtotal = calculateShopSubtotal(selectedProductsList);
            const total = calculateShopTotal(shopProducts);
            const shopItemsCount = shopProducts.length;
            const selectedCount = getSelectedProductsCount(shopId);
            const meetsMinimum = subtotal >= 100;
            const shopOpen = isShopOpen(shop);
            const delivery = calculateDeliveryCharge();

            return (
              <div key={shopId} className="shop-group">
                <div className="shop-header">
                  <div className="shop-info">
                    <h3 className="shop-name">{shop.name || `Shop`}</h3>
                    <div className="shop-meta">
                      {shop.category && <span className="shop-category">{shop.category}</span>}
                      <span className="products-count">
                        <span>📦</span> {shopItemsCount} product{shopItemsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="shop-actions">
                    <button 
                      onClick={() => checkoutViaWhatsApp(shopId)} 
                      className={`btn ${meetsMinimum && shopOpen ? 'btn-whatsapp' : 'btn-disabled'}`}
                      disabled={selectedCount === 0 || !meetsMinimum || !shopOpen}
                      title={!shopOpen ? `Sorry! The shop is closed. Please place the order after ${shop.opening_time}.` : !meetsMinimum ? `Add ₹${100 - subtotal} more to checkout` : ''}
                    >
                      <span>💬</span>
                      WhatsApp ({selectedCount})
                    </button>
                    <button 
                      onClick={() => meetsMinimum && shopOpen && callToOrder(YOUR_PHONE_NUMBER, shopId)} 
                      className={`btn ${meetsMinimum && shopOpen ? 'btn-call' : 'btn-disabled'}`}
                      disabled={!meetsMinimum || !shopOpen}
                      title={!shopOpen ? `Sorry! The shop is closed. Please place the order after ${shop.opening_time}.` : !meetsMinimum ? `Add ₹${100 - subtotal} more to call` : ''}
                    >
                      <span>📞</span>
                      Call to Order
                    </button>
                  </div>
                </div>

                {!shopOpen && (
                  <div className="shop-closed-message">
                    <p>Sorry! The shop is closed. Please place the order after {shop.opening_time}.</p>
                  </div>
                )}

                <div className="shop-products">
                  <div className="products-grid">
                    {shopProducts.map(product => (
                      <WishlistItem 
                        key={product._id} 
                        product={product} 
                        onRemove={removeFromWishlist}
                        onQuantityChange={handleQuantityChange}
                        isSelected={selectedProducts[product._id] || false}
                        onToggleSelection={toggleProductSelection}
                      />
                    ))}
                  </div>
                </div>
                {selectedCount > 0 && (
                  <div className="shop-footer">
                    <div className="order-summary">
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                      </div>
                      {meetsMinimum ? (
                        <>
                          <div className="summary-row">
                            <span>Delivery Charge:</span>
                            <span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
                          </div>
                          {delivery === 0 && (
                            <div className="free-delivery-badge">
                              🎉 Free delivery! ({2 - userDeliveryCount} free delivery{2 - userDeliveryCount === 1 ? '' : 's'} left)
                            </div>
                          )}
                          {subtotal >= 500 && delivery > 0 && (
                            <div className="free-delivery-badge">
                              🎉 You've earned free delivery on orders above ₹500!
                            </div>
                          )}
                          <div className="summary-row total">
                            <span>Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="minimum-alert">
                          <span>Add ₹{(100 - subtotal).toFixed(2)} more to reach minimum order of ₹100</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="cart-summary">
            <h3 className="summary-title">Cart Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Total Shops</span>
                <span className="summary-value">{totalShops}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Products</span>
                <span className="summary-value">{totalProducts}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Items</span>
                <span className="summary-value">{totalItems}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Free Deliveries Left</span>
                <span className="summary-value">
                  {userDeliveryCount < 2 ? `${2 - userDeliveryCount}` : '0'}
                </span>
              </div>
            </div>
            <button onClick={clearCart} className="btn btn-danger" style={{width: '100%'}}>
              Clear Entire Wishlist
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;
