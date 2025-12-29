/**
 * Search Service
 * Advanced search and filtering logic
 * Uses MongoDB Atlas Search for full-text search with fuzzy matching
 */

const Song = require('../models/Song');
const Artist = require('../models/Artist');

/**
 * Build MongoDB Atlas Search query
 */
const buildSearchQuery = (searchTerm, options = {}) => {
    const {
        fuzzy = true,
        fields = ['title', 'artist', 'album', 'genre']
    } = options;

    if (!searchTerm || searchTerm.trim() === '') {
        return null;
    }

    // Atlas Search query with compound scoring
    const searchQuery = {
        $search: {
            index: 'songs_search_index', // Atlas Search index name
            compound: {
                should: [
                    // Title search (highest priority - 3x boost)
                    {
                        text: {
                            query: searchTerm,
                            path: 'title',
                            fuzzy: fuzzy ? {
                                maxEdits: 1,
                                prefixLength: 2
                            } : undefined,
                            score: { boost: { value: 3 } }
                        }
                    },
                    // Artist search (2x boost)
                    {
                        text: {
                            query: searchTerm,
                            path: 'artist',
                            fuzzy: fuzzy ? {
                                maxEdits: 1,
                                prefixLength: 2
                            } : undefined,
                            score: { boost: { value: 2 } }
                        }
                    },
                    // Album search (1x boost)
                    {
                        text: {
                            query: searchTerm,
                            path: 'album',
                            fuzzy: fuzzy ? {
                                maxEdits: 1,
                                prefixLength: 1
                            } : undefined,
                            score: { boost: { value: 1 } }
                        }
                    },
                    // Genre search (exact match preferred)
                    {
                        text: {
                            query: searchTerm,
                            path: 'genre',
                            score: { boost: { value: 1.5 } }
                        }
                    }
                ],
                minimumShouldMatch: 1
            }
        }
    };

    return searchQuery;
};

/**
 * Build filter query for additional criteria
 */
const buildFilterQuery = (filters = {}) => {
    const query = {};

    // Genre filter (exact match)
    if (filters.genre) {
        query.genre = filters.genre;
    }

    // Artist filter
    if (filters.artist) {
        query.artist = new RegExp(filters.artist, 'i');
    }

    // Album filter
    if (filters.album) {
        query.album = new RegExp(filters.album, 'i');
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
        query.releaseDate = {};
        if (filters.dateFrom) {
            query.releaseDate.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
            query.releaseDate.$lte = new Date(filters.dateTo);
        }
    }

    // Duration filter (in seconds)
    if (filters.minDuration || filters.maxDuration) {
        query.duration = {};
        if (filters.minDuration) {
            query.duration.$gte = parseInt(filters.minDuration);
        }
        if (filters.maxDuration) {
            query.duration.$lte = parseInt(filters.maxDuration);
        }
    }

    return query;
};

/**
 * Get sort options
 */
const getSortOptions = (sortBy = 'relevance') => {
    const sortOptions = {
        relevance: { score: { $meta: 'searchScore' } }, // Atlas Search score
        popularity: { playCount: -1, createdAt: -1 },
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        alphabetical: { title: 1 },
        'alphabetical-desc': { title: -1 },
        duration: { duration: -1 }
    };

    return sortOptions[sortBy] || sortOptions.relevance;
};

/**
 * Main search function
 * @param {Object} params - Search parameters
 * @returns {Object} - Search results with pagination
 */
exports.searchSongs = async (params) => {
    const {
        q: searchTerm,
        genre,
        artist,
        album,
        dateFrom,
        dateTo,
        minDuration,
        maxDuration,
        sortBy = 'relevance',
        page = 1,
        limit = 20
    } = params;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Validate pagination
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new Error('Geçersiz sayfalama parametreleri');
    }

    let pipeline = [];

    // If search term exists, use Atlas Search
    if (searchTerm && searchTerm.trim() !== '') {
        const searchQuery = buildSearchQuery(searchTerm, { fuzzy: true });
        if (searchQuery) {
            pipeline.push(searchQuery);
            
            // Add search score to results
            pipeline.push({
                $addFields: {
                    searchScore: { $meta: 'searchScore' }
                }
            });
        }
    }

    // Apply additional filters
    const filterQuery = buildFilterQuery({
        genre,
        artist,
        album,
        dateFrom,
        dateTo,
        minDuration,
        maxDuration
    });

    if (Object.keys(filterQuery).length > 0) {
        pipeline.push({ $match: filterQuery });
    }

    // Add sort
    if (sortBy === 'relevance' && searchTerm) {
        // Already sorted by search score
        pipeline.push({ $sort: getSortOptions('relevance') });
    } else {
        pipeline.push({ $sort: getSortOptions(sortBy) });
    }

    // Count total results (before pagination)
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    // Populate artist details if needed
    pipeline.push({
        $lookup: {
            from: 'artists',
            localField: 'artist',
            foreignField: 'name',
            as: 'artistDetails'
        }
    });

    // Execute queries in parallel
    const [results, countResult] = await Promise.all([
        Song.aggregate(pipeline),
        Song.aggregate(countPipeline)
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(total / limitNum);

    return {
        results: results.map(song => ({
            id: song._id,
            title: song.title,
            artist: song.artist,
            album: song.album,
            genre: song.genre,
            duration: song.duration,
            coverImage: song.coverImage,
            audioUrl: song.audioUrl,
            playCount: song.playCount || 0,
            releaseDate: song.releaseDate,
            searchScore: song.searchScore || null,
            artistDetails: song.artistDetails?.[0] || null
        })),
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: total,
            resultsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        },
        filters: {
            searchTerm: searchTerm || null,
            genre: genre || null,
            artist: artist || null,
            album: album || null,
            sortBy
        }
    };
};

