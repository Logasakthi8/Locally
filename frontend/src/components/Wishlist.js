import React, { useEffect, useState } from 'react';
import config from '../config';
import WishlistItem from './WishlistItem';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});

  // ✅ Fetch wishlist
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      } else if (response.status === 401) {
        setError('Please login to view your wishlist');
      } else {
        setError('Failed to load wishlist');
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Remove product
  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setWishlist(wishlist.filter((item) => item._id !== productId));
      } else {
        console.error('Failed to remove product');
      }
    } catch (err) {
      console.error('Error removing product:', err);
    }
  };

  // ✅ Update quantity
  const handleQuantityChange = async (productId, newQty) => {
    if (newQty < 1) {
      await removeFromWishlist(productId);
      return;
    }
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${productId}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQty }),
      });

      if (response.ok) {
        setWishlist(
          wishlist.map((item) =>
            item._id === productId ? { ...item, quantity: newQty } : item
          )
        );
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  // ✅ Calculate subtotal (variant-aware)
  const calculateShopSubtotal = (products) => {
    return products.reduce(
      (sum, item) =>
        sum + ((item.variant?.price || item.price) * (item.quantity || 1)),
      0
    );
  };

  // ✅ Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // ✅ Checkout via WhatsApp
  const handleCheckout = (shopId) => {
    const selectedShopProducts = wishlist.filter(
      (item) => item.shop_id === shopId && selectedProducts[item._id]
    );

    if (selectedShopProducts.length === 0) {
      alert('Please select products to checkout');
      return;
    }

    let message = `Hello, I'd like to order the following items:%0A%0A`;

    selectedShopProducts.forEach((product, index) => {
      const price = product.variant?.price || product.price;
      const size = product.variant?.size ? ` (${product.variant.size})` : '';
      message += `${index + 1}. ${product.name}${size} - ₹${price} x ${
        product.quantity || 1
      }%0A`;
    });

    const total = calculateShopSubtotal(selectedShopProducts);
    message += `%0ATotal: ₹${total}`;

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // ✅ Group products by shop
  const groupByShop = (items) => {
    return items.reduce((groups, item) => {
      if (!groups[item.shop_id]) groups[item.shop_id] = [];
      groups[item.shop_id].push(item);
      return groups;
    }, {});
  };

  if (loading) return <p>Loading wishlist...</p>;
  if (error) return <p className="error">{error}</p>;

  const groupedWishlist = groupByShop(wishlist);

  return (
    <div className="wishlist-container">
      <h2>My Wishlist</h2>

      {Object.keys(groupedWishlist).length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        Object.entries(groupedWishlist).map(([shopId, products]) => (
          <div key={shopId} className="shop-section">
            <h3>Shop: {products[0].shop_name || shopId}</h3>

            <div className="wishlist-items">
              {products.map((product) => (
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

            <div className="shop-summary">
              <p>
                Subtotal: ₹{calculateShopSubtotal(products)} ({products.length}{' '}
                items)
              </p>
              <button onClick={() => handleCheckout(shopId)}>
                Checkout via WhatsApp
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Wishlist;
