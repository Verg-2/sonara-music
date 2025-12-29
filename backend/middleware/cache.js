/**
 * Cache Middleware
 * Belirli endpoint'leri otomatik cache'e al
 * 
 * Kullanım:
 *   router.get('/artists', cacheMiddleware('artists:all', 3600), artistController.getAll);
 */

const redisClient = require('../services/redisClient');
const logger = require('../utils/logger');

/**
 * Cache middleware factory
 * @param {string} key - Cache key'i
 * @param {number} ttl - Cache süresi (saniye)
 * @returns {Function} - Express middleware
 */
const cacheMiddleware = (key, ttl = 3600) => {
  return async (req, res, next) => {
    try {
      // Query params'leri key'e ekle (farklı sorgular için)
      const cacheKey = req.query && Object.keys(req.query).length > 0
        ? `${key}:${JSON.stringify(req.query)}`
        : key;

      // Redis'ten kontrol et
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`✅ Cache HIT: ${cacheKey}`);
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }

      logger.info(`📥 Cache MISS: ${cacheKey}`);
      
      // Orijinal res.json() methodunu intercept et
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Cache'e koy (ama sadece başarılı response'lar için)
        if (res.statusCode === 200) {
          redisClient.setex(cacheKey, ttl, JSON.stringify(data));
          res.set('X-Cache', 'MISS');
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware hatası:', error.message);
      // Hata durumunda devam et
      next();
    }
  };
};

/**
 * İleri seviye cache temizleme middleware'i
 * DELETE/PUT/POST işlemlerinde otomatik cache temizle
 * 
 * Kullanım:
 *   router.put('/artists/:id', invalidateCache('artists:*'), artistController.update);
 */
const invalidateCache = (...patterns) => {
  return async (req, res, next) => {
    try {
      // Response gönderdikten sonra cache'i temizle
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          for (const pattern of patterns) {
            await redisClient.del(...(await redisClient.keys(pattern)));
            logger.info(`🗑️ Cache invalidated: ${pattern}`);
          }
        }
      });
      next();
    } catch (error) {
      logger.error('Invalidate cache middleware hatası:', error.message);
      next();
    }
  };
};

/**
 * Manual cache temizleme helper
 * Controller içinde kullanılabilir
 */
const clearCachePatterns = async (patterns) => {
  try {
    for (const pattern of patterns) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`🗑️ Patterns cleared: ${pattern} (${keys.length} keys)`);
      }
    }
  } catch (error) {
    logger.error('Cache temizleme hatası:', error.message);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCachePatterns,
};
