const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ success: false, message: 'Wishlist routes will be implemented in next phase' });
});

module.exports = router; 