import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import config from '../config';


function Products() {
  const [products, setProducts] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToWishlist, setAddingToWishlist] = useState({});
  
  const { shopId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
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
      const response = await fetch(`${config.apiUrl}/shops/${shopId}/products`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        
        // Fetch shop details
        const shopResponse = await fetch(`${config.apiUrl}/shops/${shopId}`, {
          credentials: 'include'
        });
        if (shopResponse.ok) {
          const shopData = await shopResponse.json();
          setShop(shopData);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      setAddingToWishlist(prev => ({ ...prev, [productId]: true }));
      
      const response = await fetch(`${config.apiUrl}/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: productId }),
        credentials: 'include'
      });
      
      if (response.ok) {
        alert('Product added to wishlist!');
      } else if (response.status === 401) {
        console.error('Authentication failed');
        navigate('/');
      } else {
        alert('Failed to add product to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    } finally {
      setAddingToWishlist(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading products...</div>
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
