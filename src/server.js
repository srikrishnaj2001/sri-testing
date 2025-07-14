require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import configurations
const { sequelize } = require('./config/database');
// const clerkConfig = require('./config/clerk'); // TODO: Re-enable when implementing auth
const i18n = require('./config/i18n');

// Import routes
const apiRoutes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Global variables
global.io = io;
global.app = app;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Apply i18n middleware array
i18n.middleware.forEach(middleware => app.use(middleware));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'eFood Node.js Backend is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Socket.IO connection handling (optional for development)
try {
  require('./sockets')(io);
} catch (socketError) {
  console.warn('⚠️  Socket.io setup failed, continuing without real-time features:', socketError.message);
}

// Database connection and server startup
const PORT = process.env.PORT || 8009;

async function startServer() {
  try {
    // Test database connection (optional)
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
      
      // Sync database (in development only)
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized.');
      }
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, continuing without database:', dbError.message);
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('📴 SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, io }; 