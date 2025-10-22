// Shops.js - Enhanced with your specific categories
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  // Your specific categories with icons and display names
  const categoryConfig = {
    'Medicals': { icon: '🏥', title: 'Medical Partner List' },
    'Grocery': { icon: '🛒', title: 'Nearby Grocery Stores' },
    'Vegetable': { icon: '🥦', title: 'Fresh Vegetable Shops' },
    'Bakery': { icon: '🍞', title: 'Bakery & Bread Shops' },
    'Printing Shop': { icon: '🖨️', title: 'Printing & Stationery' },
    'Footwear & Accessories': { icon: '👟', title: 'Footwear & Accessories' },
    'Fast Food / Hotel': { icon: '🍔', title: 'Fast Food & Restaurants' }
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
            return { 
              ...shop, 
              avgRating: ratingData.average_rating || null,
              isOpen: isShopOpen(shop)
            };
          } catch {
            return { 
              ...shop, 
              avgRating: null,
              isOpen: isShopOpen(shop)
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

  // Add "Other" category for any shops that don't match your predefined categories
  const otherCategories = Object.keys(shopsByCategory).filter(category => 
    !categoryConfig[category] && category !== 'Other'
  );

  // Filter shops based on search term and category
  const getFilteredShops = (shopsList) => {
    return shopsList.filter(shop => 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredShops = selectedCategory === 'all' 
    ? getFilteredShops(shops) 
    : getFilteredShops(shopsByCategory[selectedCategory] || []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading shops...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="page-title">Browse Shops</h2>
      
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search shops by name, category, or location..."
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
      
      {/* Category Filter */}
      <div className="category-filter">
        <button 
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          🏪 All Shops ({shops.length})
        </button>
        
        {existingCategories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {categoryConfig[category].icon} {category} ({shopsByCategory[category]?.length || 0})
          </button>
        ))}
        
        {/* Other categories */}
        {otherCategories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            🏪 {category} ({shopsByCategory[category]?.length || 0})
          </button>
        ))}
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="search-results-info">
          <p>
            Found {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} 
            {selectedCategory !== 'all' && ` in ${selectedCategory}`} 
            {` for "${searchTerm}"`}
          </p>
        </div>
      )}

      {/* Display shops by category when "All" is selected */}
      {selectedCategory === 'all' && !searchTerm ? (
        <div className="shops-by-category">
          {existingCategories.map(category => (
            <div key={category} className="category-section">
              <h3 className="category-title">
                {categoryConfig[category].icon} {categoryConfig[category].title}
                <span className="shop-count">({shopsByCategory[category]?.length || 0} shops)</span>
              </h3>
              <div className="shops-grid">
                {shopsByCategory[category]?.map(shop => (
                  <ShopCard key={shop._id} shop={shop} />
                ))}
              </div>
            </div>
          ))}
          
          {/* Other categories section */}
          {otherCategories.length > 0 && (
            <div className="category-section">
              <h3 className="category-title">
                🏪 Other Shops
                <span className="shop-count">
                  ({otherCategories.reduce((total, cat) => total + (shopsByCategory[cat]?.length || 0), 0)} shops)
                </span>
              </h3>
              <div className="shops-grid">
                {otherCategories.map(category => 
                  shopsByCategory[category]?.map(shop => (
                    <ShopCard key={shop._id} shop={shop} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Display filtered shops when specific category is selected or searching */
        <div className="shops-container">
          {filteredShops.length === 0 ? (
            <div className="empty-state">
              <h3>No shops found</h3>
              <p>
                {searchTerm 
                  ? `No shops found for "${searchTerm}"${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}`
                  : `No shops available in ${selectedCategory} category`
                }
              </p>
              {searchTerm && (
                <button 
                  className="primary-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {selectedCategory !== 'all' && !searchTerm && (
                <div className="category-header">
                  <h3>
                    {categoryConfig[selectedCategory]?.icon || '🏪'} 
                    {categoryConfig[selectedCategory]?.title || selectedCategory}
                  </h3>
                  <span className="shop-count">{filteredShops.length} shops</span>
                </div>
              )}
              <div className="shops-grid">
                {filteredShops.map(shop => (
                  <ShopCard key={shop._id} shop={shop} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Shops;
