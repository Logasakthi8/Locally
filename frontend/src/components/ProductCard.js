import React, { useState } from 'react';
import config from '../config';

function ProductCard({ product, onWishlistUpdate }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const whatsappNumber = '9876543212';

  const handleWhatsAppRequest = () => {
    const message = `Hi, I'm interested in ${product.name}. Please provide more details.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleLike = async () => {
    try {
      setIsAdding(true);
@@ -23,6 +32,7 @@

      if (response.ok) {
        setIsLiked(true);
        onWishlistUpdate && onWishlistUpdate();
      } else {
        if (response.status === 401) {
          setError('Please login to add to wishlist');
@@ -98,25 +108,33 @@
          )}
        </div>

        {/* WhatsApp Inquiry Button */}
        <button
          className="whatsapp-inquiry-btn"
          onClick={handleWhatsAppRequest}
        >
          💬 Inquire via WhatsApp
        </button>

        {/* Show quantity controls only after adding to wishlist */}
        {isLiked ? (
          <div className="quantity-control">
            <button onClick={() => handleQuantityChange(-1)}>-</button>
            <span>{quantity}</span>
            <button onClick={() => handleQuantityChange(1)}>+</button>
          </div>
        ) : (
          <button
            className={`like-btn ${isLiked ? 'liked' : ''} ${isAdding ? 'adding' : ''}`}
            onClick={handleLike}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Wishlist'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
