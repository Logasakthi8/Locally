import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import config from '../config';

function Products() {
  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToWishlist, setAddingToWishlist] = useState({});
  
  const { shopId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && shopId) {
      fetchProducts();
    }
  }, [user, shopId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching products for shop ID:', shopId);
      console.log('📡 Making request to:', `${config.apiUrl}/shops/${shopId}/products`);
      
      const response = await fetch(`${config.apiUrl}/shops/${shopId}/products`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎉 Products data received:', data);
      setProducts(data);
      
      // Fetch shop details
      await fetchShopDetails();
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError(`Failed to load products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopDetails = async () => {
    try {
      console.log('🔄 Fetching shop details for:', shopId);
      
      const response = await fetch(`${config.apiUrl}/shops/${shopId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const shopData = await response.json();
        console.log('🏪 Shop details received:', shopData);
        setShop(shopData);
      } else {
        console.warn('⚠️ Could not fetch shop details');
      }
    } catch (error) {
      console.error('❌ Error fetching shop details:', error);
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
      
      console.log('🔄 Adding to wishlist:', productId);
      
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId }),
        credentials: 'include'
      });
      
      console.log('📊 Wishlist response status:', response.status);
      
      if (response.ok) {
        alert('Product added to wishlist!');
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        navigate('/');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add product to wishlist');
      }
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  const retryFetch = () => {
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">
          <h3>❌ Error Loading Products</h3>
          <p>{error}</p>
          <button onClick={retryFetch} className="retry-btn">
            Try Again
          </button>
          <div className="debug-info">
            <p><strong>Debug Info:</strong></p>
            <p>Shop ID: {shopId}</p>
            <p>API URL: {config.apiUrl}</p>
            <p>User: {user ? user.mobile : 'Not logged in'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">
          {shop ? `Products from ${shop.name}` : 'Products'}
        </h1>
        {shop && (
          <div className="shop-info-banner">
            <p>{shop.description}</p>
            <p>📍 {shop.address}</p>
          </div>
        )}
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">₹{product.price}</div>
              
              <button
                onClick={() => addToWishlist(product._id)}
                disabled={addingToWishlist[product._id]}
                className="add-to-wishlist-btn"
              >
                {addingToWishlist[product._id] ? 'Adding...' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="empty-state">
          <p>No products available in this shop.</p>
        </div>
      )}
    </div>
  );
}

export default Products;
