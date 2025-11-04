import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import config from '../config';

function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { shopId } = useParams();
  const navigate = useNavigate();

  const whatsappNumber = '9361437687';

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${config.apiUrl}/shops/${shopId}/products`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Products data:', data);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppRequest = () => {
    const message = "Hi, I can't find the Product. Please check if it's available: _____";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Callback function when wishlist is updated
  const handleWishlistUpdate = () => {
    console.log('Wishlist updated, you can refresh products if needed');
  };

  if (loading) {
    return (
      <div className="products-container">
        <div className="products-header">
          <button onClick={() => navigate('/shops')} className="back-btn">
            ← Back to Shops
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Discovering amazing products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-container">
        <div className="products-header">
          <button onClick={() => navigate('/shops')} className="back-btn">
            ← Back to Shops
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">😔</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchProducts} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Header Section */}
      <div className="products-header">
        <button onClick={() => navigate('/shops')} className="back-btn">
          ← Back to Shops
        </button>
        <h1 className="page-title">Products Menu</h1>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search for products, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="products-count">
          <span className="count-badge">{filteredProducts.length}</span>
          <span>Products Available</span>
        </div>
        
        <button 
          onClick={handleWhatsAppRequest}
          className="whatsapp-request-btn"
        >
          <span className="whatsapp-icon">💬</span>
          Request Product
        </button>
      </div>

      {/* Request Help Section */}
      <div className="request-help-section">
        <div className="help-content">
          <div className="help-icon">❓</div>
          <div className="help-text">
            <h4>Can't find what you're looking for?</h4>
            <p>We'll help you get it! Request any product via WhatsApp</p>
          </div>
        </div>
        <button 
          onClick={handleWhatsAppRequest}
          className="help-action-btn"
        >
          Request Now
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="empty-products">
          <div className="empty-icon">📦</div>
          <h3>
            {searchTerm ? `No results for "${searchTerm}"` : 'No products available'}
          </h3>
          <p>
            {searchTerm 
              ? "Try searching with different keywords or request the product via WhatsApp"
              : "This shop hasn't added any products yet. Check back later!"
            }
          </p>
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="products-content">
          {/* Results Info */}
          <div className="results-info">
            <h2>
              {searchTerm 
                ? `Search Results for "${searchTerm}"`
                : 'All Products'
              }
            </h2>
            <span className="results-count">
              {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product._id} 
                product={product} 
                onWishlistUpdate={handleWishlistUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
