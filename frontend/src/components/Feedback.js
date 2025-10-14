import React, { useState, useEffect } from 'react';
import config from '../config';

const FeedbackSystem = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shop_type: '',
    shop_name: '',
    shop_address: '',
    products: '',
    notify_me: 'no',
    contact: '',
    preference: 'no_preference'
  });
  const [loading, setLoading] = useState(false);
  const [showCount, setShowCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking effect for the button
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Auto-show popup 2 times until they submit (but button stays)
  useEffect(() => {
    if (user && showCount < 2) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setShowCount(prev => prev + 1);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [user, showCount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (!formData.shop_type.trim()) {
      alert('Please tell us what type of shop you would like to see.');
      return;
    }

    if (formData.notify_me === 'yes' && !formData.contact.trim()) {
      alert('Please provide your email or phone number so we can notify you.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || null,
          shop_type: formData.shop_type,
          shop_name: formData.shop_name || null,
          shop_address: formData.shop_address || null,
          products: formData.products || null,
          notify_me: formData.notify_me === 'yes',
          contact: formData.notify_me === 'yes' ? formData.contact : null,
          preference: formData.preference
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Feedback submitted successfully:', result);
        handleClose();
        setShowSuccess(true); // Show custom success popup
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      name: '',
      shop_type: '',
      shop_name: '',
      shop_address: '',
      products: '',
      notify_me: 'no',
      contact: '',
      preference: 'no_preference'
    });
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <>
      {/* Main Feedback Popup */}
      {isOpen && (
        <div className="feedback-popup">
          <div className="feedback-overlay" onClick={handleClose}></div>
          <div className="feedback-container">
            <div className="feedback-header">
              <h3>💬 Help us grow your local market!</h3>
              <p>Tell us what shop or product you'd love to see next 👇</p>
              <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>Share this with your friends too!</p>
              <button className="feedback-close" onClick={handleClose}>&times;</button>
            </div>
            <div className="feedback-body">
              <form onSubmit={handleSubmitFeedback}>
                <div className="form-group">
                  <label htmlFor="name">Your Name (optional)</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="shop_type">What type of shop would you like to add? *</label>
                  <input 
                    type="text" 
                    id="shop_type" 
                    name="shop_type"
                    value={formData.shop_type}
                    onChange={handleInputChange}
                    required 
                    placeholder="e.g., bakery, fresh fruits, ayurvedic medicine, pet store..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shop_name">Shop Name (if you know)</label>
                  <input 
                    type="text" 
                    id="shop_name" 
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Fresh Mart, Organic Delights..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shop_address">Shop Location/Address (if you know)</label>
                  <textarea 
                    id="shop_address" 
                    name="shop_address"
                    value={formData.shop_address}
                    onChange={handleInputChange}
                    placeholder="e.g., Near Main Road, Opposite Metro Station..."
                    rows="2"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="products">What specific products do you want to see?</label>
                  <textarea 
                    id="products" 
                    name="products"
                    value={formData.products}
                    onChange={handleInputChange}
                    placeholder="e.g., whole wheat bread, organic apples, gluten-free products..."
                    rows="2"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>How would you prefer to get your orders?</label>
                  <div className="radio-group">
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="home_delivery"
                        checked={formData.preference === 'home_delivery'}
                        onChange={handleInputChange}
                      /> 🚚 Home Delivery
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="shop_pickup"
                        checked={formData.preference === 'shop_pickup'}
                        onChange={handleInputChange}
                      /> 🏪 Shop Pickup
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="both"
                        checked={formData.preference === 'both'}
                        onChange={handleInputChange}
                      /> 🤝 Both
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="no_preference"
                        checked={formData.preference === 'no_preference'}
                        onChange={handleInputChange}
                      /> 🤷 No Preference
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Would you like us to inform you when it's added?</label>
                  <div className="radio-group">
                    <label>
                      <input 
                        type="radio" 
                        name="notify_me" 
                        value="yes"
                        checked={formData.notify_me === 'yes'}
                        onChange={handleInputChange}
                      /> Yes, please notify me
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="notify_me" 
                        value="no"
                        checked={formData.notify_me === 'no'}
                        onChange={handleInputChange}
                      /> No, thanks
                    </label>
                  </div>
                </div>

                {formData.notify_me === 'yes' && (
                  <div className="form-group">
                    <label htmlFor="contact">Your Email or Phone *</label>
                    <input 
                      type="text" 
                      id="contact" 
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email or phone for updates"
                    />
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Suggest Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Popup */}
      {showSuccess && (
        <div className="feedback-popup">
          <div className="feedback-overlay" onClick={handleCloseSuccess}></div>
          <div className="feedback-container success-container">
            <div className="feedback-header">
              <h3>🎉 Thank You!</h3>
              <button className="feedback-close" onClick={handleCloseSuccess}>&times;</button>
            </div>
            <div className="feedback-body success-body">
              <div className="success-message">
                <p><strong>Thank you for your suggestion!</strong></p>
                <p>You're helping us grow our local delivery network. 🙏</p>
                <p>We'll try to add your requested shop soon.</p>
                <br />
                <p>💡 <strong>Want your favorite shop added faster?</strong></p>
                <p>Tell them about our website or share their name with us on WhatsApp! 📱</p>
              </div>
              <button 
                className="btn-primary" 
                onClick={handleCloseSuccess}
                style={{marginTop: '20px'}}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Suggest Button with blinking effect - ALWAYS VISIBLE */}
      <button 
        className={`suggest-btn ${isBlinking ? 'suggest-btn-blink' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        💬 Suggest a Shop
      </button>
    </>
  );
};

export default FeedbackSystem;
