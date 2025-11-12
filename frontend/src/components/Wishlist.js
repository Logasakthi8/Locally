import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [expandedShops, setExpandedShops] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    testBackendConnection();
  }, []);

  useEffect(() => {
    loadWishlistData();
  }, []);

  useEffect(() => {
    if (wishlist.length > 0) {
      groupProductsByShop();
      initializeSelectedProducts();
      initializeExpandedShops();
    }
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('userDeliveryCount', userDeliveryCount.toString());
  }, [userDeliveryCount]);

  const loadWishlistData = async () => {
    try {
      setLoading(true);
      
      // First, check if there's a pending cart from guest session
      const pendingCart = localStorage.getItem('pending_cart');
      const guestCart = localStorage.getItem('guest_cart');
      
      let combinedItems = [];

      // If there's a pending cart (from checkout flow), use it
      if (pendingCart) {
        console.log('📦 Found pending cart items');
        const pendingItems = JSON.parse(pendingCart);
        combinedItems = [...pendingItems.map(item => ({
          ...item,
          isLocal: true
        }))];
        
        // Try to sync pending items to server
        await syncPendingItemsToServer(pendingItems);
        localStorage.removeItem('pending_cart');
      } 
      // If there's a guest cart (direct navigation to wishlist), use it
      else if (guestCart) {
        console.log('📦 Found guest cart items');
        const guestItems = JSON.parse(guestCart);
        combinedItems = [...guestItems.map(item => ({
          ...item,
          isLocal: true
        }))];
      }

      // Then fetch server wishlist items
      try {
        const serverItems = await fetchServerWishlist();
        combinedItems = [...combinedItems, ...serverItems.map(item => ({
          ...item,
          isLocal: false
        }))];
      } catch (serverError) {
        console.log('⚠️ Could not fetch server wishlist, using local items only');
      }

      if (combinedItems.length > 0) {
        setWishlist(combinedItems);
        await fetchShopDetails(combinedItems);
      } else {
        setWishlist([]);
      }

    } catch (error) {
      console.error('Error loading wishlist data:', error);
      setError('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const syncPendingItemsToServer = async (pendingItems) => {
    try {
      for (const item of pendingItems) {
        await fetch(`${config.apiUrl}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            product_id: item.product._id, 
            quantity: item.quantity,
            shop_id: item.shopId 
          }),
          credentials: 'include',
        });
      }
      console.log('✅ Pending cart items synced to server');
      
      // Clear guest cart after successful sync
      localStorage.removeItem('guest_cart');
    } catch (error) {
      console.error('❌ Failed to sync pending items to server:', error);
      // Keep items in guest cart if sync fails
    }
  };

  const fetchServerWishlist = async () => {
    try {
      console.log('🔍 Fetching server wishlist...');
      
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server wishlist data received, items:', data.length);
        return data;
      } else if (response.status === 401) {
        console.log('⚠️ User not logged in, no server wishlist');
        return [];
      } else {
        console.error('❌ Failed to fetch server wishlist:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Network error fetching server wishlist:', error);
      return [];
    }
  };

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

  const fetchShopDetails = async (products) => {
    try {
      const shopIds = [...new Set(products.map(product => product.shop_id || product.shopId))];
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
      const shopId = product.shop_id || product.shopId;
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
      selected[product._id || product.product?._id] = true;
    });
    setSelectedProducts(selected);
  };

  const initializeExpandedShops = () => {
    const expanded = {};
    Object.keys(groupedWishlist).forEach(shopId => {
      expanded[shopId] = true;
    });
    setExpandedShops(expanded);
  };

  const toggleShopExpansion = (shopId) => {
    setExpandedShops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const removeFromWishlist = async (productId, isLocal = false) => {
    try {
      console.log('🗑️ Removing product from cart:', productId);
      
      if (!isLocal) {
        // Remove from server
        const response = await fetch(`${config.apiUrl}/wishlist/${productId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          console.log('✅ Product removed from server cart');
        } else {
          console.error('❌ Failed to remove from server cart:', response.status);
        }
      }

      // Remove from local state
      setWishlist(wishlist.filter(item => {
        const itemId = item._id || item.product?._id;
        return itemId !== productId;
      }));

      const newSelected = {...selectedProducts};
      delete newSelected[productId];
      setSelectedProducts(newSelected);

      // Also remove from localStorage if it was a local item
      if (isLocal) {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const updatedCart = guestCart.filter(item => item.product._id !== productId);
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
      }

    } catch (error) {
      console.error('❌ Error removing from cart:', error);
    }
  };

  const updateQuantity = async (productId, newQuantity, isLocal = false) => {
    try {
      console.log('📦 Updating quantity for product:', productId, 'to', newQuantity);
      
      if (!isLocal) {
        // Update on server
        const response = await fetch(`${config.apiUrl}/wishlist/${productId}/quantity`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: newQuantity }),
          credentials: 'include'
        });

        if (response.ok) {
          console.log('✅ Quantity updated on server');
        } else {
          console.error('❌ Failed to update quantity on server:', response.status);
        }
      }

      // Update local state
      setWishlist(prevWishlist => 
        prevWishlist.map(item => {
          const itemId = item._id || item.product?._id;
          if (itemId === productId) {
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      );

      // Update localStorage if it was a local item
      if (isLocal) {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const updatedCart = guestCart.map(item => 
          item.product._id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        );
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
      }

    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    }
  };

  const handleQuantityChange = (productId, newQuantity, isLocal = false) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity, isLocal);
  };

  // Calculate delivery charge based on user's delivery count
  const calculateDeliveryCharge = () => {
    return userDeliveryCount < 2 ? 0 : deliveryCharge;
  };

  // New checkout function
  const handleCheckout = async () => {
    if (getSelectedProductsCountTotal() === 0) {
      alert('Please select at least one product to checkout');
      return;
    }

    // Check if any shop has minimum order amount
    let hasValidOrder = false;
    Object.keys(groupedWishlist).forEach(shopId => {
      const selectedShopProducts = groupedWishlist[shopId].filter(
        product => {
          const productId = product._id || product.product?._id;
          return selectedProducts[productId];
        }
      );
      const subtotal = calculateShopSubtotal(selectedShopProducts);
      
      if (selectedShopProducts.length > 0 && subtotal >= 100) {
        hasValidOrder = true;
      }
    });

    if (!hasValidOrder) {
      alert('Please ensure at least one shop has minimum order amount of ₹100');
      return;
    }

    setIsCheckingOut(true);

    try {
      // Process each shop's order
      const orderPromises = Object.keys(groupedWishlist).map(async (shopId) => {
        const selectedShopProducts = groupedWishlist[shopId].filter(
          product => {
            const productId = product._id || product.product?._id;
            return selectedProducts[productId];
          }
        );
        const subtotal = calculateShopSubtotal(selectedShopProducts);
        
        if (selectedShopProducts.length === 0 || subtotal < 100) {
          return null; // Skip shops that don't meet minimum
        }

        const shop = shops[shopId];
        if (!shop) return null;

        // Check if shop is open
        const shopOpen = isShopOpen(shop);
        if (!shopOpen) {
          alert(`Sorry! ${shop.name} is closed. Please place the order after ${shop.opening_time}.`);
          return null;
        }

        const delivery = calculateDeliveryCharge();
        const total = subtotal + delivery;

        // Create order object
        const order = {
          shopId,
          shopName: shop.name,
          products: selectedShopProducts,
          subtotal,
          deliveryCharge: delivery,
          total,
          orderDate: new Date().toISOString()
        };

        console.log('📦 Creating order:', order);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return order;
      });

      const orders = (await Promise.all(orderPromises)).filter(order => order !== null);
      
      if (orders.length > 0) {
        // Success - show confirmation
        alert(`🎉 Order placed successfully! ${orders.length} shop${orders.length > 1 ? 's' : ''} processed.`);
        
        // Remove ordered items from cart
        const orderedProductIds = orders.flatMap(order => 
          order.products.map(product => product._id || product.product?._id)
        );
        
        setWishlist(prev => prev.filter(item => {
          const itemId = item._id || item.product?._id;
          return !orderedProductIds.includes(itemId);
        }));
        
        setSelectedProducts(prev => {
          const newSelected = {...prev};
          orderedProductIds.forEach(id => delete newSelected[id]);
          return newSelected;
        });

        // Clear localStorage
        localStorage.removeItem('guest_cart');
        localStorage.removeItem('pending_cart');

        // Increment delivery count
        const newCount = userDeliveryCount + 1;
        setUserDeliveryCount(newCount);

        // Navigate back to shops
        navigate('/shops');
      } else {
        alert('No valid orders to process. Please check your selections.');
      }

    } catch (error) {
      console.error('❌ Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const clearCart = async () => {
    try {
      console.log('🗑️ Clearing entire cart');
      
      // Clear server cart
      const response = await fetch(`${config.apiUrl}/clear-cart`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Server cart cleared');
      } else {
        console.error('❌ Failed to clear server cart:', response.status);
      }

      // Clear local state
      setWishlist([]);
      setGroupedWishlist({});
      setSelectedProducts({});
      setExpandedShops({});

      // Clear localStorage
      localStorage.removeItem('guest_cart');
      localStorage.removeItem('pending_cart');

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
    return products.reduce((sum, item) => {
      const price = item.price || item.product?.price;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const calculateShopTotal = (products) => {
    const selectedProductsList = products.filter(product => {
      const productId = product._id || product.product?._id;
      return selectedProducts[productId];
    });
    const subtotal = calculateShopSubtotal(selectedProductsList);

    if (subtotal >= 100) {
      const delivery = calculateDeliveryCharge();
      return subtotal + delivery;
    }

    return subtotal;
  };

  const getSelectedProductsCount = (shopId) => {
    if (!groupedWishlist[shopId]) return 0;

    return groupedWishlist[shopId].filter(product => {
      const productId = product._id || product.product?._id;
      return selectedProducts[productId];
    }).length;
  };

  const getSelectedProductsCountTotal = () => {
    return Object.keys(groupedWishlist).reduce((total, shopId) => {
      return total + getSelectedProductsCount(shopId);
    }, 0);
  };

  const getTotalItemsCount = () => {
    return wishlist.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const getTotalCartValue = () => {
    let total = 0;
    Object.keys(groupedWishlist).forEach(shopId => {
      const selectedShopProducts = groupedWishlist[shopId].filter(product => {
        const productId = product._id || product.product?._id;
        return selectedProducts[productId];
      });
      const subtotal = calculateShopSubtotal(selectedShopProducts);
      if (subtotal >= 100) {
        total += subtotal + calculateDeliveryCharge();
      }
    });
    return total;
  };

  const retryConnection = () => {
    setError(null);
    setConnectionStatus('checking');
    testBackendConnection();
    loadWishlistData();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <p>Loading your cart...</p>
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
        </div>
      </div>
    );
  }

  const totalItems = getTotalItemsCount();
  const totalProducts = wishlist.length;
  const totalShops = Object.keys(groupedWishlist).length;
  const selectedItemsCount = getSelectedProductsCountTotal();
  const totalCartValue = getTotalCartValue();

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Your Cart</h1>
        {totalItems > 0 && (
          <div className="cart-summary-badge">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {totalItems === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-description">Add some products from the shops to see them here!</p>
          <button 
            onClick={() => navigate('/shops')} 
            className="btn btn-primary"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          {Object.keys(groupedWishlist).map(shopId => {
            const shopProducts = groupedWishlist[shopId];
            const shop = shops[shopId] || {};
            const selectedProductsList = shopProducts.filter(product => {
              const productId = product._id || product.product?._id;
              return selectedProducts[productId];
            });
            const subtotal = calculateShopSubtotal(selectedProductsList);
            const total = calculateShopTotal(shopProducts);
            const shopItemsCount = shopProducts.length;
            const selectedCount = getSelectedProductsCount(shopId);
            const meetsMinimum = subtotal >= 100;
            const shopOpen = isShopOpen(shop);
            const delivery = calculateDeliveryCharge();
            const isExpanded = expandedShops[shopId];

            return (
              <div key={shopId} className="shop-group">
                <div className="shop-header">
                  <div className="shop-info">
                    <button 
                      className="shop-expand-toggle"
                      onClick={() => toggleShopExpansion(shopId)}
                      aria-label={isExpanded ? 'Collapse shop' : 'Expand shop'}
                    >
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </button>
                    <div className="shop-details">
                      <h3 className="shop-name">{shop.name || `Shop`}</h3>
                      <div className="shop-meta">
                        {shop.category && <span className="shop-category">{shop.category}</span>}
                        <span className="products-count">
                          <span>📦</span> {shopItemsCount} product{shopItemsCount !== 1 ? 's' : ''}
                        </span>
                        {!shopOpen && (
                          <span className="shop-status closed">🔒 Closed</span>
                        )}
                        {selectedCount > 0 && !meetsMinimum && (
                          <span className="minimum-warning">
                            Add ₹{(100 - subtotal).toFixed(2)} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!shopOpen && (
                  <div className="shop-closed-message">
                    <p>Sorry! The shop is closed. Please place the order after {shop.opening_time}.</p>
                  </div>
                )}

                {isExpanded && (
                  <div className="shop-products">
                    <div className="products-grid">
                      {shopProducts.map(product => (
                        <WishlistItem 
                          key={product._id || product.product?._id} 
                          product={product} 
                          onRemove={removeFromWishlist}
                          onQuantityChange={handleQuantityChange}
                          isSelected={selectedProducts[product._id || product.product?._id] || false}
                          onToggleSelection={toggleProductSelection}
                          isLocal={product.isLocal}
                        />
                      ))}
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
                )}
              </div>
            );
          })}

          {/* Checkout Section */}
          <div className="checkout-section">
            <div className="checkout-summary">
              <h3 className="summary-title">Order Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Selected Items</span>
                  <span className="summary-value">{selectedItemsCount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Shops</span>
                  <span className="summary-value">{totalShops}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Free Deliveries Left</span>
                  <span className="summary-value">
                    {userDeliveryCount < 2 ? `${2 - userDeliveryCount}` : '0'}
                  </span>
                </div>
                <div className="summary-item total">
                  <span className="summary-label">Total Amount</span>
                  <span className="summary-value">₹{totalCartValue.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="checkout-actions">
                <button 
                  onClick={handleCheckout}
                  disabled={selectedItemsCount === 0 || isCheckingOut}
                  className={`checkout-btn ${selectedItemsCount === 0 ? 'disabled' : ''}`}
                >
                  {isCheckingOut ? 'Processing...' : `🛒 Proceed to Checkout - ₹${totalCartValue.toFixed(2)}`}
                </button>
                
                <button 
                  onClick={clearCart}
                  className="btn btn-secondary"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;
