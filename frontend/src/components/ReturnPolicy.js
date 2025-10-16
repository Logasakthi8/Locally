// ReturnPolicy.js
import React from 'react';

function ReturnPolicy() {
  const handleWhatsAppClick = () => {
    const phoneNumber = '987654321';
    const message = 'Hello, I would like to request a return/exchange for my product.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="return-policy-page">
      <div className="policy-container">
        <h1>Return Policy</h1>
        
        <div className="policy-content">
          <p><strong>Products are sold directly by nearby shops.</strong></p>
          <p>Returns or exchanges depend on each shop's individual policy.</p>
          <p>If there's any issue, please contact us through WhatsApp, and we'll help coordinate with the shop to resolve it quickly.</p>
        </div>

        <div className="action-section">
          <button 
            onClick={handleWhatsAppClick}
            className="whatsapp-button"
          >
            Return or Exchange Products
          </button>
        </div>

        <div className="support-info">
          <p>We're here to help you resolve any issues with your purchase.</p>
        </div>
      </div>
    </div>
  );
}

export default ReturnPolicy;
