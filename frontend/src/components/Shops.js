// Shops.js - Zomato-style shoe shop listing
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopCard from './ShopCard';
import config from '../config';
import './Shops.css'; // We'll create this CSS file

function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [priceFilter, setPriceFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  // Enhanced categories for shoe shops
  const categoryConfig = {
    'Sports Shoes': { 
      icon: '👟', 
      title: 'Sports & Athletic Footwear',
      color: '#FF6B6B'
    },
    'Casual Shoes': { 
      icon: '👞', 
      title: 'Casual & Everyday Wear',
      color: '#4ECDC4'
    },
    'Formal Shoes': { 
      icon: '👔', 
      title: 'Formal & Office Wear',
      color: '#45B7D1'
    },
    'Sneakers': { 
      icon: '👟', 
      title: 'Trendy Sneakers',
      color: '#96CEB4'
    },
    'Sandals': { 
      icon: '🩴', 
      title: 'Sandals & Flip Flops',
      color: '#FFEAA7'
    },
    'Accessories': { 
      icon: '🧦', 
      title: 'Shoe Accessories',
      color: '#DDA0DD'
    },
    'Branded': { 
      icon: '🏷️', 
      title: 'Branded Footwear',
      color: '#98D8C8'
    }
  };

  const isShopOpen = (shop) => {
    // Your existing time logic
    if (!shop.opening_time || !shop.closing_time) return true;
    // ... keep your existing time logic
    return true;
  };

  const fetchShops = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/shops`);
      const data = await response.json();

      const shopsWithRatings = await Promise.all(
        data.map(async (shop) => {
          try {
            const ratingRes = await fetch(`${config.apiUrl}/reviews/${shop._id}/average`);
            const ratingData = await ratingRes.json();
            return { 
              ...shop, 
              avgRating: ratingData.average_rating || null,
              isOpen: isShopOpen(shop),
              deliveryTime: Math.floor(Math.random() * 60) + 15, // Mock delivery time
              costForTwo: Math.floor(Math.random() * 2000) + 300, // Mock price
              offers: ['20% OFF', 'Free Delivery'][Math.floor(Math.random() * 2)] // Mock offers
            };
          } catch {
            return { 
              ...shop, 
              avgRating: null,
              isOpen: isShopOpen(shop),
              deliveryTime: Math.floor(Math.random() * 60) + 15,
              costForTwo: Math.floor(Math.random() * 2000) + 300,
              offers: null
            };
          }
        })
      );

      setShops(shopsWithRatings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setLoading(false);
    }
  };

  // Group shops by category
  const shopsByCategory = shops.reduce((acc, shop) => {
    const category = shop.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shop);
    return acc;
  }, {});

  // Get categories that exist in your data
  const existingCategories = Object.keys(categoryConfig).filter(category => 
    shopsByCategory[category] && shopsByCategory[category].length > 0
  );

  // Filter and sort logic
  const getFilteredShops = (shopsList) => {
    let filtered = shopsList.filter(shop => 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(shop => {
        const cost = shop.costForTwo || 1000;
        switch (priceFilter) {
          case 'budget': return cost < 800;
          case 'moderate': return cost >= 800 && cost <= 1500;
          case 'premium': return cost > 1500;
          default: return true;
        }
      });
    }

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.avgRating || 0) - (a.avgRating || 0);
        case 'delivery':
          return (a.deliveryTime || 0) - (b.deliveryTime || 0);
        case 'price-low':
          return (a.costForTwo || 0) - (b.costForTwo || 0);
        case 'price-high':
          return (b.costForTwo || 0) - (a.costForTwo || 0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredShops = selectedCategory === 'all' 
    ? getFilteredShops(shops) 
    : getFilteredShops(shopsByCategory[selectedCategory] || []);

  if (loading) {
    return (
      <div className="zomato-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding the best shoe shops for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zomato-container">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1>Step into Style</h1>
          <p>Discover the perfect pair from top shoe stores near you</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filter-group">
            <h3>Filters</h3>
            
            <div className="filter-section">
              <h4>Sort By</h4>
              {[
                { value: 'rating', label: 'Rating' },
                { value: 'delivery', label: 'Delivery Time' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' }
              ].map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => setSortBy(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Price Range</h4>
              {[
                { value: 'all', label: 'All Prices' },
                { value: 'budget', label: 'Budget (Under ₹800)' },
                { value: 'moderate', label: 'Moderate (₹800-₹1500)' },
                { value: 'premium', label: 'Premium (Above ₹1500)' }
              ].map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="price"
                    value={option.value}
                    checked={priceFilter === option.value}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>View Mode</h4>
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  🏢 Grid
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋 List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Shops Area */}
        <div className="shops-main">
          {/* Search and Categories Bar */}
          <div className="top-bar">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Search for shoes, brands, or shops..."
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

            <div className="categories-scroll">
              <button 
                className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                🏪 All Shoes ({shops.length})
              </button>
              
              {existingCategories.map(category => (
                <button
                  key={category}
                  className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                  style={{ 
                    borderColor: categoryConfig[category]?.color,
                    background: selectedCategory === category ? categoryConfig[category]?.color : 'white'
                  }}
                >
                  {categoryConfig[category].icon} {category} ({shopsByCategory[category]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <h2>
              {selectedCategory === 'all' ? 'All Shoe Shops' : categoryConfig[selectedCategory]?.title}
              <span className="results-count">({filteredShops.length} shops)</span>
            </h2>
            
            {(searchTerm || priceFilter !== 'all') && (
              <div className="active-filters">
                {searchTerm && (
                  <span className="active-filter">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}>✕</button>
                  </span>
                )}
                {priceFilter !== 'all' && (
                  <span className="active-filter">
                    Price: {priceFilter}
                    <button onClick={() => setPriceFilter('all')}>✕</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Shops Grid/List */}
          {filteredShops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👟</div>
              <h3>No shoe shops found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button 
                className="primary-btn"
                onClick={() => {
                  setSearchTerm('');
                  setPriceFilter('all');
                  setSelectedCategory('all');
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={`shops-display ${viewMode}`}>
              {filteredShops.map(shop => (
                <ShopCard 
                  key={shop._id} 
                  shop={shop} 
                  viewMode={viewMode}
                  showFeatures={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shops;
