/**
 * Routes - Cache Middleware ile optimize edilmiş
 * 
 * Mimari:
 * GET /artists → cacheMiddleware → controller
 * PUT /artists/:id → invalidateCache → controller (sonra cache temizle)
 * DELETE /artists/:id → invalidateCache → controller (sonra cache temizle)
 */

const express = require('express');
const router = express.Router();
const { 
  getArtists, 
  getArtistById, 
  createArtist, 
  updateArtist, 
  deleteArtist 
} = require('../controllers/artistController-cache');
const { 
  cacheMiddleware, 
  invalidateCache 
} = require('../middleware/cache');
const { protect, authorize } = require('../middleware/auth');

// PUBLIC ROUTES (CACHE ENABLED)

/**
 * GET /api/artists
 * Tüm artist'leri al (CACHE: 1 saat)
 * Header: X-Cache: HIT/MISS
 */
router.get('/', cacheMiddleware('artists:all', 3600), getArtists);

/**
 * GET /api/artists/:id
 * Belirli artist'i al (CACHE: 1 saat)
 */
router.get('/:id', cacheMiddleware('artist:id', 3600), getArtistById);

// PROTECTED ROUTES (CACHE INVALIDATION)

/**
 * POST /api/artists
 * Yeni artist oluştur
 * Sonrasında tüm artist cache'leri temizlenir
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  invalidateCache('artists:*', 'artist:*'),
  createArtist
);

/**
 * PUT /api/artists/:id
 * Artist güncelle
 * Sonrasında ilgili cache'ler temizlenir
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  invalidateCache('artists:*', 'artist:*'),
  updateArtist
);

/**
 * DELETE /api/artists/:id
 * Artist sil
 * Sonrasında ilgili cache'ler temizlenir
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  invalidateCache('artists:*', 'artist:*'),
  deleteArtist
);

module.exports = router;
