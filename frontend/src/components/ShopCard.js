import React from 'react';
import { useNavigate } from 'react-router-dom';

function ShopCard({ shop }) {
  const navigate = useNavigate();

  return (
    <div className="shop-card">
      <img src={shop.image_url} alt={shop.name} />
      <div className="card-info">
        <h3>{shop.name}</h3>
        <p><strong>Category:</strong> {shop.category}</p>
        <p><strong>Owner:</strong> {shop.owner_mobile}</p>
        <p><strong>Hours:</strong> {shop.opening_time} - {shop.closing_time}</p>
        <p><strong>Address:</strong> {shop.address}</p>
         <p><strong>Rating:</strong> {shop.avgRating ? shop.avgRating.toFixed(1) : "No reviews yet"}</p>

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
