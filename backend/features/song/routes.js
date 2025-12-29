/**
 * Song Routes
 * features/song/routes.js
 */

const express = require('express');
const SongController = require('./controllers/SongController');
const { protect, authorize } = require('../../shared/middleware/auth');
const { validate, validateSongUpload, validateSongUpdate } = require('./middleware/validateSong');
const upload = require('../../shared/middleware/upload');
const { cacheMiddleware, invalidateCache } = require('../../shared/middleware/cache');

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// List songs
router.get(
  '/',
  cacheMiddleware('songs:list', 300),
  SongController.listSongs
);

// Search songs
router.get(
  '/search/:q',
  cacheMiddleware('songs:search', 300),
  SongController.searchSongs
);

// Get trending songs
router.get(
  '/trending/weekly',
  cacheMiddleware('songs:trending', 3600),
  SongController.getTrendingSongs
);

// Get single song
router.get(
  '/:id',
  cacheMiddleware('song', 600),
  SongController.getSong
);

// Get genre statistics
router.get(
  '/stats/genres',
  cacheMiddleware('stats:genres', 86400),
  SongController.getGenreStats
);

// Get artist statistics
router.get(
  '/stats/artist/:id',
  cacheMiddleware('stats:artist', 3600),
  SongController.getArtistStats
);

/**
 * PROTECTED ROUTES (Authenticated users)
 */

// Upload song
router.post(
  '/',
  protect,
  upload.single('audio'),
  validate(validateSongUpload),
  invalidateCache('songs:*'),
  SongController.uploadSong
);

// Play song (increment counter)
router.post(
  '/:id/play',
  protect,
  invalidateCache(`song:*`, 'songs:*'),
  SongController.playSong
);

// Like song
router.post(
  '/:id/like',
  protect,
  invalidateCache('songs:*'),
  SongController.likeSong
);

// Unlike song
router.delete(
  '/:id/like',
  protect,
  invalidateCache('songs:*'),
  SongController.unlikeSong
);

// Update song
router.patch(
  '/:id',
  protect,
  validate(validateSongUpdate),
  invalidateCache('songs:*'),
  SongController.updateSong
);

// Delete song
router.delete(
  '/:id',
  protect,
  invalidateCache('songs:*'),
  SongController.deleteSong
);

// Publish song
router.post(
  '/:id/publish',
  protect,
  invalidateCache('songs:*'),
  SongController.publishSong
);

// Get recommendations
router.get(
  '/recommendations/for-me',
  protect,
  cacheMiddleware('recommendations', 3600),
  SongController.getRecommendations
);

module.exports = router;
