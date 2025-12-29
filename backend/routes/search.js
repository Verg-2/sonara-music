/**
 * Search Routes
 * Search and filtering endpoints
 */

const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');

/**
 * @route   GET /api/search/songs
 * @desc    Search songs with filters and pagination
 * @access  Public
 * @query   q (search term), genre, artist, album, sort, page, limit
 */
router.get('/songs', searchController.searchSongs);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get autocomplete suggestions
 * @access  Public
 * @query   q (search term), limit
 */
router.get('/suggestions', searchController.getSuggestions);

/**
 * @route   GET /api/search/genres
 * @desc    Get available genres for filter dropdown
 * @access  Public
 */
router.get('/genres', searchController.getGenres);

/**
 * @route   GET /api/search/stats
 * @desc    Get search statistics
 * @access  Public
 */
router.get('/stats', searchController.getSearchStats);

/**
 * @route   POST /api/search/advanced
 * @desc    Advanced search with complex criteria
 * @access  Public
 * @body    keywords, filters, sort, page, limit
 */
router.post('/advanced', searchController.advancedSearch);

module.exports = router;
