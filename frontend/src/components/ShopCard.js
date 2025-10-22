// Enhanced ShopCard.js with working WhatsApp integration
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
  const [selectedFile, setSelectedFile] = useState(null);
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

  // Enhanced WhatsApp function with proper file handling
  const handleWhatsAppSubmit = (type, file = null, listType = '') => {
    const whatsappNumber = '9361437687';
    
    let message = '';
    
    switch (type) {
      case 'prescription':
        message = `🏥 PRESCRIPTION ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\n\n*Prescription Details:*\n- Please process this prescription order\n- I need home delivery\n- Please provide generic alternatives if available\n\n*Contact Details:*\n[Please add your name and address here]`;
        break;
        
      case 'grocery':
        message = `🛒 ${listType.toUpperCase()} GROCERY LIST ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\nList Type: ${listType}\n\n*Grocery Order Details:*\n- Please process my ${listType} grocery list\n- I need home delivery\n- Please confirm availability and pricing\n\n*Contact Details:*\n[Please add your name and address here]`;
        break;
        
      case 'hotel':
        message = `🍽️ FOOD ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\n\n*Order Details:*\n- Please check the attached food order\n- I need home delivery\n- Please confirm preparation time\n\n*Contact Details:*\n[Please add your name and address here]`;
        break;
        
      default:
        message = `🛍️ ORDER REQUEST\n\nShop: ${shop.name}\nCategory: ${shop.category}\n\n*Order Details:*\n- Please check the attached order details\n- I need more information about products\n\n*Contact Details:*\n[Please add your name and address here]`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp first
    window.open(whatsappUrl, '_blank');
    
    // Show instructions for file sharing
    if (file) {
      setTimeout(() => {
        alert(`Please share the ${file.type.includes('image') ? 'photo' : 'file'} in the WhatsApp chat that just opened.\n\nSteps:\n1. Go to the WhatsApp chat\n2. Click the attachment icon (📎)\n3. Select "${file.type.includes('image') ? 'Gallery' : 'Document'}"\n4. Choose the file you selected`);
      }, 1000);
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
      setSelectedFile(file);
      if (type === 'prescription') {
        handlePrescriptionSubmit(file);
      } else if (type === 'grocery') {
        handleGroceryListSubmit(file);
      }
    }
  };

  const handlePrescriptionSubmit = (file) => {
    handleWhatsAppSubmit('prescription', file);
    setShowPrescriptionModal(false);
    setSelectedFile(null);
  };

  // Grocery Shop Functions
  const handleGroceryListUpload = () => {
    setShowGroceryModal(true);
  };

  const handleGroceryListSubmit = (file, listType) => {
    handleWhatsAppSubmit('grocery', file, listType);
    setShowGroceryModal(false);
    setSelectedFile(null);
  };

  // Hotel/Fast Food Functions
  const handleFoodOrderUpload = () => {
    setShowGroceryModal(true); // Reuse grocery modal for food orders
  };

  const handleFoodOrderSubmit = (file) => {
    handleWhatsAppSubmit('hotel', file);
    setShowGroceryModal(false);
    setSelectedFile(null);
  };

  // Category detection
  const isMedicalShop = shop.category === 'Medicals';
  const isGroceryShop = shop.category === 'Grocery';
  const isVegetableShop = shop.category === 'Vegetable';
  const isBakeryShop = shop.category === 'Bakery';
  const isPrintingShop = shop.category === 'Printing Shop';
  const isFootwearShop = shop.category === 'Footwear & Accessories';
  const isHotelFastFood = shop.category === 'Fast Food / Hotel';
  const isFancyShop = shop.category === 'Fancy';
  
  // Show upload option for shops that need list/order uploads
  const showUploadOption = isMedicalShop || isGroceryShop || isVegetableShop || 
                          isBakeryShop || isHotelFastFood || isFancyShop;

  // Show product list for shops that have products
  const showProductList = isGroceryShop || isVegetableShop || isBakeryShop || 
                         isPrintingShop || isFootwearShop || isFancyShop;

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

          {isVegetableShop && (
            <>
              {/* Vegetable Shop - Product List + Upload List */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Vegetables
              </button>
              <button 
                className="vegetable-list-btn"
                onClick={handleGroceryListUpload}
              >
                🥦 Upload Vegetable List
              </button>
            </>
          )}

          {isBakeryShop && (
            <>
              {/* Bakery Shop - Product List + Upload Order */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Bakery Items
              </button>
              <button 
                className="bakery-order-btn"
                onClick={handleGroceryListUpload}
              >
                🍞 Upload Bakery Order
              </button>
            </>
          )}

          {isHotelFastFood && (
            <>
              {/* Hotel/Fast Food - Upload Food Order Only */}
              <button 
                className="food-order-btn"
                onClick={handleFoodOrderUpload}
              >
                🍔 Upload Food Order
              </button>
            </>
          )}

          {isFancyShop && (
            <>
              {/* Fancy Shop - Product List + Upload Order */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Products
              </button>
              <button 
                className="fancy-order-btn"
                onClick={handleGroceryListUpload}
              >
                💎 Upload Order List
              </button>
            </>
          )}

          {isPrintingShop && (
            <>
              {/* Printing Shop - View Products Only */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Printing Services
              </button>
            </>
          )}

          {isFootwearShop && (
            <>
              {/* Footwear Shop - View Products Only */}
              <button 
                className="primary-btn"
                onClick={handleShopClick}
              >
                View Footwear Collection
              </button>
            </>
          )}

          {/* Fallback for any other categories */}
          {!isMedicalShop && !isGroceryShop && !isVegetableShop && !isBakeryShop && 
           !isHotelFastFood && !isFancyShop && !isPrintingShop && !isFootwearShop && (
            <button 
              className="primary-btn"
              onClick={handleShopClick}
            >
              View Products
            </button>
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
          onSubmit={handlePrescriptionSubmit}
        />
      )}

      {/* Grocery List Modal for Grocery, Vegetable, Bakery, Hotel/Fast Food, Fancy Shops */}
      {showGroceryModal && (
        <GroceryListModal 
          shop={shop}
          onClose={() => setShowGroceryModal(false)}
          onCamera={triggerCamera}
          onGallery={triggerGallery}
          onSubmit={isHotelFastFood ? handleFoodOrderSubmit : handleGroceryListSubmit}
          isFoodOrder={isHotelFastFood}
          isMedical={isMedicalShop}
        />
      )}
    </div>
  );
}

// Enhanced Prescription Modal Component
function PrescriptionModal({ shop, onClose, onCamera, onGallery, onSubmit }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-submit after file selection
      setTimeout(() => {
        onSubmit(file);
      }, 500);
    }
  };

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
            <button 
              className="upload-option-btn camera-btn" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'camera';
                input.onchange = handleFileSelect;
                input.click();
              }}
            >
              📷 Take Photo
            </button>
            <button 
              className="upload-option-btn gallery-btn" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.onchange = handleFileSelect;
                input.click();
              }}
            >
              🖼️ Choose from Gallery
            </button>
          </div>

          <div className="upload-info">
            <p><strong>Note:</strong> Your prescription will be sent to WhatsApp number 9361437687</p>
            <p>After selecting a file, WhatsApp will open. Please share the file in the chat.</p>
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

