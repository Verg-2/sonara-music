const Song = require('../models/Song');

// Helper: Convert relative audioUrl to absolute URL
const getAbsoluteAudioUrl = (audioUrl, req) => {
    if (!audioUrl) return audioUrl;
    
    // If already absolute URL, return as is
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
        return audioUrl;
    }
    
    // Build absolute URL
    // Use req.protocol (handles http/https) or default to http
    const protocol = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    const host = req.get('host') || req.headers.host || '127.0.0.1:5000';
    
    // If starts with /, it's already a path
    if (audioUrl.startsWith('/')) {
        return `${protocol}://${host}${audioUrl}`;
    }
    
    // Otherwise, assume it's a filename in /api/media
    return `${protocol}://${host}/api/media/${audioUrl}`;
};

// Helper: Convert relative image URL to absolute URL
const getAbsoluteImageUrl = (imageUrl, req) => {
    if (!imageUrl) return imageUrl;
    
    // If already absolute URL or data URI, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
        return imageUrl;
    }
    
    // Build absolute URL
    // Use req.protocol (handles http/https) or default to http
    const protocol = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
    const host = req.get('host') || req.headers.host || '127.0.0.1:5000';
    
    // If starts with /, it's already a path
    if (imageUrl.startsWith('/')) {
        return `${protocol}://${host}${imageUrl}`;
    }
    
    // Otherwise, assume it's a filename in /api/media
    return `${protocol}://${host}/api/media/${imageUrl}`;
};

// Helper: Transform song object to include absolute URLs
const transformSong = (song, req) => {
    if (!song) return song;
    
    const songObj = song.toObject ? song.toObject() : song;
    
    if (songObj.audioUrl) {
        songObj.audioUrl = getAbsoluteAudioUrl(songObj.audioUrl, req);
    }
    if (songObj.url) {
        songObj.url = getAbsoluteAudioUrl(songObj.url, req);
    }
    if (songObj.coverImage) {
        songObj.coverImage = getAbsoluteImageUrl(songObj.coverImage, req);
    }
    
    return songObj;
};

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
exports.getSongs = async (req, res, next) => {
    try {
        const { category, artist, limit = 50, page = 1 } = req.query;
        
        let query = {};
        if (category) query.category = category;
        if (artist) query.artist = artist;
        
        const songs = await Song.find(query)
            .populate('artist', 'name image')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort('-createdAt');
        
        const total = await Song.countDocuments(query);
        
        // Transform songs to include absolute URLs
        const transformedSongs = songs.map(song => transformSong(song, req));
        
        res.status(200).json({
            success: true,
            count: transformedSongs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: transformedSongs
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single song
// @route   GET /api/songs/:id
// @access  Public
exports.getSong = async (req, res, next) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artist', 'name image bio');
        
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Şarkı bulunamadı'
            });
        }
        
        // Transform song to include absolute URLs
        const transformedSong = transformSong(song, req);
        
        res.status(200).json({
            success: true,
            data: transformedSong
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create song
// @route   POST /api/songs
// @access  Private/Admin
exports.createSong = async (req, res, next) => {
    try {
        const song = await Song.create(req.body);
        
        // Transform song to include absolute URLs
        const transformedSong = transformSong(song, req);
        
        res.status(201).json({
            success: true,
            data: transformedSong
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update song
// @route   PUT /api/songs/:id
// @access  Private/Admin
exports.updateSong = async (req, res, next) => {
    try {
        const song = await Song.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Şarkı bulunamadı'
            });
        }
        
        // Transform song to include absolute URLs
        const transformedSong = transformSong(song, req);
        
        res.status(200).json({
            success: true,
            data: transformedSong
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete song
// @route   DELETE /api/songs/:id
// @access  Private/Admin
exports.deleteSong = async (req, res, next) => {
    try {
        const song = await Song.findByIdAndDelete(req.params.id);
        
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Şarkı bulunamadı'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Increment play count
// @route   POST /api/songs/:id/play
// @access  Public
exports.incrementPlayCount = async (req, res, next) => {
    try {
        const song = await Song.findByIdAndUpdate(
            req.params.id,
            { $inc: { playCount: 1 } },
            { new: true }
        );
        
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Şarkı bulunamadı'
            });
        }
        
        // Transform song to include absolute URLs
        const transformedSong = transformSong(song, req);
        
        res.status(200).json({
            success: true,
            data: transformedSong
        });
    } catch (error) {
        next(error);
    }
};
