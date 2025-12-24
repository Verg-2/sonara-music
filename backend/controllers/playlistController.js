const Playlist = require('../models/Playlist');

// @desc    Get all playlists
// @route   GET /api/playlists
// @access  Public
exports.getPlaylists = async (req, res, next) => {
    try {
        const { owner, isPublic, limit = 20, page = 1 } = req.query;
        
        let query = {};
        if (owner) query.owner = owner;
        if (isPublic !== undefined) query.isPublic = isPublic === 'true';
        
        const playlists = await Playlist.find(query)
            .populate('owner', 'username profileImage')
            .populate('songs', 'title artist coverImage')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort('-createdAt');
        
        const total = await Playlist.countDocuments(query);
        
        res.status(200).json({
            success: true,
            count: playlists.length,
            total,
            data: playlists
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single playlist
// @route   GET /api/playlists/:id
// @access  Public
exports.getPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('owner', 'username profileImage')
            .populate({
                path: 'songs',
                populate: { path: 'artist', select: 'name' }
            });
        
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist bulunamadı'
            });
        }
        
        res.status(200).json({
            success: true,
            data: playlist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create playlist
// @route   POST /api/playlists
// @access  Private
exports.createPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.create(req.body);
        
        res.status(201).json({
            success: true,
            data: playlist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update playlist
// @route   PUT /api/playlists/:id
// @access  Private
exports.updatePlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist bulunamadı'
            });
        }
        
        res.status(200).json({
            success: true,
            data: playlist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
exports.deletePlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByIdAndDelete(req.params.id);
        
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist bulunamadı'
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

// @desc    Add song to playlist
// @route   POST /api/playlists/:id/songs
// @access  Private
exports.addSongToPlaylist = async (req, res, next) => {
    try {
        const { songId } = req.body;
        
        const playlist = await Playlist.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { songs: songId } },
            { new: true }
        ).populate('songs');
        
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist bulunamadı'
            });
        }
        
        res.status(200).json({
            success: true,
            data: playlist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove song from playlist
// @route   DELETE /api/playlists/:id/songs/:songId
// @access  Private
exports.removeSongFromPlaylist = async (req, res, next) => {
    try {
        const playlist = await Playlist.findByIdAndUpdate(
            req.params.id,
            { $pull: { songs: req.params.songId } },
            { new: true }
        ).populate('songs');
        
        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist bulunamadı'
            });
        }
        
        res.status(200).json({
            success: true,
            data: playlist
        });
    } catch (error) {
        next(error);
    }
};
