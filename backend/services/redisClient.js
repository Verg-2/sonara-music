/**
 * Redis Client Configuration
 * Redis bağlantısı ve temel işlemler
 */

const redis = require('redis');
const logger = require('../utils/logger');

// Redis client oluştur (async/await için)
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis: Bağlantı denemesi sınırını aştı');
        return new Error('Redis: Bağlantı başarısız');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis: ${retries}. bağlantı denemesi (${delay}ms sonra)`);
      return delay;
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Event handlers
client.on('connect', () => {
  logger.info('✅ Redis bağlantı başarılı');
});

client.on('error', (err) => {
  logger.error('❌ Redis hata:', err.message);
});

client.on('disconnect', () => {
  logger.warn('⚠️ Redis bağlantısı kesildi');
});

// Client'i bağla (non-blocking, hata olsa da devam et)
client.connect().catch((err) => {
  logger.error('Redis bağlantı hatası:', err.message);
  logger.warn('Uygulamaya cache olmadan devam ediliyor...');
});

// Yardımcı metodlar
const redisClient = {
  /**
   * Get: Değer al
   */
  get: async (key) => {
    try {
      return await client.get(key);
    } catch (error) {
      logger.error(`Redis GET hatası (${key}):`, error.message);
      return null;
    }
  },

  /**
   * Set: Değer yaz (TTL ile)
   */
  setex: async (key, ttl, value) => {
    try {
      return await client.setEx(key, ttl, value);
    } catch (error) {
      logger.error(`Redis SETEX hatası (${key}):`, error.message);
    }
  },

  /**
   * Del: Değer sil
   */
  del: async (...keys) => {
    try {
      return await client.del(keys);
    } catch (error) {
      logger.error(`Redis DEL hatası:`, error.message);
      return 0;
    }
  },

  /**
   * Keys: Pattern'a uyan tüm key'leri bulabilir SCAN yerine
   * NOT: Production'da büyük veri için SCAN kullan
   */
  keys: async (pattern) => {
    try {
      return await client.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS hatası (${pattern}):`, error.message);
      return [];
    }
  },

  /**
   * Incr: Sayaç arttır
   */
  incr: async (key) => {
    try {
      return await client.incr(key);
    } catch (error) {
      logger.error(`Redis INCR hatası (${key}):`, error.message);
      return 0;
    }
  },

  /**
   * Info: Redis bilgisi al
   */
  info: async (section = 'all') => {
    try {
      return await client.info(section);
    } catch (error) {
      logger.error('Redis INFO hatası:', error.message);
      return '';
    }
  },

  /**
   * FlushDB: Veritabanını temizle
   */
  flushdb: async () => {
    try {
      return await client.flushDb();
    } catch (error) {
      logger.error('Redis FLUSHDB hatası:', error.message);
    }
  },

  /**
   * Expire: Var olan key'e TTL ekle
   */
  expire: async (key, ttl) => {
    try {
      return await client.expire(key, ttl);
    } catch (error) {
      logger.error(`Redis EXPIRE hatası (${key}):`, error.message);
    }
  },

  /**
   * TTL: Kalan TTL'yi al
   */
  ttl: async (key) => {
    try {
      return await client.ttl(key);
    } catch (error) {
      logger.error(`Redis TTL hatası (${key}):`, error.message);
      return -1;
    }
  },

  /**
   * Client'i kapat
   */
  disconnect: async () => {
    try {
      await client.quit();
      logger.info('Redis bağlantısı kapatıldı');
    } catch (error) {
      logger.error('Redis kapatma hatası:', error.message);
    }
  },
};

module.exports = redisClient;