/**
 * Fallback search using regex (if Atlas Search not available)
 */
exports.searchSongsSimple = async (params) => {
    const {
        q: searchTerm,
        genre,
        artist,
        album,
        sortBy = 'relevance',
        page = 1,
        limit = 20
    } = params;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build regex query
    const query = {};

    if (searchTerm && searchTerm.trim() !== '') {
        const regex = new RegExp(searchTerm, 'i');
        query.$or = [
            { title: regex },
            { artist: regex },
            { album: regex },
            { genre: regex }
        ];
    }

    // Apply filters
    if (genre) query.genre = genre;
    if (artist) query.artist = new RegExp(artist, 'i');
    if (album) query.album = new RegExp(album, 'i');

    // Get sort
    let sort = {};
    if (sortBy === 'popularity') {
        sort = { playCount: -1, createdAt: -1 };
    } else if (sortBy === 'newest') {
        sort = { createdAt: -1 };
    } else if (sortBy === 'alphabetical') {
        sort = { title: 1 };
    } else {
        sort = { createdAt: -1 }; // Default
    }

    // Execute queries
    const [results, total] = await Promise.all([
        Song.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select('-__v')
            .lean(),
        Song.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
        results: results.map(song => ({
            id: song._id,
            title: song.title,
            artist: song.artist,
            album: song.album,
            genre: song.genre,
            duration: song.duration,
            coverImage: song.coverImage,
            audioUrl: song.audioUrl,
            playCount: song.playCount || 0
        })),
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: total,
            resultsPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        },
        filters: {
            searchTerm: searchTerm || null,
            genre: genre || null,
            artist: artist || null,
            sortBy
        }
    };
};

/**
 * Get search suggestions (autocomplete)
 */
exports.getSearchSuggestions = async (query, limit = 10) => {
    if (!query || query.length < 2) {
        return [];
    }

    const regex = new RegExp(`^${query}`, 'i');

    // Get suggestions from titles and artists
    const [titleSuggestions, artistSuggestions] = await Promise.all([
        Song.find({ title: regex })
            .select('title')
            .limit(limit)
            .lean(),
        Song.distinct('artist', { artist: regex }).limit(limit)
    ]);

    const suggestions = [
        ...titleSuggestions.map(s => ({ type: 'song', value: s.title })),
        ...artistSuggestions.map(a => ({ type: 'artist', value: a }))
    ];

    // Remove duplicates and limit
    const unique = [...new Map(suggestions.map(s => [s.value, s])).values()];
    return unique.slice(0, limit);
};

/**
 * Get available genres for filter dropdown
 */
exports.getGenres = async () => {
    const genres = await Song.distinct('genre');
    return genres.filter(g => g).sort();
};

/**
 * Get search statistics
 */
exports.getSearchStats = async () => {
    const stats = await Song.aggregate([
        {
            $group: {
                _id: null,
                totalSongs: { $sum: 1 },
                totalGenres: { $addToSet: '$genre' },
                totalArtists: { $addToSet: '$artist' },
                avgDuration: { $avg: '$duration' },
                totalPlayCount: { $sum: { $ifNull: ['$playCount', 0] } }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            totalSongs: 0,
            totalGenres: 0,
            totalArtists: 0,
            avgDuration: 0,
            totalPlayCount: 0
        };
    }

    return {
        totalSongs: stats[0].totalSongs,
        totalGenres: stats[0].totalGenres.length,
        totalArtists: stats[0].totalArtists.length,
        avgDuration: Math.round(stats[0].avgDuration),
        totalPlayCount: stats[0].totalPlayCount
    };
};

module.exports = exports;
