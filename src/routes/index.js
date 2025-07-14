const express = require('express');
const router = express.Router();

// Import route modules
const v1Routes = require('./v1');

// Health check for the API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'eFood API is running',
    version: 'v1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API versioning
router.use('/v1', v1Routes);

// Default route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to eFood API',
    version: 'v1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      v1: '/api/v1'
    }
  });
});

module.exports = router; 