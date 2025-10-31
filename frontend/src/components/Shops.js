// Shops.js - Zomato-style Multi-category Shopping App
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopCard from './ShopCard';
import config from '../config';
import './Shops.css';

function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [priceFilter, setPriceFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  // Enhanced categories with Zomato-style theming
  const categoryConfig = {
    'Food': { 
      icon: '🍕', 
      title: 'Food & Restaurants',
      color: '#FF6B6B',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
      tags: ['Restaurants', 'Cafes', 'Fast Food']
    },
    'Grocery': { 
      icon: '🛒', 
      title: 'Grocery Stores',
      color: '#4ECDC4',
      gradient: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
      tags: ['Supermarkets', 'Kirana', 'Daily Needs']
    },
    'Bakery': { 
      icon: '🍞', 
      title: 'Bakeries & Desserts',
      color: '#FFD93D',
      gradient: 'linear-gradient(135deg, #FFD93D, #FF9A3D)',
      tags: ['Breads', 'Cakes', 'Pastries']
    },
    'Fancy': { 
      icon: '💄', 
      title: 'Fancy & Lifestyle',
      color: '#6C5CE7',
      gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
      tags: ['Beauty', 'Fashion', 'Lifestyle']
    },
    'Shoes': { 
      icon: '👟', 
      title: 'Footwear & Shoes',
      color: '#00B894',
      gradient: 'linear-gradient(135deg, #00B894, #00A085)',
      tags: ['Sports', 'Casual', 'Formal']
    },
    'Accessories': { 
      icon: '🕶️', 
      title: 'Accessories',
      color: '#FD79A8',
      gradient: 'linear-gradient(135deg, #FD79A8, #E84393)',
      tags: ['Jewelry', 'Bags', 'Watches']
    },
    'Electronics': { 
      icon: '📱', 
      title: 'Electronics',
      color: '#0984E3',
      gradient: 'linear-gradient(135deg, #0984E3, #74B9FF)',
      tags: ['Mobile', 'Laptop', 'Gadgets']
    },
    'Medical': { 
      icon: '🏥', 
      title: 'Medical Stores',
      color: '#E17055',
      gradient: 'linear-gradient(135deg, #E17055, #D63031)',
      tags: ['Pharmacy', 'Medical', 'Health']
    }
  };

  const isShopOpen = (shop) => {
    if (!shop.opening_time || !shop.closing_time) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const convertTimeToMinutes = (timeStr) => {
      const normalizedTime = timeStr.replace(/\./g, ':');
      const match = normalizedTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!match) return 0;

      let [, hours, minutes, period] = match;
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    };

    try {
      const openingTimes = shop.opening_time.split(/\s+and\s+|\s*,\s*/);
      const closingTimes = shop.closing_time.split(/\s+and\s+|\s*,\s*/);
      
      if (openingTimes.length === closingTimes.length) {
        for (let i = 0; i < openingTimes.length; i++) {
          const openingTime = convertTimeToMinutes(openingTimes[i].trim());
          const closingTime = convertTimeToMinutes(closingTimes[i].trim());
          
          if (currentTime >= openingTime && currentTime <= closingTime) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error parsing shop times:', error);
      return true;
    }
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
            
            // Mock data for demonstration
            const mockData = {
              deliveryTime: Math.floor(Math.random() * 60) + 15,
              costForTwo: Math.floor(Math.random() * 2000) + 300,
              offers: ['20% OFF', 'Free Delivery', 'Buy 1 Get 1'][Math.floor(Math.random() * 3)],
              isPro: Math.random() > 0.7,
              discount: Math.random() > 0.5 ? `${Math.floor(Math.random() * 40) + 10}% OFF` : null,
              safety: Math.random() > 0.3 ? 'MAX Safety' : null
            };

            return { 
              ...shop, 
              ...mockData,
              avgRating: ratingData.average_rating || (Math.random() * 2 + 3).toFixed(1),
              isOpen: isShopOpen(shop),
              reviewCount: Math.floor(Math.random() * 500) + 10
            };
          } catch {
            const mockData = {
              deliveryTime: Math.floor(Math.random() * 60) + 15,
              costForTwo: Math.floor(Math.random() * 2000) + 300,
              offers: null,
              isPro: Math.random() > 0.7,
              discount: null,
              safety: null
            };

            return { 
              ...shop, 
              ...mockData,
              avgRating: null,
              isOpen: isShopOpen(shop),
              reviewCount: 0
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
      shop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(shop => {
        const cost = shop.costForTwo || 1000;
        switch (priceFilter) {
          case 'budget': return cost < 500;
          case 'moderate': return cost >= 500 && cost <= 1200;
          case 'premium': return cost > 1200;
          default: return true;
        }
      });
    }

    // Delivery time filter
    if (deliveryFilter !== 'all') {
      filtered = filtered.filter(shop => {
        const time = shop.deliveryTime || 30;
        switch (deliveryFilter) {
          case 'fast': return time <= 30;
          case 'medium': return time > 30 && time <= 45;
          case 'slow': return time > 45;
          default: return true;
        }
      });
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(shop => {
        const rating = parseFloat(shop.avgRating) || 0;
        switch (ratingFilter) {
          case '4+': return rating >= 4;
          case '3+': return rating >= 3;
          case '2+': return rating >= 2;
          default: return true;
        }
      });
    }

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (parseFloat(b.avgRating) || 0) - (parseFloat(a.avgRating) || 0);
        case 'delivery':
          return (a.deliveryTime || 0) - (b.deliveryTime || 0);
        case 'price-low':
          return (a.costForTwo || 0) - (b.costForTwo || 0);
        case 'price-high':
          return (b.costForTwo || 0) - (a.costForTwo || 0);
        case 'popular':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
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
          <p>Discovering amazing shops near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="zomato-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo">Shop<span>Now</span></h1>
            <p className="tagline">Discover the best shops around you</p>
          </div>
          <div className="user-section">
            <button className="location-btn">
              📍 Sector 15, Gurgaon • <span>Change</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="hero-banner" style={{
        background: selectedCategory === 'all' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : categoryConfig[selectedCategory]?.gradient
      }}>
        <div className="hero-content">
          <h1>
            {selectedCategory === 'all' 
              ? 'Great Shops Near You' 
              : categoryConfig[selectedCategory]?.title
            }
          </h1>
          <p>
            {selectedCategory === 'all' 
              ? 'Discover the best shops for all your needs'
              : `Find the best ${selectedCategory.toLowerCase()} shops with amazing deals`
            }
          </p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-number">{shops.length}+</span>
          <span className="stat-label">Shops</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">30min</span>
          <span className="stat-label">Avg Delivery</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">4.2⭐</span>
          <span className="stat-label">Avg Rating</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <div className="filter-group">
            <h3>Filters & Sort</h3>
            
            <div className="filter-section">
              <h4>Sort By</h4>
              {[
                { value: 'rating', label: 'Rating: High to Low', icon: '⭐' },
                { value: 'delivery', label: 'Delivery Time', icon: '🕒' },
                { value: 'price-low', label: 'Price: Low to High', icon: '💰' },
                { value: 'price-high', label: 'Price: High to Low', icon: '💎' },
                { value: 'popular', label: 'Most Popular', icon: '🔥' }
              ].map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => setSortBy(e.target.value)}
                  />
                  <span className="radio-content">
                    <span className="radio-icon">{option.icon}</span>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Price Range</h4>
              {[
                { value: 'all', label: 'All Prices', icon: '💰' },
                { value: 'budget', label: 'Budget (Under ₹500)', icon: '💸' },
                { value: 'moderate', label: 'Moderate (₹500-₹1200)', icon: '💵' },
                { value: 'premium', label: 'Premium (Above ₹1200)', icon: '💎' }
              ].map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="price"
                    value={option.value}
                    checked={priceFilter === option.value}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  />
                  <span className="radio-content">
                    <span className="radio-icon">{option.icon}</span>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Delivery Time</h4>
              {[
                { value: 'all', label: 'Any Time', icon: '⏰' },
                { value: 'fast', label: 'Fast (≤ 30 min)', icon: '⚡' },
                { value: 'medium', label: 'Medium (30-45 min)', icon: '👌' },
                { value: 'slow', label: 'No Rush (> 45 min)', icon: '🐢' }
              ].map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="delivery"
                    value={option.value}
                    checked={deliveryFilter === option.value}
                    onChange={(e) => setDeliveryFilter(e.target.value)}
                  />
                  <span className="radio-content">
                    <span className="radio-icon">{option.icon}</span>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="filter-section">
              <h4>Minimum Rating</h4>
              {[
                { value: 'all', label: 'All Ratings', icon: '⭐' },
                { value: '4+', label: '4.0+ Stars', icon: '⭐⭐⭐⭐' },
                { value: '3+', label: '3.0+ Stars', icon: '⭐⭐⭐' },
                { value: '2+', label: '2.0+ Stars', icon: '⭐⭐' }
              ].map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="rating"
                    value={option.value}
                    checked={ratingFilter === option.value}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  />
                  <span className="radio-content">
                    <span className="radio-icon">{option.icon}</span>
                    {option.label}
                  </span>
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
                  🏢 Grid View
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋 List View
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
                placeholder="🔍 Search for shops, items, or categories..."
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
                style={{ 
                  background: selectedCategory === 'all' ? '#667eea' : 'white',
                  color: selectedCategory === 'all' ? 'white' : '#667eea'
                }}
              >
                🏪 All Shops ({shops.length})
              </button>
              
              {existingCategories.map(category => (
                <button
                  key={category}
                  className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                  style={{ 
                    background: selectedCategory === category ? categoryConfig[category]?.color : 'white',
                    color: selectedCategory === category ? 'white' : categoryConfig[category]?.color,
                    borderColor: categoryConfig[category]?.color
                  }}
                >
                  {categoryConfig[category].icon} {category} ({shopsByCategory[category]?.length || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Results Info */}
          <div className="results-info">
            <div className="results-header">
              <h2>
                {selectedCategory === 'all' 
                  ? 'All Shops Near You' 
                  : categoryConfig[selectedCategory]?.title
                }
                <span className="results-count">({filteredShops.length} shops)</span>
              </h2>
              
              <div className="results-actions">
                <button className="action-btn" onClick={() => {
                  setSearchTerm('');
                  setPriceFilter('all');
                  setDeliveryFilter('all');
                  setRatingFilter('all');
                  setSortBy('rating');
                }}>
                  🔄 Reset Filters
                </button>
              </div>
            </div>
            
            {(searchTerm || priceFilter !== 'all' || deliveryFilter !== 'all' || ratingFilter !== 'all') && (
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
                {deliveryFilter !== 'all' && (
                  <span className="active-filter">
                    Delivery: {deliveryFilter}
                    <button onClick={() => setDeliveryFilter('all')}>✕</button>
                  </span>
                )}
                {ratingFilter !== 'all' && (
                  <span className="active-filter">
                    Rating: {ratingFilter}
                    <button onClick={() => setRatingFilter('all')}>✕</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Shops Grid/List */}
          {filteredShops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <h3>No shops found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button 
                className="primary-btn"
                onClick={() => {
                  setSearchTerm('');
                  setPriceFilter('all');
                  setDeliveryFilter('all');
                  setRatingFilter('all');
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
                  categoryConfig={categoryConfig}
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
