// Enhanced Medical Prescription Modal with WhatsApp Share Button
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
  const sharePrescriptionToWhatsApp = (file) => {
    const whatsappNumber = '9361437687';
    
    const message = `🏥 PRESCRIPTION ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\n\n*Prescription Details:*\n- Please process this prescription order\n- I need home delivery\n- Please provide generic alternatives if available\n\n*Contact Details:*\n[Please add your name and address here]`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show detailed instructions for file sharing
    setTimeout(() => {
      alert(`📋 INSTRUCTIONS TO SHARE PRESCRIPTION:\n\n1. WhatsApp has opened with a pre-filled message\n2. In the WhatsApp chat, click the attachment icon (📎)\n3. Select "${file.type.includes('image') ? 'Gallery' : 'Document'}"\n4. Find and select your prescription file: ${file.name}\n5. Press SEND to share with the medical shop`);
    }, 1500);
  };

  // WhatsApp function for grocery lists
  const shareGroceryListToWhatsApp = (file, listType) => {
    const whatsappNumber = '9361437687';
    
    const message = `🛒 ${listType.toUpperCase()} GROCERY LIST ORDER\n\nShop: ${shop.name}\nCategory: ${shop.category}\nList Type: ${listType}\n\n*Grocery Order Details:*\n- Please process my ${listType} grocery list\n- I need home delivery\n- Please confirm availability and pricing\n\n*Contact Details:*\n[Please add your name and address here]`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show instructions
    setTimeout(() => {
      alert(`📋 INSTRUCTIONS TO SHARE GROCERY LIST:\n\n1. WhatsApp has opened with a pre-filled message\n2. In the WhatsApp chat, click the attachment icon (📎)\n3. Select "${file.type.includes('image') ? 'Gallery' : 'Document'}"\n4. Find and select your grocery list: ${file.name}\n5. Press SEND to share with the grocery shop`);
    }, 1500);
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

  const handleShareToWhatsApp = () => {
    if (selectedFile) {
      if (isMedicalShop) {
        sharePrescriptionToWhatsApp(selectedFile);
      } else if (isGroceryShop) {
        shareGroceryListToWhatsApp(selectedFile, 'weekly');
      }
    }
  };

  // Grocery Shop Functions
  const handleGroceryListUpload = () => {
    setShowGroceryModal(true);
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
          onShareToWhatsApp={handleShareToWhatsApp}
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
          onShareToWhatsApp={handleShareToWhatsApp}
          onFileSelect={handleFileSelect}
        />
      )}
    </div>
  );
}

// Enhanced Prescription Modal Component with Clear Instructions
function PrescriptionModal({ shop, onClose, onCamera, onGallery, selectedFile, filePreview, onShareToWhatsApp, onFileSelect }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content prescription-modal">
        <div className="modal-header">
          <h3>📄 Upload Prescription</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {!selectedFile ? (
            <>
              <div className="upload-instructions">
                <h4>How to Upload Your Prescription</h4>
                <div className="instruction-steps">
                  <div className="step">
                    <span className="step-number">1</span>
                    <span className="step-text">Take a clear photo of your prescription or select from gallery</span>
                  </div>
                  <div className="step">
                    <span className="step-number">2</span>
                    <span className="step-text">Review your prescription photo</span>
                  </div>
                  <div className="step">
                    <span className="step-number">3</span>
                    <span className="step-text">Share directly to WhatsApp with one click</span>
                  </div>
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
                    input.onchange = (e) => onFileSelect(e, 'prescription');
                    input.click();
                  }}
                >
                  <div className="option-icon">📷</div>
                  <div className="option-text">
                    <strong>Take Photo</strong>
                    <span>Use camera</span>
                  </div>
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
                  <div className="option-icon">🖼️</div>
                  <div className="option-text">
                    <strong>Choose File</strong>
                    <span>From gallery</span>
                  </div>
                </button>
              </div>

              <div className="upload-info">
                <div className="info-box">
                  <strong>📋 Important Notes:</strong>
                  <ul>
                    <li>Ensure prescription is clear and readable</li>
                    <li>All text should be visible in the photo</li>
                    <li>Supported formats: Images (JPG, PNG), PDF</li>
                    <li>File size should be less than 10MB</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="file-preview-section">
                <div className="success-header">
                  <div className="success-icon">✅</div>
                  <h4>Prescription Ready to Share!</h4>
                </div>
                
                <div className="preview-container">
                  {filePreview ? (
                    <div className="image-preview">
                      <img src={filePreview} alt="Prescription preview" />
                      <div className="preview-overlay">
                        <span>Prescription Preview</span>
                      </div>
                    </div>
                  ) : (
                    <div className="file-info-card">
                      <div className="file-icon">📄</div>
                      <div className="file-details">
                        <strong>{selectedFile.name}</strong>
                        <span>Size: {(selectedFile.size / 1024).toFixed(2)} KB</span>
                        <span>Type: {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="whatsapp-instructions">
                  <h5>Next Steps:</h5>
                  <div className="instruction-steps">
                    <div className="step">
                      <span className="step-icon">1</span>
                      <span>Click "Share Prescription to WhatsApp" below</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">2</span>
                      <span>WhatsApp will open with a pre-filled message</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">3</span>
                      <span>Attach the prescription file in the chat</span>
                    </div>
                    <div className="step">
                      <span className="step-icon">4</span>
                      <span>Send to complete your order</span>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="whatsapp-share-btn"
                    onClick={onShareToWhatsApp}
                  >
                    <span className="whatsapp-icon">📱</span>
                    Share Prescription to WhatsApp
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

// Grocery List Modal Component (Similar structure)
function GroceryListModal({ shop, onClose, onCamera, onGallery, selectedFile, filePreview, onShareToWhatsApp, onFileSelect }) {
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
                
                <div className="whatsapp-instructions">
                  <p><strong>Instructions:</strong> Click below to open WhatsApp and share your grocery list</p>
                </div>
                
                <button 
                  className="whatsapp-share-btn"
                  onClick={onShareToWhatsApp}
                >
                  <span className="whatsapp-icon">📱</span>
                  Share Grocery List to WhatsApp
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
