// ShopCard.js with Hotel/FastFood category showing "View Menus"
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function ShopCard({ shop }) {
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(shop.avgRating || 0);
  const [showReview, setShowReview] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);

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

  // Direct WhatsApp function for medical prescriptions
  const sharePrescriptionToWhatsApp = () => {
    const whatsappNumber = '9361437687'; // Your default number

    const message = `Prescription Order - I want to order through prescription`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  const shareGroceryListToWhatsApp = () => {
    const whatsappNumber = '9361437687'; // Your default number

   const message = `Grocery Order - I want to order through my Grocery List`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp directly
    window.open(whatsappUrl, '_blank');
  };

  // Medical Shop Functions
  const handlePrescriptionUpload = () => {
    setShowPrescriptionModal(true);
  };

  // Grocery Shop Functions
  const handleGroceryListUpload = () => {
    setShowGroceryModal(true);
  };

  // Category detection
  const isMedicalShop = shop.category === 'Medicals';
  const isGroceryShop = shop.category === 'Grocery';
  const isHotelFastFood = shop.category === 'Hotel/FastFood';
  const isOtherShop = !isMedicalShop && !isGroceryShop && !isHotelFastFood;

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

        {/* Category-Specific Actions */}
        <div className="shop-actions">
          {isMedicalShop && (
            <>
              {/* Medical Shop - Upload Prescription Only */}
              <button 
                className="prescription-btn"
                onClick={handlePrescriptionUpload}
              >
                📄 Upload Prescription
              </button>
            </>
          )}

          {isGroceryShop && (
            <>
              {/* Grocery Shop - BOTH View Products AND Upload Grocery List */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Products
              </button>
              <button 
                className="grocery-list-btn"
                onClick={handleGroceryListUpload}
              >
                📝 Upload Grocery List
              </button>
            </>
          )}

          {isHotelFastFood && (
            <>
              {/* Hotel/FastFood Shop - View Menus Only */}
              <button 
                className="menu-btn"
                onClick={handleShopClick}
              >
                🍽️ View Menus
              </button>
            </>
          )}

          {isOtherShop && (
            <>
              {/* Other Shops - View Products Only */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Products
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
          onShareToWhatsApp={sharePrescriptionToWhatsApp}
        />
      )}

      {/* Grocery List Modal for Grocery Shops */}
      {showGroceryModal && (
        <GroceryListModal 
          shop={shop}
          onClose={() => setShowGroceryModal(false)}
          onShareToWhatsApp={shareGroceryListToWhatsApp}
        />
      )}
    </div>
  );
}

// Simplified Prescription Modal Component - Only Instructions & WhatsApp Button
function PrescriptionModal({ shop, onClose, onShareToWhatsApp }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content prescription-modal">
        <div className="modal-header">
          <h3>📄 Share Prescription via WhatsApp</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="instructions-section">
            <div className="instruction-header">
              <div className="instruction-icon">📋</div>
              <h4>How to Share Your Prescription</h4>
            </div>

            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Click the WhatsApp Button Below</strong>
                  <p>This will open WhatsApp with a pre-filled message</p>
                </div>
              </div>

              <div className="step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Attach Your Prescription</strong>
                  <p>In WhatsApp, click the attachment icon (📎) and select your prescription file</p>
                </div>
              </div>

              <div className="step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Send to Medical Shop</strong>
                  <p>Press send to share your prescription with {shop.name}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="important-notes">
            <h5>📌 Important Notes:</h5>
            <ul>
              <li>Ensure your prescription is clear and readable</li>
              <li>Take a good quality photo in proper lighting</li>
              <li>All text should be visible and not blurry</li>
              <li>You can share images (JPG, PNG) or PDF files</li>
            </ul>
          </div>

          <div className="whatsapp-action-section">
            <button 
              className="whatsapp-direct-btn"
              onClick={onShareToWhatsApp}
            >
              <span className="whatsapp-icon">📱</span>
              Open WhatsApp to Share Prescription
            </button>

            <p className="whatsapp-note">
              WhatsApp will open with a pre-filled message. Just attach your prescription file and send.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="secondary-btn" 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Simplified Grocery List Modal Component
function GroceryListModal({ shop, onClose, onShareToWhatsApp }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📝 Share Grocery List via WhatsApp</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="instructions-section">
            <div className="instruction-header">
              <div className="instruction-icon">🛒</div>
              <h4>How to Share Your Grocery List</h4>
            </div>

            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Click the WhatsApp Button</strong>
                  <p>Open WhatsApp with a pre-filled order message</p>
                </div>
              </div>

              <div className="step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Attach Your Grocery List</strong>
                  <p>In WhatsApp, attach your list as an image or document</p>
                </div>
              </div>

              <div className="step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Send to Grocery Shop</strong>
                  <p>Share your list with {shop.name} for processing</p>
                </div>
              </div>
            </div>
          </div>

          <div className="whatsapp-action-section">
            <button 
              className="whatsapp-direct-btn grocery"
              onClick={onShareToWhatsApp}
            >
              <span className="whatsapp-icon">📱</span>
              Open WhatsApp to Share Grocery List
            </button>

            <p className="whatsapp-note">
              WhatsApp will open with your order details. Attach your grocery list and send.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button   
            type="button" 
            className="secondary-btn" 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShopCard;
