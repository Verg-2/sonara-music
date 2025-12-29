/**
 * Test Cache Routes
 * Redis cache sistemini test etmek için basit endpoint'ler
 */

const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');

/**
 * GET /api/test-cache/status
 * Cache sisteminin durumunu kontrol et
 */
router.get('/status', async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      message: '✅ Cache sistemi çalışıyor',
      status: 'operational',
      stats: stats
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Cache sistemi kullanılamıyor (graceful fallback)',
      status: 'offline',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cache/test-set
 * Cache'e veri yaz test et
 */
router.get('/test-set', async (req, res) => {
  try {
    const testKey = 'test:key:' + Date.now();
    const testValue = {
      message: 'Test verileri',
      timestamp: new Date(),
      random: Math.random()
    };

    await cacheService.set(
      testKey,
      JSON.stringify(testValue),
      60 // 60 saniye TTL
    );

    res.json({
      success: true,
      message: '✅ Veri cache\'e yazıldı',
      key: testKey,
      value: testValue,
      ttl: 60
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Cache yazma başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cache/test-get/:key
 * Cache'ten veri oku test et
 */
router.get('/test-get/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const cachedValue = await cacheService.client.get(key);

    if (!cachedValue) {
      return res.json({
        success: false,
        message: '❌ Cache\'te veri bulunamadı veya süresi dolmuş',
        key: key,
        value: null
      });
    }

    res.json({
      success: true,
      message: '✅ Cache\'ten veri okundu (HIT)',
      key: key,
      value: JSON.parse(cachedValue)
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Cache okuma başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cache/test-delete/:key
 * Cache'ten veri sil test et
 */
router.get('/test-delete/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await cacheService.invalidate(key);

    res.json({
      success: true,
      message: '✅ Cache verisi silindi',
      key: key
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Cache silme başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cache/test-getorset/:key
 * Cache-Aside pattern test et
 */
router.get('/test-getorset/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const isHit = req.query.hit === 'true';

    const startTime = Date.now();

    const result = await cacheService.getOrSet(
      key,
      async () => {
        // Simulate database query (500ms delay)
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          message: 'Database\'ten alınan veri',
          timestamp: new Date(),
          random: Math.random()
        };
      },
      60 // 60 saniye TTL
    );

    const duration = Date.now() - startTime;
    const cacheHit = duration < 100; // Cache HIT < 100ms

    res.json({
      success: true,
      message: cacheHit ? '✅ Cache HIT (hızlı yanıt)' : '📥 Cache MISS (database\'ten çekildi)',
      key: key,
      cacheStatus: cacheHit ? 'HIT' : 'MISS',
      data: result,
      responseDuration: duration + 'ms'
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Cache getOrSet başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cache/test-invalidate-pattern
 * Pattern-based cache invalidation test et
 */
router.get('/test-invalidate-pattern', async (req, res) => {
  try {
    const pattern = 'test:*';
    await cacheService.invalidatePattern(pattern);

    res.json({
      success: true,
      message: '✅ Pattern-based cache silme başarılı',
      pattern: pattern
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Pattern-based cache silme başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/test-cache/test-flush
 * Tüm cache'i temizle test et (DİKKAT: Production'da kullanmayın!)
 */
router.get('/test-flush', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: '❌ Production ortamında cache flush yasaklanmıştır!'
    });
  }

  try {
    await cacheService.flushAll();

    res.json({
      success: true,
      message: '✅ Tüm cache temizlendi (development ortamı)',
      warning: 'Bu operasyon sadece development ortamında çalışmaktadır'
    });
  } catch (error) {
    res.json({
      success: false,
      message: '⚠️ Cache flush başarısız',
      error: error.message
    });
  }
});

module.exports = router;
