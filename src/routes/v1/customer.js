const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customerController');
const customerAddressController = require('../../controllers/customerAddressController');
const customerWishlistController = require('../../controllers/customerWishlistController');
const customerWalletController = require('../../controllers/customerWalletController');
const { requireAuth } = require('../../config/clerk');
const { upload } = require('../../middleware/upload');

// All customer routes require authentication
router.use(requireAuth('customer'));

// Profile routes
router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.post('/profile/image', upload.single('image'), customerController.uploadProfileImage);
router.delete('/profile', customerController.deleteAccount);
router.get('/profile/stats', customerController.getCustomerStats);

// Preferences routes
router.get('/preferences', customerController.getPreferences);
router.put('/preferences', customerController.updatePreferences);
router.post('/change-password', customerController.changePassword);

// Address routes
router.get('/addresses', customerAddressController.getAddresses);
router.post('/addresses', customerAddressController.addAddress);
router.get('/addresses/default', customerAddressController.getDefaultAddress);
router.get('/addresses/type/:type', customerAddressController.getAddressesByType);
router.get('/addresses/nearby', customerAddressController.getNearbyAddresses);
router.post('/addresses/validate', customerAddressController.validateCoordinates);
router.get('/addresses/:address_id', customerAddressController.getAddress);
router.put('/addresses/:address_id', customerAddressController.updateAddress);
router.delete('/addresses/:address_id', customerAddressController.deleteAddress);
router.patch('/addresses/:address_id/default', customerAddressController.setDefaultAddress);

// Wishlist routes
router.get('/wishlist', customerWishlistController.getWishlist);
router.post('/wishlist', customerWishlistController.addToWishlist);
router.delete('/wishlist/:product_id', customerWishlistController.removeFromWishlist);
router.get('/wishlist/check/:product_id', customerWishlistController.checkWishlist);
router.post('/wishlist/toggle', customerWishlistController.toggleWishlist);
router.delete('/wishlist', customerWishlistController.clearWishlist);
router.get('/wishlist/stats', customerWishlistController.getWishlistStats);
router.get('/wishlist/category/:category_id', customerWishlistController.getWishlistByCategory);
router.post('/wishlist/move-to-cart', customerWishlistController.moveToCart);

// Wallet routes
router.get('/wallet', customerWalletController.getWalletInfo);
router.get('/wallet/transactions', customerWalletController.getWalletTransactions);
router.post('/wallet/add-money', customerWalletController.addMoney);
router.post('/wallet/use-money', customerWalletController.useWalletMoney);
router.get('/wallet/transactions/:transaction_id', customerWalletController.getTransaction);
router.get('/wallet/stats', customerWalletController.getWalletStats);
router.post('/wallet/transfer', customerWalletController.transferMoney);
router.get('/wallet/bonus-history', customerWalletController.getBonusHistory);

// Notifications routes
router.get('/notifications', customerController.getNotifications);
router.patch('/notifications/:notification_id/read', customerController.markNotificationAsRead);

module.exports = router; 