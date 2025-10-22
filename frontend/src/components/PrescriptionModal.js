// PrescriptionModal.js - For medical shops
import React, { useState } from 'react';
import config from '../config';

function PrescriptionModal({ shop, onClose }) {
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [note, setNote] = useState('');
  const [selectedShop, setSelectedShop] = useState(shop._id);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);

  // In a real app, you would fetch nearby medical shops
  const nearbyMedicalShops = [
    { _id: shop._id, name: shop.name },
    { _id: 'other1', name: 'City Medical Store' },
    { _id: 'other2', name: '24/7 Pharmacy' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf')) {
      setPrescriptionFile(file);
    } else {
      alert('Please upload a valid image (JPEG, PNG) or PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prescriptionFile) {
      alert('Please upload a prescription file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('prescription', prescriptionFile);
      formData.append('note', note);
      formData.append('shopId', selectedShop);

      const response = await fetch(`${config.apiUrl}/prescriptions/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        alert('Prescription uploaded successfully! The shop will contact you soon.');
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to upload prescription');
      }
    } catch (error) {
      console.error('Error uploading prescription:', error);
      alert('Error uploading prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Upload Prescription</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="prescription-form">
          <div className="form-group">
            <label>Upload Prescription (Image/PDF)*</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              required
            />
            {prescriptionFile && (
              <p className="file-info">Selected: {prescriptionFile.name}</p>
            )}
          </div>

          <div className="form-group">
            <label>Additional Notes (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Need home delivery / Need generic alternative"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Choose Medical Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
            >
              {nearbyMedicalShops.map(medicalShop => (
                <option key={medicalShop._id} value={medicalShop._id}>
                  {medicalShop.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn" 
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Submit Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PrescriptionModal;
