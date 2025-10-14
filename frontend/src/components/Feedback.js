import React, { useState, useEffect } from 'react';
import config from '../config';


const FeedbackSystem = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
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
  const [hasShown, setHasShown] = useState(false);

  // Auto-show popup after 10 seconds when user logs in
  useEffect(() => {
    if (user && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [user, hasShown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    // Validate form
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
          contact: formData.notify_me === 'yes' ? formData.contact : null
        })
      });

      if (response.ok) {
        setIsOpen(false);
        setShowFollowup(true);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFollowup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${config.apiUrl}/feedback/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preference: formData.preference
        })
      });

      handleClose();
      showSuccessMessage();
    } catch (error) {
      console.error('Error submitting followup:', error);
      handleClose();
      showSuccessMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowFollowup(false);
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

  const showSuccessMessage = () => {
    alert('Thank you for your suggestion! You will receive 20% off your first order when your suggested shop is added. 🎉');
  };

  // Don't render anything if neither popup is open
  if (!isOpen && !showFollowup) {
    return (
      <button 
        className="suggest-btn"
        onClick={() => setIsOpen(true)}
      >
        💬 Suggest a Shop
      </button>
    );
  }

  return (
    <>
      {/* Main Feedback Popup */}
      {isOpen && (
        <div className="feedback-popup">
          <div className="feedback-overlay" onClick={handleClose}></div>
          <div className="feedback-container">
            <div className="feedback-header">
              <h3>💬 Help us grow Whitefield's online market!</h3>
              <p>Tell us what shop or product you'd love to see next 👇</p>
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
                    placeholder="e.g., Near Whitefield Main Road, Opposite Metro Station..."
                    rows="3"
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
                    rows="3"
                  ></textarea>
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

      {/* Follow-up Popup */}
      {showFollowup && (
        <div className="feedback-popup">
          <div className="feedback-overlay" onClick={handleClose}></div>
          <div className="feedback-container">
            <div className="feedback-header">
              <h3>One more quick question! 🙏</h3>
              <button className="feedback-close" onClick={handleClose}>&times;</button>
            </div>
            <div className="feedback-body">
              <form onSubmit={handleSubmitFollowup}>
                <div className="form-group">
                  <label>How would you prefer to get your orders? *</label>
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
                      /> 🤝 Both options
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
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Preference'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Suggest Button */}
      <button 
        className="suggest-btn"
        onClick={() => setIsOpen(true)}
      >
        💬 Suggest a Shop
      </button>
    </>
  );
};

export default FeedbackSystem;
