// ShopCard.js - Zomato-style Enhanced
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

  const renderRatingStars = (rating) => {
    if (!rating) return 'New';
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    if (hasHalfStar) {
      stars.push('✨');
    }
    
    return (
      <span className="rating-stars">
        {stars.join('')} {rating}
      </span>
    );
  };

  if (viewMode === 'list') {
    return (
      <div className="shop-card list-view" onClick={handleShopClick}>
        <div className="shop-image">
          <img src={shop.image || '/default-shop.jpg'} alt={shop.name} />
          {shop.discount && (
            <div className="discount-badge">{shop.discount}</div>
          )}
        </div>
        
        <div className="shop-info">
          <div className="shop-header">
            <h3>{shop.name}</h3>
            {shop.isPro && <span className="pro-badge">PRO</span>}
          </div>
          
          <div className="shop-meta">
            {renderRatingStars(shop.avgRating)}
            <span>•</span>
            <span className="delivery-time">{shop.deliveryTime} min</span>
            <span>•</span>
            <span className="price">₹{shop.costForTwo} for two</span>
          </div>
          
          <p className="category" style={{ color: getCategoryColor(shop.category) }}>
            {shop.category}
          </p>
          
          <p className="address">{shop.address}</p>
          
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
            <span className="open">🟢 Open • Until {shop.closing_time}</span>
          ) : (
            <span className="closed">🔴 Closed • Opens at {shop.opening_time}</span>
          )}
        </div>
      </div>
    );
  }

  // Grid View (default)
  return (
    <div className="shop-card grid-view" onClick={handleShopClick}>
      <div className="shop-image">
        <img src={shop.image || '/default-shop.jpg'} alt={shop.name} />
        
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
          <h3>{shop.name}</h3>
          <div className="rating-badge">
            {renderRatingStars(shop.avgRating)}
          </div>
        </div>
        
        <div className="shop-meta">
          <span className="delivery-time">{shop.deliveryTime} min</span>
          <span>•</span>
          <span className="price">₹{shop.costForTwo} for two</span>
        </div>
        
        <p className="category" style={{ color: getCategoryColor(shop.category) }}>
          {shop.category}
        </p>
        
        <p className="address">{shop.address}</p>
        
        {shop.offers && (
          <div className="offers-section">
            <span className="offer-tag">🎁 {shop.offers}</span>
          </div>
        )}
        
        <div className="shop-footer">
          <span className="review-count">{shop.reviewCount}+ reviews</span>
        </div>
      </div>
    </div>
  );
}

export default ShopCard;
