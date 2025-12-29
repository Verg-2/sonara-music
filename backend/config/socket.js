/**
 * Socket.io Configuration
 * Real-time communication setup
 */

const { Server } = require('socket.io');
const logger = require('../utils/logger');

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - Express HTTP server
 * @param {Object} options - Configuration options
 * @returns {Object} Socket.io server instance
 */
const initializeSocket = (httpServer, options = {}) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ? 
        process.env.CORS_ORIGIN.split(',').map(o => o.trim()) :
        ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'], // WebSocket + fallback
    pingInterval: 30000,    // Ping every 30s
    pingTimeout: 5000,      // Wait 5s for pong
    maxHttpBufferSize: 1e6, // 1MB max message
    ...options
  });

  // 🔹 SOCKET EVENT HANDLERS
  io.on('connection', (socket) => {
    logger.info(`✅ Socket bağlandı: ${socket.id}`);
    
    // Store user info in socket
    socket.user = null;
    socket.rooms = new Set();

    /**
     * USER CONNECTION EVENTS
     */

    // User joins - authenticate and setup
    socket.on('user:join', (userData) => {
      try {
        socket.user = userData;
        socket.join(`user:${userData.userId}`); // Private room
        socket.join('online'); // Global online room
        
        socket.rooms.add(`user:${userData.userId}`);
        socket.rooms.add('online');

        logger.info(`👤 Kullanıcı bağlandı: ${userData.username}`);

        // Broadcast user online count
        const onlineCount = io.sockets.adapter.rooms.get('online')?.size || 0;
        io.to('online').emit('user:online', {
          count: onlineCount,
          user: userData,
          timestamp: new Date()
        });

        // Send welcome message
        socket.emit('notification:new', {
          id: `notif_${Date.now()}`,
          type: 'system',
          title: 'Hoş Geldiniz',
          message: `${userData.username}, Sonara\'ya hoş geldiniz!`,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('user:join hatası:', error.message);
        socket.emit('error', {
          message: 'Bağlantı kurulamadı',
          error: error.message
        });
      }
    });

    // Get online users count
    socket.on('user:getOnlineCount', () => {
      const onlineCount = io.sockets.adapter.rooms.get('online')?.size || 0;
      socket.emit('user:online', { count: onlineCount });
    });

    /**
     * MUSIC PLAYBACK EVENTS
     */

    socket.on('song:play', (data) => {
      try {
        const { songId, userId, title, artist, duration } = data;
        
        logger.info(`🎵 Şarkı çalındı: ${title} - ${artist}`);

        // Update play count (async, non-blocking)
        if (socket.user) {
          socket.join(`song:${songId}`);
          socket.rooms.add(`song:${songId}`);
        }

        // Broadcast now playing to all users
        io.emit('song:nowPlaying', {
          songId,
          userId,
          title,
          artist,
          duration,
          playedAt: new Date(),
          activeListeners: io.sockets.adapter.rooms.get(`song:${songId}`)?.size || 0
        });

        // Increment play counter in database (fire & forget)
        setImmediate(() => {
          // TODO: Update MongoDB play count
          // Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } })
        });
      } catch (error) {
        logger.error('song:play hatası:', error.message);
      }
    });

    socket.on('song:pause', (data) => {
      const { songId, currentTime } = data;
      io.emit('song:pause', {
        songId,
        currentTime,
        pausedAt: new Date()
      });
    });

    socket.on('song:end', (data) => {
      const { songId, totalTime } = data;
      logger.info(`✅ Şarkı bitti: ${songId}`);

      io.emit('song:end', {
        songId,
        totalTime,
        endedAt: new Date()
      });
    });

    // Get live play count for specific song
    socket.on('song:getPlayCount', (songId) => {
      const listeners = io.sockets.adapter.rooms.get(`song:${songId}`)?.size || 0;
      socket.emit('song:playCount', {
        songId,
        currentListeners: listeners,
        timestamp: new Date()
      });
    });

    /**
     * NOTIFICATION EVENTS
     */

    socket.on('notification:send', (data) => {
      try {
        const { receiverId, type, title, message, data: notifData } = data;
        
        const notification = {
          id: `notif_${Date.now()}`,
          type,
          title,
          message,
          data: notifData,
          timestamp: new Date(),
          read: false
        };

        logger.info(`📢 Bildirim gönderiliyor: ${title}`);

        // Send to specific user or broadcast
        if (receiverId) {
          io.to(`user:${receiverId}`).emit('notification:new', notification);
        } else {
          io.emit('notification:new', notification);
        }
      } catch (error) {
        logger.error('notification:send hatası:', error.message);
      }
    });

    socket.on('notification:markRead', (notificationId) => {
      // Broadcast read status
      io.emit('notification:read', { notificationId });
    });

    /**
     * SOCIAL EVENTS (Likes, follows, etc.)
     */

    socket.on('like:add', (data) => {
      const { songId, userId, username } = data;
      logger.info(`❤️ Beğeni eklendi: ${songId}`);

      io.emit('like:add', {
        songId,
        userId,
        username,
        timestamp: new Date()
      });

      // Notify song creator
      // io.to(`user:${songCreatorId}`).emit('notification:new', {...})
    });

    socket.on('like:remove', (data) => {
      const { songId, userId } = data;
      io.emit('like:remove', { songId, userId });
    });

    socket.on('follow:user', (data) => {
      const { followerId, followedId, followerName } = data;
      
      io.to(`user:${followedId}`).emit('notification:new', {
        id: `notif_${Date.now()}`,
        type: 'follow',
        title: 'Yeni Takipçi',
        message: `${followerName} seni takip etmeye başladı`,
        data: { followerId, followerName },
        timestamp: new Date()
      });
    });

    /**
     * SEARCH EVENTS
     */

    socket.on('search:live', (query) => {
      // TODO: Implement live search with database
      socket.emit('search:results', {
        query,
        results: {
          songs: [],
          artists: [],
          playlists: []
        }
      });
    });

    /**
     * TYPING INDICATOR
     */

    socket.on('user:typing', (data) => {
      const { roomId, username } = data;
      socket.broadcast.emit('user:typing', { username, roomId });
    });

    socket.on('user:stopTyping', (data) => {
      socket.broadcast.emit('user:stopTyping', { username: data.username });
    });

    /**
     * DISCONNECT EVENT
     */

    socket.on('disconnect', () => {
      try {
        if (socket.user) {
          logger.info(`👋 Kullanıcı çıkış yaptı: ${socket.user.username}`);

          // Broadcast updated online count
          const onlineCount = io.sockets.adapter.rooms.get('online')?.size || 0;
          io.to('online').emit('user:online', {
            count: onlineCount,
            timestamp: new Date()
          });
        }

        // Leave all rooms
        socket.rooms.forEach(room => socket.leave(room));
      } catch (error) {
        logger.error('disconnect hatası:', error.message);
      }
    });

    /**
     * ERROR HANDLING
     */

    socket.on('error', (error) => {
      logger.error('Socket hatası:', error);
    });
  });

  logger.info('✅ Socket.io başlatıldı');
  return io;
};

/**
 * Setup Redis Adapter (for horizontal scaling)
 * Requires redis package
 */
const setupRedisAdapter = (io, redisClient) => {
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    
    // Create pub/sub clients
    const pubClient = redisClient;
    const subClient = redisClient.duplicate();

    subClient.connect().then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Redis Adapter yapılandırıldı');
    });
  } catch (error) {
    logger.warn('Redis Adapter kurulamadı (optional):', error.message);
  }
};

module.exports = {
  initializeSocket,
  setupRedisAdapter
};
