/**
 * Socket.io Client Configuration
 * Real-time communication on client side
 */

class SocketClient {
  constructor(url = 'http://localhost:5000', options = {}) {
    this.url = url;
    this.options = {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      ...options
    };

    this.socket = null;
    this.eventHandlers = new Map();
    this.isConnected = false;
    this.userId = null;
    this.username = null;
    this.avatar = null;
  }

  /**
   * Initialize socket connection
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        // Import socket.io client library
        if (typeof io === 'undefined') {
          console.error('❌ Socket.io library yüklenmedi. HTML dosyasında <script src="/socket.io/socket.io.js"></script> ekleyin');
          reject(new Error('Socket.io library not found'));
          return;
        }

        this.socket = io(this.url, this.options);

        // Connection events
        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('✅ Socket bağlandı:', this.socket.id);
          resolve(this.socket);
        });

        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.warn('⚠️ Socket bağlantısı kesildi:', reason);
        });

        this.socket.on('reconnect_attempt', () => {
          console.log('🔄 Socket yeniden bağlanmaya çalışılıyor...');
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket hatası:', error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * USER AUTHENTICATION
   */

  joinUser(userData) {
    if (!this.isConnected) {
      console.error('❌ Socket bağlı değil');
      return;
    }

    this.userId = userData.userId;
    this.username = userData.username;
    this.avatar = userData.avatar;

    this.socket.emit('user:join', {
      userId: userData.userId,
      username: userData.username,
      avatar: userData.avatar || '/assets/default-avatar.png',
      email: userData.email
    });

    console.log(`👤 Kullanıcı bağlandı: ${userData.username}`);
  }

  getOnlineCount() {
    this.socket.emit('user:getOnlineCount');
  }

  /**
   * LISTEN FOR EVENTS
   */

  on(event, callback) {
    if (!this.socket) return;

    this.socket.on(event, callback);
    this.eventHandlers.set(event, callback);

    console.log(`📡 Event listener eklendi: ${event}`);
  }

  /**
   * MUSIC PLAYBACK EVENTS
   */

  playSong(songData) {
    this.socket.emit('song:play', {
      songId: songData.id,
      userId: this.userId,
      title: songData.title,
      artist: songData.artist,
      duration: songData.duration,
      playedAt: new Date()
    });

    console.log(`🎵 Şarkı çalındı: ${songData.title}`);
  }

  pauseSong(songId, currentTime) {
    this.socket.emit('song:pause', {
      songId,
      userId: this.userId,
      currentTime,
      pausedAt: new Date()
    });
  }

  endSong(songId, totalTime) {
    this.socket.emit('song:end', {
      songId,
      userId: this.userId,
      totalTime,
      endedAt: new Date()
    });
  }

  getPlayCount(songId) {
    this.socket.emit('song:getPlayCount', songId);
  }

  /**
   * NOTIFICATION EVENTS
   */

  sendNotification(notification) {
    this.socket.emit('notification:send', {
      receiverId: notification.receiverId || null,
      type: notification.type, // 'info', 'like', 'follow', 'comment'
      title: notification.title,
      message: notification.message,
      data: notification.data || {}
    });
  }

  markNotificationRead(notificationId) {
    this.socket.emit('notification:markRead', notificationId);
  }

  /**
   * SOCIAL EVENTS
   */

  likeSong(songId, songTitle) {
    this.socket.emit('like:add', {
      songId,
      userId: this.userId,
      username: this.username,
      likedAt: new Date()
    });

    console.log(`❤️ Şarkı beğenildi: ${songTitle}`);
  }

  unlikeSong(songId) {
    this.socket.emit('like:remove', {
      songId,
      userId: this.userId
    });
  }

  followUser(followedId, followedName) {
    this.socket.emit('follow:user', {
      followerId: this.userId,
      followedId,
      followerName: this.username,
      followedName,
      followedAt: new Date()
    });

    console.log(`👥 Kullanıcı takip edildi: ${followedName}`);
  }

  /**
   * SEARCH EVENTS
   */

  liveSearch(query) {
    this.socket.emit('search:live', query);
  }

  /**
   * TYPING INDICATOR
   */

  startTyping(roomId) {
    this.socket.emit('user:typing', {
      roomId,
      username: this.username
    });
  }

  stopTyping() {
    this.socket.emit('user:stopTyping', {
      username: this.username
    });
  }

  /**
   * UTILITY METHODS
   */

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('👋 Socket bağlantısı kapatıldı');
    }
  }

  isReady() {
    return this.isConnected && this.socket !== null;
  }

  getId() {
    return this.socket?.id || null;
  }

  /**
   * UTILITY: Listen to common events
   */

  setupCommonListeners() {
    // User online status
    this.on('user:online', (data) => {
      console.log(`👥 Online kullanıcı: ${data.count}`);
      this.dispatchEvent('onlineUsersUpdate', data);
    });

    // Now playing updates
    this.on('song:nowPlaying', (data) => {
      console.log(`🎵 Şu an oynatılan: ${data.title} - ${data.artist}`);
      this.dispatchEvent('nowPlayingUpdate', data);
    });

    // Play count updates
    this.on('song:playCount', (data) => {
      console.log(`📊 ${data.songId} dinlenme: ${data.currentListeners}`);
      this.dispatchEvent('playCountUpdate', data);
    });

    // Notifications
    this.on('notification:new', (notification) => {
      console.log(`📢 Bildirim: ${notification.title}`);
      this.dispatchEvent('notificationReceived', notification);
    });

    // Likes
    this.on('like:add', (data) => {
      console.log(`❤️ ${data.username} şarkıyı beğendi`);
      this.dispatchEvent('songLiked', data);
    });

    // Search results
    this.on('search:results', (data) => {
      this.dispatchEvent('searchResults', data);
    });

    // Typing indicators
    this.on('user:typing', (data) => {
      this.dispatchEvent('userTyping', data);
    });

    console.log('✅ Ortak event listener\'lar kuruldu');
  }

  /**
   * DISPATCH CUSTOM EVENTS (for UI updates)
   */

  dispatchEvent(eventName, detail) {
    const event = new CustomEvent('socket:' + eventName, {
      detail: detail,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketClient;
}
