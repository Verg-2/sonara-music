/**
 * Redis Cache Service
 * Veritabanı sorgulamalarını cache ile optimize eder
 * 
 * Mimari:
 * Controller → cacheService.getOrSet() → Database
 *           → cacheService.invalidate() → Cache silme
 */

const redis = require('./redisClient');

class CacheService {
  /**
   * Cache'den veri al veya database'den çek
   * @param {string} key - Cache key'i (örn: 'artists:all')
   * @param {Function} fetchData - Veri getirme fonksiyonu (database)
   * @param {number} ttl - Cache süresi (saniye cinsinden)
   * @returns {Promise<any>} - Cache'den veya DB'den getirilen veri
   */
  async getOrSet(key, fetchData, ttl = 3600) {
    try {
      // 1. Redis'ten kontrol et
      const cached = await redis.get(key);
      if (cached) {
        console.log(`✅ Cache HIT: ${key}`);
        return JSON.parse(cached);
      }

      // 2. Database'den çek
      console.log(`📥 Cache MISS: ${key} - Veritabanından çekiliyor...`);
      const data = await fetchData();

      // 3. Redis'e koy (TTL ile)
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`💾 Cache SAVED: ${key} (TTL: ${ttl}s)`);

      return data;
    } catch (error) {
      console.error(`❌ Cache işleminde hata (${key}):`, error.message);
      // Hata durumunda sadece veritabanından döndür
      return await fetchData();
    }
  }

  /**
   * Cache'e doğrudan veri yaz
   * @param {string} key - Cache key'i
   * @param {any} data - Yazılacak veri
   * @param {number} ttl - Cache süresi (saniye)
   */
  async set(key, data, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`❌ Cache SET hatası (${key}):`, error.message);
    }
  }

  /**
   * Belirli bir key'i cache'ten sil
   * @param {string} key - Silinecek key
   */
  async invalidate(key) {
    try {
      const deleted = await redis.del(key);
      if (deleted) {
        console.log(`🗑️ Cache INVALIDATED: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Cache invalidate hatası (${key}):`, error.message);
    }
  }

  /**
   * Prefix pattern'ı kullanarak birden fazla key'i sil
   * Örn: 'artists:*' → tüm artist cache'lerini sil
   * @param {string} pattern - Silme pattern'ı (SCAN kullanır)
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Cache PATTERN INVALIDATED: ${pattern} (${keys.length} key silindi)`);
      }
    } catch (error) {
      console.error(`❌ Pattern invalidate hatası (${pattern}):`, error.message);
    }
  }

  /**
   * Tüm cache'i temizle (dikkat! production'da kullanmayın)
   */
  async flushAll() {
    try {
      await redis.flushdb();
      console.log(`🗑️ Cache FLUSHED: Tüm cache temizlendi`);
    } catch (error) {
      console.error(`❌ Cache flush hatası:`, error.message);
    }
  }

  /**
   * Cache istatistiklerini al
   */
  async getStats() {
    try {
      const info = await redis.info('stats');
      const keys = await redis.keys('*');
      return {
        totalKeys: keys.length,
        info: info,
      };
    } catch (error) {
      console.error('Cache stats hatası:', error.message);
      return null;
    }
  }
}

module.exports = new CacheService();
