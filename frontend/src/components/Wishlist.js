import React, { useState, useEffect } from "react";
import config from "../config";
import WishlistItem from "./WishlistItem";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    fetch(`${config.apiUrl}/wishlist`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("Wishlist API response:", data); // 👀 check structure
        setWishlist(data);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  if (!wishlist || wishlist.length === 0) {
    return <p className="empty-message">Your wishlist is empty</p>;
  }

  return (
    <div className="wishlist-container">
      <h2>Your Wishlist</h2>
      <div className="wishlist-grid">
        {wishlist.map((item) => (
          <WishlistItem key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