// Enhanced Grocery List Modal Component
function GroceryListModal({ shop, onClose, onCamera, onGallery, onSubmit, isFoodOrder = false, isMedical = false }) {
  const [listType, setListType] = useState('weekly');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (isFoodOrder) {
        onSubmit(file);
      } else {
        onSubmit(file, listType);
      }
    }
  };

  const getModalTitle = () => {
    if (isFoodOrder) return '🍔 Upload Food Order';
    if (isMedical) return '📄 Upload Prescription';
    if (shop.category === 'Vegetable') return '🥦 Upload Vegetable List';
    if (shop.category === 'Bakery') return '🍞 Upload Bakery Order';
    if (shop.category === 'Fancy') return '💎 Upload Order List';
    return '📝 Upload Grocery List';
  };

  const getDescription = () => {
    if (isFoodOrder) return `Upload your food order for <strong>${shop.name}</strong>`;
    if (isMedical) return `Upload your prescription for <strong>${shop.name}</strong>`;
    if (shop.category === 'Vegetable') return `Upload your vegetable list for <strong>${shop.name}</strong>`;
    if (shop.category === 'Bakery') return `Upload your bakery order for <strong>${shop.name}</strong>`;
    if (shop.category === 'Fancy') return `Upload your order list for <strong>${shop.name}</strong>`;
    return `Upload your ${listType} grocery list for <strong>${shop.name}</strong>`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{getModalTitle()}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p dangerouslySetInnerHTML={{ __html: getDescription() }} />
          
          {!isFoodOrder && !isMedical && (
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
          )}

          <div className="upload-options">
            <button 
              className="upload-option-btn camera-btn" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'camera';
                input.onchange = handleFileSelect;
                input.click();
              }}
            >
              📷 Take Photo
            </button>
            <button 
              className="upload-option-btn gallery-btn" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,application/pdf';
                input.onchange = handleFileSelect;
                input.click();
              }}
            >
              🖼️ Choose from Gallery
            </button>
          </div>

          <div className="upload-info">
            <p><strong>Note:</strong> Your order will be sent to WhatsApp number 9361437687</p>
            <p>After selecting a file, WhatsApp will open. Please share the file in the chat.</p>
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
