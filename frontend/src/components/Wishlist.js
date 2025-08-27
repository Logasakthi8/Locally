import React, { useState, useEffect } from 'react';
import WishlistItem from './WishlistItem';
import config from '../config';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [shopOwnerMobiles, setShopOwnerMobiles] = useState([]);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      } else {
        console.error('Failed to fetch wishlist');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
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
      } else {
        console.error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkout = async (method) => {
    try {
      const productIds = wishlist.map(item => item._id);
      const response = await fetch('${config.apiUrl}/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_ids: productIds }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setShopOwnerMobiles(data.shop_owner_mobiles);
        
        if (method === 'whatsapp') {
          // Create WhatsApp message
          const productNames = wishlist.map(item => item.name).join(', ');
          const totalPrice = wishlist.reduce((sum, item) => sum + item.price, 0);
          const message = `Hello, I would like to place an order for the following products:\n\n${productNames}\n\nTotal Amount: ₹${totalPrice}\n\nPlease confirm my order.`;
          
          // Open WhatsApp
          const whatsappUrl = `https://wa.me/${data.shop_owner_mobiles[0]}?text=${encodeURIComponent(message)}`;
          const whatsappWindow = window.open(whatsappUrl, '_blank');
          
          if (whatsappWindow) {
            setCheckoutStatus('whatsapp_success');
          } else {
            setCheckoutStatus('whatsapp_error');
          }
        } else if (method === 'call') {
          setCheckoutStatus('call_ready');
        }
      } else {
        setCheckoutStatus('error');
      }
    } catch (error) {
      setCheckoutStatus('error');
      console.error('Error:', error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch('${config.apiUrl}/clear-cart', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setWishlist([]);
        setCheckoutStatus(null);
        setShopOwnerMobiles([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  if (loading) {
    return <div className="container">Loading your cart...</div>;
  }

  const totalPrice = wishlist.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="container">
      <h2 className="page-title">Your Cart</h2>
      
      {/* Checkout Status Messages */}
      {checkoutStatus === 'whatsapp_success' && (
        <div className="checkout-success">
          <h3>✅ WhatsApp Opened Successfully!</h3>
          <p>Your order details have been prepared. Please complete your order on WhatsApp.</p>
          <button onClick={clearCart} className="primary-btn">
            Clear Cart & Continue Shopping
          </button>
        </div>
      )}
      
      {checkoutStatus === 'whatsapp_error' && (
        <div className="checkout-error">
          <h3>❌ Couldn't Open WhatsApp</h3>
          <p>Please make sure WhatsApp is installed or try calling instead.</p>
          <div className="checkout-actions">
            <button onClick={() => checkout('whatsapp')} className="primary-btn">
              Try WhatsApp Again
            </button>
            <button onClick={() => checkout('call')} className="secondary-btn">
              Call to Order Instead
            </button>
          </div>
        </div>
      )}
      
      {checkoutStatus === 'call_ready' && (
        <div className="checkout-info">
          <h3>📞 Call to Place Your Order</h3>
          <p>Please call one of these numbers to complete your order:</p>
          <div className="phone-numbers">
            {shopOwnerMobiles.map((number, index) => (
              <div key={index} className="phone-number">
                <a href={`tel:${number}`} className="call-link">
                  {number}
                </a>
              </div>
            ))}
          </div>
          <button onClick={clearCart} className="primary-btn">
            Order Completed - Clear Cart
          </button>
        </div>
      )}
      
      {checkoutStatus === 'error' && (
        <div className="checkout-error">
          <h3>❌ Checkout Failed</h3>
          <p>There was an error processing your order. Please try again.</p>
          <button onClick={() => setCheckoutStatus(null)} className="primary-btn">
            Try Again
          </button>
        </div>
      )}
      
      {/* Cart Items */}
      {wishlist.length === 0 && checkoutStatus !== 'whatsapp_success' ? (
        <div className="empty-state">
          <p>Your cart is empty</p>
          <p>Add some products from the shops to see them here!</p>
        </div>
      ) : (
        <>
          <div className="wishlist-grid">
            {wishlist.map(product => (
              <WishlistItem 
                key={product._id} 
                product={product} 
                onRemove={removeFromWishlist}
              />
            ))}
          </div>
          
          {wishlist.length > 0 && checkoutStatus !== 'call_ready' && (
            <div className="cart-summary">
             
              <div className="checkout-options">
                <h3>Choose how you'd like to order:</h3>
                
                <button 
                  onClick={() => checkout('whatsapp')} 
                  className="checkout-btn whatsapp-btn"
                >
                  <span className="icon">💬</span>
                  Checkout via WhatsApp
                </button>
                
                <button 
                  onClick={() => checkout('call')} 
                  className="checkout-btn call-btn"
                >
                  <span className="icon">📞</span>
                  Call to Order
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Wishlist;
