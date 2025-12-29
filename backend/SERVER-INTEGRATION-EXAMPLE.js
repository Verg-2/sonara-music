/**
 * Application Server Entry Point
 * server.js (UPDATED)
 * 
 * THIS IS AN EXAMPLE OF HOW TO INTEGRATE SONG ROUTES
 * Update your existing server.js with the Song routes integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');

// Database
const connectDB = require('./config/db');

// Socket.io
const initSocket = require('./config/socket');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const artistRoutes = require('./routes/artists');
const songRoutes = require('./features/song/routes');  // ADD THIS
const playlistRoutes = require('./routes/playlists');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Connect Database
connectDB();

/**
 * MIDDLEWARE SETUP
 */

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * ROUTES SETUP
 */

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/songs', songRoutes);        // ADD THIS
app.use('/api/playlists', playlistRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
  const err = new Error('Route not found');
  err.statusCode = 404;
  next(err);
});

/**
 * ERROR HANDLING
 */
app.use(errorHandler);

/**
 * SERVER STARTUP
 */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🎵 Music Platform API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✅ Socket.io initialized`);
  logger.info(`✅ Redis cache enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = server;
