// ShopCard.js - Fixed version with proper error handling
import React from 'react';
import { useNavigate } from 'react-router-dom';

function ShopCard({ shop, viewMode = 'grid', categoryConfig = {} }) {
  const navigate = useNavigate();

  const handleShopClick = () => {
    navigate(`/shop/${shop._id}`);
  };

  const getCategoryColor = (category) => {
    return categoryConfig[category]?.color || '#667eea';
  };

  // Safe rating display function
  const renderRatingStars = (rating) => {
    // Convert rating to number and handle null/undefined
    const numericRating = parseFloat(rating);
    
    if (isNaN(numericRating) || numericRating === 0) {
      return <span className="new-badge">New</span>;
    }
    
    const stars = [];
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('✨');
    }
    
    return (
      <span className="rating-stars">
        {stars.join('')} {numericRating.toFixed(1)}
      </span>
    );
  };

  // Safe number formatting
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    const numericValue = typeof num === 'number' ? num : parseFloat(num);
    return isNaN(numericValue) ? '0' : numericValue.toString();
  };

  // Safe delivery time display
  const getDeliveryTime = () => {
    if (!shop.deliveryTime) return '30-40 min';
    const time = parseInt(shop.deliveryTime);
    return isNaN(time) ? '30-40 min' : `${time} min`;
  };

  // Safe price display
  const getPriceForTwo = () => {
    if (!shop.costForTwo) return '₹500 for two';
    const price = parseInt(shop.costForTwo);
    return isNaN(price) ? '₹500 for two' : `₹${price} for two`;
  };

  if (viewMode === 'list') {
    return (
      <div className="shop-card list-view" onClick={handleShopClick}>
        <div className="shop-image">
          <img 
            src={shop.image || '/default-shop.jpg'} 
            alt={shop.name} 
            onError={(e) => {
              e.target.src = '/default-shop.jpg';
            }}
          />
          {shop.discount && (
            <div className="discount-badge">{shop.discount}</div>
          )}
        </div>
        
        <div className="shop-info">
          <div className="shop-header">
            <h3>{shop.name || 'Unknown Shop'}</h3>
            {shop.isPro && <span className="pro-badge">PRO</span>}
          </div>
          
          <div className="shop-meta">
            {renderRatingStars(shop.avgRating)}
            <span>•</span>
            <span className="delivery-time">{getDeliveryTime()}</span>
            <span>•</span>
            <span className="price">{getPriceForTwo()}</span>
          </div>
          
          <p className="category" style={{ color: getCategoryColor(shop.category) }}>
            {shop.category || 'General Store'}
          </p>
          
          <p className="address">{shop.address || 'Address not available'}</p>
          
          <div className="shop-features">
            {shop.safety && (
              <span className="safety-badge">🛡️ {shop.safety}</span>
            )}
            {shop.offers && (
              <span className="offer-badge">{shop.offers}</span>
            )}
          </div>
        </div>
        
        <div className="shop-status">
          {shop.isOpen ? (
            <span className="open">🟢 Open {shop.closing_time && `• Until ${shop.closing_time}`}</span>
          ) : (
            <span className="closed">🔴 Closed {shop.opening_time && `• Opens at ${shop.opening_time}`}</span>
          )}
        </div>
      </div>
    );
  }

  // Grid View (default)
  return (
    <div className="shop-card grid-view" onClick={handleShopClick}>
      <div className="shop-image">
        <img 
          src={shop.image || '/default-shop.jpg'} 
          alt={shop.name} 
          onError={(e) => {
            e.target.src = '/default-shop.jpg';
          }}
        />
        
        {/* Badges */}
        <div className="image-badges">
          {shop.discount && (
            <div className="discount-badge">{shop.discount}</div>
          )}
          {shop.isPro && <div className="pro-badge">PRO</div>}
          {shop.safety && (
            <div className="safety-badge">🛡️ {shop.safety}</div>
          )}
        </div>
        
        {/* Status */}
        <div className="shop-status-badge">
          {shop.isOpen ? '🟢 Open' : '🔴 Closed'}
        </div>
      </div>
      
      <div className="shop-content">
        <div className="shop-header">
          <h3>{shop.name || 'Unknown Shop'}</h3>
          <div className="rating-badge">
            {renderRatingStars(shop.avgRating)}
          </div>
        </div>
        
        <div className="shop-meta">
          <span className="delivery-time">{getDeliveryTime()}</span>
          <span>•</span>
          <span className="price">{getPriceForTwo()}</span>
        </div>
        
        <p className="category" style={{ color: getCategoryColor(shop.category) }}>
          {shop.category || 'General Store'}
        </p>
        
        <p className="address">{shop.address || 'Address not available'}</p>
        
        {shop.offers && (
          <div className="offers-section">
            <span className="offer-tag">🎁 {shop.offers}</span>
          </div>
        )}
        
        <div className="shop-footer">
          <span className="review-count">{formatNumber(shop.reviewCount)}+ reviews</span>
        </div>
      </div>
    </div>
  );
}

export default ShopCard;
