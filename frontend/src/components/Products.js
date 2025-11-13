const handleCheckout = () => {
  if (cartItems.length === 0) {
    alert('Your cart is empty. Add some products first!');
    return;
  }

  console.log('🛒 Checkout clicked, cart items:', cartItems.length);

  // FIXED: Check the return value of onRequireLogin and handle both cases
  const canProceed = onRequireLogin(() => {
    console.log('✅ Login successful, navigating to wishlist');
    navigateToWishlist();
  });

  // If user is already logged in, proceed directly
  if (canProceed) {
    console.log('✅ User already logged in, proceeding to wishlist');
    navigateToWishlist();
  } else {
    console.log('🔄 Showing login modal...');
    // Login modal will be shown, and after login it will call navigateToWishlist
  }
};
