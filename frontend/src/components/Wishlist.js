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
  const [selectedShop, setSelectedShop] = useState(null); // Track which shop is selected for ordering

  const navigate = useNavigate();
  const YOUR_PHONE_NUMBER = '9361437687';

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

  const toggleProductSelection = (productId, shopId) => {
    // If a shop is already selected and user tries to select from another shop, prevent it
    if (selectedShop && selectedShop !== shopId) {
      alert(`Please complete your order from ${shops[selectedShop]?.name} first, or deselect it to order from another shop.`);
      return;
    }

    setSelectedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));

    // If this is the first product selected from this shop, set it as the selected shop
    if (!selectedShop) {
      setSelectedShop(shopId);
    }
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

      // If no products left from the selected shop, clear the selected shop
      if (selectedShop) {
        const shopProducts = groupedWishlist[selectedShop] || [];
        const selectedProductsInShop = shopProducts.filter(product => {
          const productId = product._id || product.product?._id;
          return newSelected[productId];
        });
        if (selectedProductsInShop.length === 0) {
          setSelectedShop(null);
        }
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

  // Handle checkout for a specific shop via WhatsApp
  const handleShopCheckout = (shopId) => {
    const shop = shops[shopId];
    if (!shop) {
      console.error('❌ Shop not found for ID:', shopId);
      return;
    }

    const selectedShopProducts = groupedWishlist[shopId].filter(
      product => {
        const productId = product._id || product.product?._id;
        return selectedProducts[productId];
      }
    );

    if (selectedShopProducts.length === 0) {
      alert('Please select at least one product from this shop to checkout');
      return;
    }

    const subtotal = calculateShopSubtotal(selectedShopProducts);
    if (subtotal < 100) {
      alert(`Minimum order amount is ₹100. Please add ₹${(100 - subtotal).toFixed(2)} more to proceed with checkout.`);
      return;
    }

    // Check if shop is open
    const shopOpen = isShopOpen(shop);
    if (!shopOpen) {
      alert(`Sorry! ${shop.name} is closed. Please place the order after ${shop.opening_time}.`);
      return;
    }

    const delivery = calculateDeliveryCharge();
    const total = subtotal + delivery;

    // Create WhatsApp message
    let message = `Hello! I would like to place an order from ${shop.name}:%0A%0A`;

    selectedShopProducts.forEach((product, index) => {
      const productName = product.name || product.product?.name;
      const productPrice = product.price || product.product?.price;
      const quantity = product.quantity || 1;
      message += `${index + 1}. ${productName} - ₹${productPrice} x ${quantity}%0A`;
    });

    message += `%0ASubtotal: ₹${subtotal}%0A`;
    message += `Delivery Charge: ${delivery === 0 ? 'FREE' : `₹${delivery}`}%0A`;
    if (delivery === 0) {
      message += `🎉 Free delivery applied!%0A`;
    }
    message += `Total: ₹${total}%0A%0A`;
    message += `Please confirm availability and proceed with the order.`;

    // Open WhatsApp with the order details
    window.open(`https://wa.me/${YOUR_PHONE_NUMBER}?text=${message}`, '_blank');

    // Remove ordered items from cart after successful order
    const orderedProductIds = selectedShopProducts.map(product => 
      product._id || product.product?._id
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

    // Clear localStorage for these items
    try {
      const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
      const updatedCart = guestCart.filter(item => 
        !orderedProductIds.includes(item.product._id)
      );
      localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }

    // Reset selected shop
    setSelectedShop(null);

    // Increment delivery count
    const newCount = userDeliveryCount + 1;
    setUserDeliveryCount(newCount);

    alert(`Order from ${shop.name} has been placed via WhatsApp!`);
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
      setSelectedShop(null);

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

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Your Cart</h1>
        {totalItems > 0 && (
          <div className="cart-summary-badge">
            {totalItems} item{totalItems !== 1 ? 's' : ''} • {totalShops} shop{totalShops !== 1 ? 's' : ''}
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
          {selectedShop && (
            <div className="selected-shop-notice">
              <div className="notice-content">
                <span className="notice-icon">📝</span>
                <span>You are currently ordering from <strong>{shops[selectedShop]?.name}</strong>. Complete this order first or deselect all items to order from another shop.</span>
              </div>
            </div>
          )}

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
            const isShopSelected = selectedShop === shopId;
            const canSelectProducts = !selectedShop || isShopSelected;

            return (
              <div key={shopId} className={`shop-group ${isShopSelected ? 'shop-selected' : ''}`}>
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
                      <div className="shop-name-section">
                        <h3 className="shop-name">{shop.name || `Shop`}</h3>
                        {shop.image_url && (
                          <img 
                            src={shop.image_url} 
                            alt={shop.name}
                            className="shop-thumbnail"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
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
                        {isShopSelected && (
                          <span className="selected-shop-badge">🛒 Ordering</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shop Checkout Button */}
                  {selectedCount > 0 && meetsMinimum && shopOpen && (
                    <button 
                      onClick={() => handleShopCheckout(shopId)}
                      className="shop-checkout-btn"
                    >
                      💬 Order via WhatsApp
                    </button>
                  )}
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
                          onToggleSelection={(productId) => toggleProductSelection(productId, shopId)}
                          isLocal={product.isLocal}
                          disabled={!canSelectProducts}
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

          {/* Clear Cart Button */}
          <div className="cart-actions">
            <button 
              onClick={clearCart}
              className="btn btn-secondary"
            >
              🗑️ Clear Entire Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;
