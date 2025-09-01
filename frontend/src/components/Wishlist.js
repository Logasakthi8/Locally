import React, { useState, useEffect } from 'react';
import WishlistItem from './WishlistItem';
import config from '../config';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [groupedWishlist, setGroupedWishlist] = useState({});
  const [shops, setShops] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [checkoutStatus, setCheckoutStatus] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    if (wishlist.length > 0) {
      groupProductsByShop();
      initializeSelectedProducts();
    }
  }, [wishlist]);

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
        setCheckoutStatus(null);
        
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

  const checkoutViaWhatsApp = (shopId) => {
    const shop = shops[shopId];
    if (!shop) return;
    
    const selectedShopProducts = groupedWishlist[shopId].filter(
      product => selectedProducts[product._id]
    );
    
    if (selectedShopProducts.length === 0) {
      alert('Please select at least one product to checkout');
      return;
    }
    
    let message = `Hello ${shop.name}, I would like to order the following products:%0A%0A`;
    
    selectedShopProducts.forEach((product, index) => {
      message += `${index + 1}. ${product.name} - ₹${product.price} x ${product.quantity || 1}%0A`;
    });
    
    const total = selectedShopProducts.reduce(
      (sum, product) => sum + (product.price * (product.quantity || 1)), 0
    );
    
    message += `%0ATotal: ₹${total}%0A%0APlease confirm availability and proceed with the order.`;
    
    window.open(`https://wa.me/${shop.owner_mobile}?text=${message}`, '_blank');
  };

  const callToOrder = (shopMobile) => {
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
        setCheckoutStatus(null);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const calculateShopTotal = (products) => {
    const selectedProductsList = products.filter(product => selectedProducts[product._id]);
    return selectedProductsList.reduce((sum, item) => 
      sum + (item.price * (item.quantity || 1)), 0
    );
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
    return <div className="container"><div className="loading">Loading your wishlist...</div></div>;
  }

  const totalItems = getTotalItemsCount();

  return (
    <div className="container">
      <h2 className="page-title">Your Wishlist</h2>
      
      {totalItems === 0 ? (
        <div className="empty-state">
          <p>Your wishlist is empty</p>
          <p>Add some products from the shops to see them here!</p>
        </div>
      ) : (
        <>
          {Object.keys(groupedWishlist).map(shopId => {
            const shopProducts = groupedWishlist[shopId];
            const shop = shops[shopId] || {};
            const shopTotal = calculateShopTotal(shopProducts);
            const shopItemsCount = shopProducts.length;
            const selectedCount = getSelectedProductsCount(shopId);
            
            return (
              <div key={shopId} className="shop-group">
                <div className="shop-header">
                  <div className="shop-info">
                    <h3>{shop.name || `Shop`}</h3>
                    {shop.category && <span className="shop-category">{shop.category}</span>}
                    <div className="products-count">{shopItemsCount} product(s)</div>
                  </div>
                  <div className="shop-actions">
                    <button 
                      onClick={() => checkoutViaWhatsApp(shopId)} 
                      className="checkout-btn whatsapp-btn"
                      disabled={selectedCount === 0}
                    >
                      <span className="icon">💬</span>
                      WhatsApp Checkout ({selectedCount})
                    </button>
                    {shop.owner_mobile && (
                      <button 
                        onClick={() => callToOrder(shop.owner_mobile)} 
                        className="checkout-btn call-btn"
                      >
                        <span className="icon">📞</span>
                        Call to Order
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="shop-products">
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
                
                {selectedCount > 0 && (
                  <div className="shop-footer" style={{ 
                    padding: '15px 20px', 
                    background: '#f8f9fa', 
                    borderTop: '1px solid #eee',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    Selected Total: ₹{shopTotal.toFixed(2)}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="cart-summary">
            <div className="summary-row">
              <span>Total Shops:</span>
              <span>{Object.keys(groupedWishlist).length}</span>
            </div>
            <div className="summary-row">
              <span>Total Products:</span>
              <span>{wishlist.length}</span>
            </div>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{totalItems}</span>
            </div>
            
            <button onClick={clearCart} className="clear-cart-btn">
              Clear Entire Wishlist
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;
