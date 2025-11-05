// Wishlist.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
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
  const [expandedShops, setExpandedShops] = useState({});

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const YOUR_PHONE_NUMBER = '9361437687';

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch wishlist when user is available
  useEffect(() => {
    if (user) {
      console.log('👤 User authenticated, fetching wishlist:', user.mobile);
      fetchWishlist();
    }
  }, [user]);

  useEffect(() => {
    if (wishlist.length > 0) {
      groupProductsByShop();
      initializeSelectedProducts();
      const initialExpanded = {};
      Object.keys(groupedWishlist).forEach(shopId => {
        initialExpanded[shopId] = true;
      });
      setExpandedShops(initialExpanded);
    }
  }, [wishlist]);

  // Update localStorage whenever userDeliveryCount changes
  useEffect(() => {
    localStorage.setItem('userDeliveryCount', userDeliveryCount.toString());
  }, [userDeliveryCount]);

  const toggleShopExpansion = (shopId) => {
    setExpandedShops(prev => ({
      ...prev,
      [shopId]: !prev[shopId]
    }));
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

  // In Wishlist.js - Update fetchWishlist function
const fetchWishlist = async () => {
  if (!user) {
    console.error('❌ No user found, cannot fetch wishlist');
    return;
  }

  try {
    setLoading(true);
    console.log('🔄 Fetching wishlist for user:', user.mobile);
    
    const response = await fetch(`${config.apiUrl}/wishlist`, {
      method: 'GET',
      credentials: 'include',  // 🔥 IMPORTANT: This must be included
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📊 Wishlist response status:', response.status);
    console.log('📋 Wishlist response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🎉 Wishlist items received:', data.length);
      setWishlist(data);
      
      if (data.length > 0) {
        await fetchShopDetails(data);
      }
    } else if (response.status === 401) {
      console.error('❌ Unauthorized access to wishlist');
      // Force re-authentication
      localStorage.removeItem('userSession');
      window.location.href = '/'; // Redirect to login
    } else {
      console.error('❌ Failed to fetch wishlist');
    }
  } catch (error) {
    console.error('💥 Error fetching wishlist:', error);
  } finally {
    setLoading(false);
  }
};
  const fetchShopDetails = async (products) => {
    try {
      const shopIds = [...new Set(products.map(product => product.shop_id))];
      
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
        const shopsMap = {};
        shopsData.forEach(shop => {
          shopsMap[shop._id] = shop;
        });
        setShops(shopsMap);
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
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
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setWishlist(wishlist.filter(item => item._id !== productId));
        
        const newSelected = {...selectedProducts};
        delete newSelected[productId];
        setSelectedProducts(newSelected);
      } else if (response.status === 401) {
        console.error('Authentication failed during remove operation');
      } else {
        console.error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setWishlist(prevWishlist => 
          prevWishlist.map(item => 
            item._id === productId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } else if (response.status === 401) {
        console.error('Authentication failed during quantity update');
      } else {
        console.error('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error:', error);
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
    if (!shop) return;
    
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
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/clear-cart`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setWishlist([]);
        setGroupedWishlist({});
        setSelectedProducts({});
        setExpandedShops({});
      } else if (response.status === 401) {
        console.error('Authentication failed during clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
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
      // Apply delivery charge based on user's delivery count
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

  if (authLoading) {
    return (
      <div className="container">
        <div className="loading">Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h2 className="empty-title">Authentication Required</h2>
          <p className="empty-description">Please log in to view your wishlist</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your wishlist...</div>
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
            const isExpanded = expandedShops[shopId];
            // Calculate delivery charge based on user's delivery count
            const delivery = calculateDeliveryCharge();
            
            return (
              <div key={shopId} className="shop-group">
                <div 
                  className="shop-header"
                  onClick={() => toggleShopExpansion(shopId)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="shop-info">
                    {/* Shop Image and Name */}
                    <div className="shop-main-info">
                      {shop.image_url && (
                        <img 
                          src={shop.image_url} 
                          alt={shop.name}
                          className="shop-thumbnail"
                        />
                      )}
                      <div className="shop-details">
                        <h3 className="shop-name">{shop.name || `Shop`}</h3>
                        <div className="shop-meta">
                          {shop.category && <span className="shop-category">{shop.category}</span>}
                          <span className={`shop-status ${shopOpen ? 'open' : 'closed'}`}>
                            {shopOpen ? '🟢 Open' : '🔴 Closed'}
                          </span>
                          <span className="products-count">
                            <span>📦</span> {shopItemsCount} product{shopItemsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expand/Collapse Icon */}
                  <div className="shop-expand-icon">
                    {isExpanded ? '▼' : '►'}
                  </div>
                </div>

                {/* Shop Products - Collapsible */}
                {isExpanded && (
                  <>
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
                        
                        {/* Action Buttons */}
                        <div className="shop-actions">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              checkoutViaWhatsApp(shopId);
                            }} 
                            className={`btn ${meetsMinimum && shopOpen ? 'btn-whatsapp' : 'btn-disabled'}`}
                            disabled={selectedCount === 0 || !meetsMinimum || !shopOpen}
                            title={!shopOpen ? `Sorry! The shop is closed. Please place the order after ${shop.opening_time}.` : !meetsMinimum ? `Add ₹${100 - subtotal} more to checkout` : ''}
                          >
                            <span>💬</span>
                            WhatsApp ({selectedCount})
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              meetsMinimum && shopOpen && callToOrder(YOUR_PHONE_NUMBER, shopId);
                            }} 
                            className={`btn ${meetsMinimum && shopOpen ? 'btn-call' : 'btn-disabled'}`}
                            disabled={!meetsMinimum || !shopOpen}
                            title={!shopOpen ? `Sorry! The shop is closed. Please place the order after ${shop.opening_time}.` : !meetsMinimum ? `Add ₹${100 - subtotal} more to call` : ''}
                          >
                            <span>📞</span>
                            Call to Order
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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
