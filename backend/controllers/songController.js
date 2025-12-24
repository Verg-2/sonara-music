const Song = require('../models/Song');

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
        
        res.status(200).json({
            success: true,
            count: songs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: songs
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
        
        res.status(200).json({
            success: true,
            data: song
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
        
        res.status(201).json({
            success: true,
            data: song
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
        
        res.status(200).json({
            success: true,
            data: song
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
        
        res.status(200).json({
            success: true,
            data: song
        });
    } catch (error) {
        next(error);
    }
};
