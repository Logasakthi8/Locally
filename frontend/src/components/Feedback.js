import React, { useState, useEffect } from 'react';

 
const FeedbackSystem = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shop_type: '',
    products: '',
    notify_me: 'no',
    contact: '',
    preference: 'no_preference'
  });
  const [loading, setLoading] = useState(false);

  // Auto-show popup after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

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
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || null,
          shop_type: formData.shop_type,
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
      await fetch('/api/feedback/followup', {
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
      // Still proceed with success message even if followup fails
      handleClose();
      showSuccessMessage();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowFollowup(false);
    // Reset form
    setFormData({
      name: '',
      shop_type: '',
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
                  <label htmlFor="name">Name (optional)</label>
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
                  <label htmlFor="shop_type">What shop would you like to add? *</label>
                  <input 
                    type="text" 
                    id="shop_type" 
                    name="shop_type"
                    value={formData.shop_type}
                    onChange={handleInputChange}
                    required 
                    placeholder="e.g., bakery, fresh fruits, ayurvedic medicine..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="products">What specific products do you want to see?</label>
                  <textarea 
                    id="products" 
                    name="products"
                    value={formData.products}
                    onChange={handleInputChange}
                    placeholder="e.g., whole wheat bread, organic apples..."
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
                      /> Yes
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="notify_me" 
                        value="no"
                        checked={formData.notify_me === 'no'}
                        onChange={handleInputChange}
                      /> No
                    </label>
                  </div>
                </div>
                {formData.notify_me === 'yes' && (
                  <div className="form-group">
                    <label htmlFor="contact">Email or Phone *</label>
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
                  <label>Would you prefer home delivery or shop pickup? *</label>
                  <div className="radio-group">
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="home_delivery"
                        checked={formData.preference === 'home_delivery'}
                        onChange={handleInputChange}
                      /> Home Delivery
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="shop_pickup"
                        checked={formData.preference === 'shop_pickup'}
                        onChange={handleInputChange}
                      /> Shop Pickup
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="both"
                        checked={formData.preference === 'both'}
                        onChange={handleInputChange}
                      /> Both
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="preference" 
                        value="no_preference"
                        checked={formData.preference === 'no_preference'}
                        onChange={handleInputChange}
                      /> No Preference
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
