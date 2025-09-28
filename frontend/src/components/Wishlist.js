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
  const [userDeliveryCount, setUserDeliveryCount] = useState(0); // Track user's delivery count

  useEffect(() => {
    fetchWishlist();
    fetchUserDeliveryCount();
  }, []);

  useEffect(() => {
    if (wishlist.length > 0) {
      groupProductsByShop();
      initializeSelectedProducts();
    }
  }, [wishlist]);

  const fetchUserDeliveryCount = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/user/delivery-count`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserDeliveryCount(data.deliveryCount || 0);
      }
    } catch (error) {
      console.error('Error fetching delivery count:', error);
    }
  };

  const isShopOpen = (shop) => {
    if (!shop.opening_time || !shop.closing_time) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

    // Function to convert "HH:MM AM/PM" to minutes since midnight
    const convertTimeToMinutes = (timeStr) => {
      // Match the time parts and AM/PM indicator
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!match) return 0; // Return 0 if format is invalid

      let [, hours, minutes, period] = match;
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      // Convert to 24-hour format
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    };

    const openingTime = convertTimeToMinutes(shop.opening_time); // "09:30 AM" -> 570 minutes
    const closingTime = convertTimeToMinutes(shop.closing_time); // "09:30 PM" -> 1290 minutes

    // Simple comparison if shop closes on the same day
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
        
        if (data.length > 0) {
          await fetchShopDetails(data);
        }
      } else {
        console.error('Failed to fetch wishlist');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
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
      } else {
        console.error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
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
      alert(`Sorry! The shop is closed. Come back tomorrow after ${shop.opening_time} to place your order.`);
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
    
    let message = `Hello ${shop.name}, I would like to order the following products:%0A%0A`;
    
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
    
    window.open(`https://wa.me/${shop.owner_mobile}?text=${message}`, '_blank');
  };

  const callToOrder = (shopMobile, shopId) => {
    const shop = shops[shopId];
    if (!shop) return;
    
    // Check if shop is open
    const shopOpen = isShopOpen(shop);
    if (!shopOpen) {
      alert(`Sorry! The shop is closed. Come back tomorrow after ${shop.opening_time} to place your order.`);
      return;
    }
    
    window.location.href = `tel:${shopMobile}`;
  };

  const clearCart = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/clear-cart`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setWishlist([]);
        setGroupedWishlist({});
        setSelectedProducts({});
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
            // Calculate delivery charge based on user's delivery count
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
                      title={!shopOpen ? `Sorry! The shop is closed. Come back tomorrow after ${shop.opening_time} to place your order.` : !meetsMinimum ? `Add ₹${100 - subtotal} more to checkout` : ''}
                    >
                      <span>💬</span>
                      WhatsApp ({selectedCount})
                    </button>
                    {shop.owner_mobile && (
                      <button 
                        onClick={() => meetsMinimum && shopOpen && callToOrder(shop.owner_mobile, shopId)} 
                        className={`btn ${meetsMinimum && shopOpen ? 'btn-call' : 'btn-disabled'}`}
                        disabled={!meetsMinimum || !shopOpen}
                        title={!shopOpen ? `Sorry! The shop is closed. Come back tomorrow after ${shop.opening_time} to place your order.` : !meetsMinimum ? `Add ₹${100 - subtotal} more to call` : ''}
                      >
                        <span>📞</span>
                        Call to Order
                      </button>
                    )}
                  </div>
                </div>
                
                {!shopOpen && (
                  <div className="shop-closed-message">
                    <p>Sorry! The shop is closed. Come back tomorrow after {shop.opening_time} to place your order.</p>
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
