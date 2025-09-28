import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopCard from './ShopCard';
import config from '../config';

function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  const isShopOpen = (shop) => {
    if (!shop.opening_time || !shop.closing_time) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight
    
    const [openHour, openMinute] = shop.opening_time.split(':').map(Number);
    const [closeHour, closeMinute] = shop.closing_time.split(':').map(Number);
    
    const openingTime = openHour * 60 + openMinute;
    const closingTime = closeHour * 60 + closeMinute;
    
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  const fetchShops = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/shops`);
      const data = await response.json();

      // fetch avg ratings for each shop and determine open status
      const shopsWithRatings = await Promise.all(
        data.map(async (shop) => {
          try {
            const ratingRes = await fetch(`${config.apiUrl}/reviews/${shop._id}/average`);
            const ratingData = await ratingRes.json();
            return { 
              ...shop, 
              avgRating: ratingData.average_rating || null,
              isOpen: isShopOpen(shop)
            };
          } catch {
            return { 
              ...shop, 
              avgRating: null,
              isOpen: isShopOpen(shop)
            };
          }
        })
      );

      setShops(shopsWithRatings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading shops...</div>;
  }

  return (
    <div className="container">
      <h2 className="page-title">Browse Shops</h2>
      <div className="shops-grid">
        {shops.map(shop => (
          <ShopCard key={shop._id} shop={shop} />
        ))}
      </div>
    </div>
  );
}

export default Shops;
