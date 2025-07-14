const express = require('express');
const router = express.Router();

router.get('/orders', (req, res) => {
  res.status(501).json({ success: false, message: 'Kitchen routes will be implemented in next phase' });
});

module.exports = router; 