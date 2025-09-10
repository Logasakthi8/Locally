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
  const [error, setError] = useState(null);

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
      setError(null);
      setLoading(true);
      console.log('Fetching wishlist from:', `${config.apiUrl}/wishlist`);
      
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
        
        if (data.length > 0) {
          await fetchShopDetails(data);
        }
      } else {
        const errorText = await response.text();
        const errorMsg = `Failed to load wishlist (${response.status})`;
        setError(errorMsg);
        console.error('Failed to fetch wishlist:', response.status, errorText);
      }
      setLoading(false);
    } catch (error) {
      const errorMsg = 'Network error. Please check your connection.';
      setError(errorMsg);
      console.error('Error fetching wishlist:', error);
      setLoading(false);
    }
  };

  // Keep the rest of your functions as they are, but add error handling to fetchShopDetails too
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
      } else {
        console.error('Failed to fetch shop details');
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
    }
  };

  // Add retry function
  const retryFetch = () => {
    fetchWishlist();
  };

  // The rest of your functions remain the same...

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your wishlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Unable to load wishlist</h2>
          <p className="error-description">{error}</p>
          <button onClick={retryFetch} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Rest of your render logic...
}

export default Wishlist;
