// Enhanced ShopCard.js with Medical & Grocery specific features
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
  const [filePreview, setFilePreview] = useState(null);
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

  // WhatsApp function for medical prescriptions
  const sendPrescriptionToWhatsApp = (file) => {
    const whatsappNumber = '9361437687';
    
    const message = `🏥 PRESCRIPTION ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\n\n*Prescription Details:*\n- Please process this prescription order\n- I need home delivery\n- Please provide generic alternatives if available\n\n*Contact Details:*\n[Please add your name and address here]`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show file sharing instructions
    setTimeout(() => {
      alert(`Please share the prescription file in the WhatsApp chat:\n\n1. Go to the WhatsApp chat that just opened\n2. Click the attachment icon (📎)\n3. Select "${file.type.includes('image') ? 'Gallery' : 'Document'}"\n4. Choose the file: ${file.name}`);
    }, 1000);
  };

  // WhatsApp function for grocery lists
  const sendGroceryListToWhatsApp = (file, listType) => {
    const whatsappNumber = '9361437687';
    
    const message = `🛒 ${listType.toUpperCase()} GROCERY LIST ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\nList Type: ${listType}\n\n*Grocery Order Details:*\n- Please process my ${listType} grocery list\n- I need home delivery\n- Please confirm availability and pricing\n\n*Contact Details:*\n[Please add your name and address here]`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show file sharing instructions
    setTimeout(() => {
      alert(`Please share the grocery list in the WhatsApp chat:\n\n1. Go to the WhatsApp chat that just opened\n2. Click the attachment icon (📎)\n3. Select "${file.type.includes('image') ? 'Gallery' : 'Document'}"\n4. Choose the file: ${file.name}`);
    }, 1000);
  };

  // Medical Shop Functions
  const handlePrescriptionUpload = () => {
    setShowPrescriptionModal(true);
    setSelectedFile(null);
    setFilePreview(null);
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
      
      // Create preview for images
      if (file.type.includes('image')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSendToWhatsApp = () => {
    if (selectedFile) {
      if (isMedicalShop) {
        sendPrescriptionToWhatsApp(selectedFile);
      } else if (isGroceryShop) {
        sendGroceryListToWhatsApp(selectedFile, 'weekly'); // Default to weekly
      }
      // Reset after sending
      setSelectedFile(null);
      setFilePreview(null);
      setShowPrescriptionModal(false);
      setShowGroceryModal(false);
    }
  };

  // Grocery Shop Functions
  const handleGroceryListUpload = () => {
    setShowGroceryModal(true);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleGroceryListSubmit = (file, listType) => {
    sendGroceryListToWhatsApp(file, listType);
    setShowGroceryModal(false);
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Category detection
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
          onChange={(e) => handleFileSelect(e, isMedicalShop ? 'prescription' : 'grocery')}
        />
        <input
          type="file"
          ref={cameraInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          capture="camera"
          onChange={(e) => handleFileSelect(e, isMedicalShop ? 'prescription' : 'grocery')}
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
              {/* Grocery Shop - Upload Grocery List Only */}
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
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedFile(null);
            setFilePreview(null);
          }}
          onCamera={triggerCamera}
          onGallery={triggerGallery}
          selectedFile={selectedFile}
          filePreview={filePreview}
          onSendToWhatsApp={handleSendToWhatsApp}
          onFileSelect={handleFileSelect}
        />
      )}

      {/* Grocery List Modal for Grocery Shops */}
      {showGroceryModal && (
        <GroceryListModal 
          shop={shop}
          onClose={() => {
            setShowGroceryModal(false);
            setSelectedFile(null);
            setFilePreview(null);
          }}
          onCamera={triggerCamera}
          onGallery={triggerGallery}
          selectedFile={selectedFile}
          filePreview={filePreview}
          onSendToWhatsApp={handleSendToWhatsApp}
          onFileSelect={handleFileSelect}
          onSubmit={handleGroceryListSubmit}
        />
      )}
    </div>
  );
}

// Enhanced Prescription Modal Component with Send to WhatsApp button
function PrescriptionModal({ shop, onClose, onCamera, onGallery, selectedFile, filePreview, onSendToWhatsApp, onFileSelect }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📄 Upload Prescription</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!selectedFile ? (
            <>
              <p>Choose how you want to upload your prescription for <strong>{shop.name}</strong></p>
              
              <div className="upload-options">
                <button 
                  className="upload-option-btn camera-btn" 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'camera';
                    input.onchange = (e) => onFileSelect(e, 'prescription');
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
                    input.onchange = (e) => onFileSelect(e, 'prescription');
                    input.click();
                  }}
                >
                  🖼️ Choose from Gallery
                </button>
              </div>

              <div className="upload-info">
                <p><strong>Note:</strong> Your prescription will be sent to WhatsApp</p>
                <p>Supported formats: Images (JPG, PNG), PDF</p>
              </div>
            </>
          ) : (
            <>
              <div className="file-preview-section">
                <h4>Prescription Selected ✅</h4>
                {filePreview ? (
                  <div className="image-preview">
                    <img src={filePreview} alt="Prescription preview" />
                  </div>
                ) : (
                  <div className="file-info">
                    <p>📄 {selectedFile.name}</p>
                    <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                
                <button 
                  className="whatsapp-send-btn"
                  onClick={onSendToWhatsApp}
                >
                  📱 Send to WhatsApp
                </button>
                
                <button 
                  className="change-file-btn"
                  onClick={() => {
                    onFileSelect({ target: { files: [] } }, 'prescription');
                  }}
                >
                  🔄 Choose Different File
                </button>
              </div>
            </>
          )}
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
function GroceryListModal({ shop, onClose, onCamera, onGallery, selectedFile, filePreview, onSendToWhatsApp, onFileSelect, onSubmit }) {
  const [listType, setListType] = useState('weekly');

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📝 Upload Grocery List</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!selectedFile ? (
            <>
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
                <button 
                  className="upload-option-btn camera-btn" 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'camera';
                    input.onchange = (e) => onFileSelect(e, 'grocery');
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
                    input.onchange = (e) => onFileSelect(e, 'grocery');
                    input.click();
                  }}
                >
                  🖼️ Choose from Gallery
                </button>
              </div>

              <div className="upload-info">
                <p><strong>Note:</strong> Your grocery list will be sent to WhatsApp</p>
                <p>Supported formats: Images (JPG, PNG), PDF</p>
              </div>
            </>
          ) : (
            <>
              <div className="file-preview-section">
                <h4>Grocery List Selected ✅</h4>
                <p>List Type: <strong>{listType}</strong></p>
                {filePreview ? (
                  <div className="image-preview">
                    <img src={filePreview} alt="Grocery list preview" />
                  </div>
                ) : (
                  <div className="file-info">
                    <p>📄 {selectedFile.name}</p>
                    <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
                
                <button 
                  className="whatsapp-send-btn"
                  onClick={onSendToWhatsApp}
                >
                  📱 Send to WhatsApp
                </button>
                
                <button 
                  className="change-file-btn"
                  onClick={() => {
                    onFileSelect({ target: { files: [] } }, 'grocery');
                  }}
                >
                  🔄 Choose Different File
                </button>
              </div>
            </>
          )}
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
