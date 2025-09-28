import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function ShopCard({ shop }) {
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(shop.avgRating || 0);
  const [showReview, setShowReview] = useState(false);

  const isShopOpen = () => {
    if (!shop.opening_time || !shop.closing_time) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight
    
    const [openHour, openMinute] = shop.opening_time.split(':').map(Number);
    const [closeHour, closeMinute] = shop.closing_time.split(':').map(Number);
    
    const openingTime = openHour * 60 + openMinute;
    const closingTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const shopIsOpen = isShopOpen();

  const submitRating = async (rating) => {
    try {
      const response = await fetch(`${config.apiUrl}/reviews/${shop._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ rating }),
        credentials: 'include'
      });

      if (response.ok) {
        // ✅ Fetch updated average rating after submitting
        const avgRes = await fetch(`${config.apiUrl}/reviews/${shop._id}/average`);
        const avgData = await avgRes.json();

        setUserRating(rating);
        shop.avgRating = avgData.average_rating; // update shop object directly
        alert('Thank you for your review!');
        setShowReview(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting rating');
    }
  };

  const handleViewShop = () => {
    if (shopIsOpen) {
      navigate(`/products/${shop._id}`);
    } else {
      alert('This shop is closed now. You can place the order, and it will be delivered tomorrow once the shop opens.');
    }
  };

  return (
    <div className={`shop-card ${!shopIsOpen ? 'shop-closed' : ''}`}>
      <img src={shop.image_url} alt={shop.name} />
      <div className="card-info">
        <div className="shop-header">
          <h3>{shop.name}</h3>
          <div className={`shop-status ${shopIsOpen ? 'open' : 'closed'}`}>
            {shopIsOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </div>
        </div>
        
        <p><strong>Category:</strong> {shop.category}</p>
        <p><strong>Owner:</strong> {shop.owner_mobile}</p>
        <p><strong>Hours:</strong> {shop.opening_time} - {shop.closing_time}</p>
        <p><strong>Address:</strong> {shop.address}</p>

        <p><strong>Average Rating:</strong> {shop.avgRating ? shop.avgRating.toFixed(1) : "0.0"} ⭐</p>

        {/* Show stars only if user clicks Give Review */}
        {showReview && (
          <div className="stars" style={{ margin: '0.5rem 0' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  cursor: 'pointer',
                  color: (hoverRating || userRating) >= star ? '#ffc107' : '#e4e5e9',
                  fontSize: '1.5rem',
                  marginRight: '2px'
                }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => submitRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        )}

        <button 
          className={`primary-btn ${!shopIsOpen ? 'btn-disabled' : ''}`}
          onClick={handleViewShop}
          disabled={!shopIsOpen}
        >
          {shopIsOpen ? 'View Shop' : 'Shop Closed'}
        </button>

        {!shopIsOpen && (
          <div className="closed-message" style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#856404'
          }}>
            This shop is closed now. You can place the order, and it will be delivered tomorrow once the shop opens.
          </div>
        )}

        {/* Give Review Button */}
        <button 
          className="secondary-btn" 
          style={{ marginTop: '0.5rem' }}
          onClick={() => setShowReview(!showReview)}
        >
          {showReview ? "Cancel Review" : "Give Review"}
        </button>
      </div>
    </div>
  );
}

export default ShopCard;
