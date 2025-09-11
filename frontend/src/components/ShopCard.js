import React from 'react';
import { useNavigate } from 'react-router-dom';

function ShopCard({ shop }) {
  const navigate = useNavigate();

  // Function to render stars based on avgRating
  const renderStars = (rating) => {
    if (!rating) return <span>No reviews yet</span>;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <span className="stars">
        {"★".repeat(fullStars)}
        {halfStar && "☆"} 
        {"☆".repeat(emptyStars)}
        <span style={{ marginLeft: "6px" }}>({rating.toFixed(1)})</span>
      </span>
    );
  };

  return (
    <div className="shop-card">
      <img src={shop.image_url} alt={shop.name} />
      <div className="card-info">
        <h3>{shop.name}</h3>
        <p><strong>Category:</strong> {shop.category}</p>
        <p><strong>Owner:</strong> {shop.owner_mobile}</p>
        <p><strong>Hours:</strong> {shop.opening_time} - {shop.closing_time}</p>
        <p><strong>Address:</strong> {shop.address}</p>
        
        {/* ⭐ Rating Section */}
        <p><strong>Rating:</strong> {renderStars(shop.avgRating)}</p>

        <button 
          className="primary-btn"
          onClick={() => navigate(`/products/${shop._id}`)}
        >
          View Shop
        </button>
      </div>
    </div>
  );
}

export default ShopCard;
