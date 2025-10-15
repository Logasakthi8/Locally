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

  const whatsappNumber = '9876543212';

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
    const message = "Hi, I can't find my medicine. Please check if it's available: _____";
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
      <div className="container">
        <button onClick={() => navigate('/shops')} className="back-btn">
          Back to Shops
        </button>
        <div className="loading-state">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <button onClick={() => navigate('/shops')} className="back-btn">
          Back to Shops
        </button>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchProducts} className="primary-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button onClick={() => navigate('/shops')} className="back-btn">
        Back to Shops
      </button>
      <h2 className="page-title">Products</h2>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search for medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Request Medicine Button - Always visible */}
      <div className="request-medicine-section">
        <button 
          onClick={handleWhatsAppRequest}
          className="whatsapp-btn"
        >
          📱 Request Medicine
        </button>
        <p className="whatsapp-description">
          Can't find your medicine? Request it via WhatsApp and we'll help you get it fast!
        </p>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <p>Can't find medicine "{searchTerm}"</p>
              <p>Use the Request Medicine button above to get your medicine fast!</p>
            </>
          ) : (
            <p>No products available in this shop.</p>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product._id} 
              product={product} 
              onWishlistUpdate={handleWishlistUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
