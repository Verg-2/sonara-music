/**
 * Search Controller
 * Handles search and filtering requests
 */

const searchService = require('../services/searchService');

/**
 * @desc    Search songs with advanced filters
 * @route   GET /api/search/songs
 * @access  Public
 */
exports.searchSongs = async (req, res, next) => {
    try {
        const {
            q,
            genre,
            artist,
            album,
            dateFrom,
            dateTo,
            minDuration,
            maxDuration,
            sort = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        // Use Atlas Search if available, fallback to simple search
        let results;
        try {
            results = await searchService.searchSongs({
                q,
                genre,
                artist,
                album,
                dateFrom,
                dateTo,
                minDuration,
                maxDuration,
                sortBy: sort,
                page,
                limit
            });
        } catch (atlasError) {
            // If Atlas Search fails, use simple regex search
            console.warn('[SEARCH] Atlas Search hatası, fallback kullanılıyor:', atlasError.message);
            results = await searchService.searchSongsSimple({
                q,
                genre,
                artist,
                album,
                sortBy: sort,
                page,
                limit
            });
        }

        res.status(200).json({
            success: true,
            count: results.results.length,
            data: results.results,
            pagination: results.pagination,
            filters: results.filters
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get search suggestions (autocomplete)
 * @route   GET /api/search/suggestions
 * @access  Public
 */
exports.getSuggestions = async (req, res, next) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const suggestions = await searchService.getSearchSuggestions(q, parseInt(limit));

        res.status(200).json({
            success: true,
            count: suggestions.length,
            data: suggestions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get available genres
 * @route   GET /api/search/genres
 * @access  Public
 */
exports.getGenres = async (req, res, next) => {
    try {
        const genres = await searchService.getGenres();

        res.status(200).json({
            success: true,
            count: genres.length,
            data: genres
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get search statistics
 * @route   GET /api/search/stats
 * @access  Public
 */
exports.getSearchStats = async (req, res, next) => {
    try {
        const stats = await searchService.getSearchStats();

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Advanced search with multiple criteria
 * @route   POST /api/search/advanced
 * @access  Public
 */
exports.advancedSearch = async (req, res, next) => {
    try {
        const {
            keywords,
            filters,
            sort,
            page,
            limit
        } = req.body;

        // Validate request body
        if (!keywords && !filters) {
            return res.status(400).json({
                success: false,
                message: 'Arama terimi veya filtre gerekli'
            });
        }

        const searchParams = {
            q: keywords,
            ...filters,
            sortBy: sort,
            page,
            limit
        };

        const results = await searchService.searchSongs(searchParams);

        res.status(200).json({
            success: true,
            count: results.results.length,
            data: results.results,
            pagination: results.pagination,
            filters: results.filters
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
