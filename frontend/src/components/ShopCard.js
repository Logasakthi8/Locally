import React, { useState } from 'react';
import config from '../config';

function ShopCard({ shop }) {
  const [hoverRating, setHoverRating] = useState(0);  // Hovered star
  const [userRating, setUserRating] = useState(shop.avgRating || 0); // Current rating

  const submitRating = async (rating) => {
    try {
      const response = await fetch(`${config.apiUrl}/reviews/${shop._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ rating }),
        credentials: 'include'  // ensure session cookie is sent
      });

      if (response.ok) {
        setUserRating(rating);  // Update UI immediately
        alert('Thank you for your rating!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit rating');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting rating');
    }
  };

  return (
    <div className="shop-card">
      <h3>{shop.name}</h3>
      <p>{shop.address}</p>

      {/* Star Rating */}
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              cursor: 'pointer',
              color: (hoverRating || userRating) >= star ? '#ffc107' : '#e4e5e9',
              fontSize: '1.5rem',
            }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => submitRating(star)}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

export default ShopCard;
