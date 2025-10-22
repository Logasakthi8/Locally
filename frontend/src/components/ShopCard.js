// Enhanced ShopCard.js with category-specific actions
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function ShopCard({ shop }) {
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(shop.avgRating || 0);
  const [showReview, setShowReview] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

  const handleWhatsAppContact = (message, file = null) => {
    const whatsappNumber = '9089876590';
    
    if (file) {
      // For file uploads, we'll use a different approach
      const textMessage = `${message}\n\nShop: ${shop.name}\nCategory: ${shop.category}`;
      const encodedMessage = encodeURIComponent(textMessage);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    } else {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Medical Shop Functions
  const handlePrescriptionUpload = () => {
    setShowPrescriptionModal(true);
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === 'prescription') {
        handlePrescriptionSubmit(file);
      } else if (type === 'grocery') {
        handleGroceryListSubmit(file);
      }
    }
  };

  const handlePrescriptionSubmit = (file) => {
    const message = `🏥 PRESCRIPTION ORDER\n\nShop: ${shop.name}\nPrescription attached\n\nPlease process this prescription order.`;
    handleWhatsAppContact(message, file);
    setShowPrescriptionModal(false);
    alert('Prescription submitted! Opening WhatsApp...');
  };

  // Grocery Shop Functions
  const handleGroceryListUpload = () => {
    setShowGroceryModal(true);
  };

  const handleGroceryListSubmit = (file) => {
    const message = `🛒 GROCERY LIST ORDER\n\nShop: ${shop.name}\nGrocery list attached\n\nPlease process this grocery order.`;
    handleWhatsAppContact(message, file);
    setShowGroceryModal(false);
    alert('Grocery list submitted! Opening WhatsApp...');
  };

  const isMedicalShop = shop.category === 'Medicals';
  const isGroceryShop = shop.category === 'Grocery';
  const isOtherShop = !isMedicalShop && !isGroceryShop;

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

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,application/pdf"
          onChange={(e) => handleFileSelect(e, showPrescriptionModal ? 'prescription' : 'grocery')}
        />
        <input
          type="file"
          ref={cameraInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          capture="camera"
          onChange={(e) => handleFileSelect(e, showPrescriptionModal ? 'prescription' : 'grocery')}
        />

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
              {/* Grocery Shop - Product List + Upload Grocery List */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Product List
              </button>
              <button 
                className="grocery-list-btn"
                onClick={handleGroceryListUpload}
              >
                📝 Upload Grocery List
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
          onCamera={triggerCamera}
          onGallery={triggerGallery}
        />
      )}

      {/* Grocery List Modal for Grocery Shops */}
      {showGroceryModal && (
        <GroceryListModal 
          shop={shop}
          onClose={() => setShowGroceryModal(false)}
          onCamera={triggerCamera}
          onGallery={triggerGallery}
        />
      )}
    </div>
  );
}

// Prescription Modal Component
function PrescriptionModal({ shop, onClose, onCamera, onGallery }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📄 Upload Prescription</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Choose how you want to upload your prescription for <strong>{shop.name}</strong></p>
          
          <div className="upload-options">
            <button className="upload-option-btn camera-btn" onClick={onCamera}>
              📷 Take Photo
            </button>
            <button className="upload-option-btn gallery-btn" onClick={onGallery}>
              🖼️ Choose from Gallery
            </button>
          </div>

          <div className="upload-info">
            <p><strong>Note:</strong> Your prescription will be sent to our medical partner via WhatsApp</p>
            <p>Supported formats: Images (JPG, PNG), PDF</p>
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

// Grocery List Modal Component
function GroceryListModal({ shop, onClose, onCamera, onGallery }) {
  const [listType, setListType] = useState('weekly');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📝 Upload Grocery List</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Upload your {listType} grocery list for <strong>{shop.name}</strong></p>
          
          <div className="list-type-selector">
            <label>List Type:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="weekly"
                  checked={listType === 'weekly'}
                  onChange={(e) => setListType(e.target.value)}
                />
                Weekly List
              </label>
              <label>
                <input
                  type="radio"
                  value="monthly"
                  checked={listType === 'monthly'}
                  onChange={(e) => setListType(e.target.value)}
                />
                Monthly List
              </label>
            </div>
          </div>

          <div className="upload-options">
            <button className="upload-option-btn camera-btn" onClick={onCamera}>
              📷 Take Photo
            </button>
            <button className="upload-option-btn gallery-btn" onClick={onGallery}>
              🖼️ Choose from Gallery
            </button>
          </div>

          <div className="upload-info">
            <p><strong>Note:</strong> Your {listType} grocery list will be sent to the shop via WhatsApp</p>
            <p>Supported formats: Images (JPG, PNG), PDF</p>
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
