import React, { useState } from "react";
import config from "../config";

function WishlistItem({ item }) {
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [selectedVariant, setSelectedVariant] = useState(item.selected_variant || "");
  const [error, setError] = useState("");

  // ✅ Update quantity in wishlist
  const updateQuantity = async (newQty) => {
    if (newQty < 1) return;
    try {
      const response = await fetch(`${config.apiUrl}/wishlist/${item.product_id}/quantity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity: newQty, selected_variant: selectedVariant }),
      });

      if (response.ok) {
        setQuantity(newQty);
      } else {
        console.error("Failed to update quantity");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  // ✅ Handle variant change (update price, etc.)
  const handleVariantChange = (e) => {
    const newVariant = e.target.value;
    setSelectedVariant(newVariant);
  };

  // ✅ Compute price based on variant
  let priceToUse = item.price;
  if (item.variants && selectedVariant) {
    const variant = item.variants.find((v) => v.label === selectedVariant);
    if (variant) {
      priceToUse = variant.price;
    }
  }

  return (
    <div className="wishlist-item">
      {error && <p className="error">{error}</p>}

      <img
        src={item.image_url}
        alt={item.name}
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/200x150?text=Product+Image";
        }}
      />

      <div className="item-info">
        <h3>{item.name}</h3>
        <p>{item.description}</p>

        {/* ✅ Variant dropdown */}
        {item.variants && item.variants.length > 0 && (
          <select value={selectedVariant} onChange={handleVariantChange}>
            <option value="">-- Select Size --</option>
            {item.variants.map((v, i) => (
              <option key={i} value={v.label}>
                {v.label} - ₹{v.price}
              </option>
            ))}
          </select>
        )}

        <p className="price">₹{priceToUse}</p>

        {/* ✅ Quantity controls */}
        <div className="quantity-controls">
          <button onClick={() => updateQuantity(quantity - 1)}>-</button>
          <span>{quantity}</span>
          <button onClick={() => updateQuantity(quantity + 1)}>+</button>
        </div>
      </div>
    </div>
  );
}

export default WishlistItem;
