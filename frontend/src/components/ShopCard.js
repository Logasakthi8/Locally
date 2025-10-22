// Enhanced ShopCard.js with hybrid system
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import PrescriptionModal from './PrescriptionModal';

function ShopCard({ shop }) {
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(shop.avgRating || 0);
  const [showReview, setShowReview] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

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
        const avgRes = await fetch(`${config.apiUrl}/reviews/${shop._id}/average`);
        const avgData = await avgRes.json();

        setUserRating(rating);
        shop.avgRating = avgData.average_rating;
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

  const handleShopClick = () => {
    navigate(`/products/${shop._id}`);
  };

  const handleWhatsAppContact = () => {
    const message = `Hi ${shop.name}, I would like to know more about your products/services.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${shop.owner_mobile}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const isMedicalShop = shop.category === 'Medical';

  return (
    <div className="shop-card">
      <img src={shop.image_url} alt={shop.name} />
      <div className="card-info">
        <div className="shop-header">
          <h3>{shop.name}</h3>
          <span 
            className={`status-indicator ${shop.isOpen ? 'status-open' : 'status-closed'}`}
            title={shop.isOpen ? 'Shop is currently open' : 'Shop is currently closed'}
          >
            {shop.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
          </span>
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

        {/* Hybrid System Buttons */}
        <div className="shop-actions">
          {isMedicalShop ? (
            <>
              {/* Medical Shop - Prescription Upload Model */}
              <button 
                className="whatsapp-btn"
                onClick={handleWhatsAppContact}
              >
                📞 WhatsApp Contact
              </button>
              <button 
                className="prescription-btn"
                onClick={() => setShowPrescriptionModal(true)}
              >
                📄 Upload Prescription
              </button>
            </>
          ) : (
            <>
              {/* Other Shops - Product Listing Model */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Products
              </button>
              <button 
                className="whatsapp-btn"
                onClick={handleWhatsAppContact}
              >
                💬 Contact Shop
              </button>
            </>
          )}
        </div>

        {/* Give Review Button */}
        <button 
          className="secondary-btn" 
          style={{ marginTop: '0.5rem' }}
          onClick={() => setShowReview(!showReview)}
        >
          {showReview ? "Cancel Review" : "Give Review"}
        </button>
      </div>

      {/* Prescription Modal for Medical Shops */}
      {showPrescriptionModal && (
        <PrescriptionModal 
          shop={shop}
          onClose={() => setShowPrescriptionModal(false)}
        />
      )}
    </div>
  );
}

export default ShopCard;
