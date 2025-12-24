const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
	try {
		const users = await User.find()
			.select('-password')
			.populate('favoriteSongs')
			.populate('favoriteArtists');
        
		res.status(200).json({
			success: true,
			count: users.length,
			data: users
		});
	} catch (error) {
		next(error);
	}
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.id)
			.select('-password')
			.populate('favoriteSongs')
			.populate('favoriteArtists')
			.populate('playlists');
        
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Kullanıcı bulunamadı'
			});
		}
        
		res.status(200).json({
			success: true,
			data: user
		});
	} catch (error) {
		next(error);
	}
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
	try {
		const fieldsToUpdate = {
			username: req.body.username,
			email: req.body.email,
			profileImage: req.body.profileImage
		};
        
		const user = await User.findByIdAndUpdate(
			req.params.id,
			fieldsToUpdate,
			{ new: true, runValidators: true }
		).select('-password');
        
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Kullanıcı bulunamadı'
			});
		}
        
		res.status(200).json({
			success: true,
			data: user
		});
	} catch (error) {
		next(error);
	}
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteUser = async (req, res, next) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);
        
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Kullanıcı bulunamadı'
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

// @desc    Add favorite (song or artist)
// @route   POST /api/users/:id/favorites/:type/:itemId
// @access  Private
exports.addFavorite = async (req, res, next) => {
	try {
		const { type, itemId } = req.params;
        
		let updateField;
		if (type === 'song') {
			updateField = 'favoriteSongs';
		} else if (type === 'artist') {
			updateField = 'favoriteArtists';
		} else {
			return res.status(400).json({
				success: false,
				message: 'Geçersiz favori tipi'
			});
		}
        
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ $addToSet: { [updateField]: itemId } },
			{ new: true }
		).select('-password');
        
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Kullanıcı bulunamadı'
			});
		}
        
		res.status(200).json({
			success: true,
			data: user
		});
	} catch (error) {
		next(error);
	}
};

// @desc    Remove favorite
// @route   DELETE /api/users/:id/favorites/:type/:itemId
// @access  Private
exports.removeFavorite = async (req, res, next) => {
	try {
		const { type, itemId } = req.params;
        
		let updateField;
		if (type === 'song') {
			updateField = 'favoriteSongs';
		} else if (type === 'artist') {
			updateField = 'favoriteArtists';
		} else {
			return res.status(400).json({
				success: false,
				message: 'Geçersiz favori tipi'
			});
		}
        
		const user = await User.findByIdAndUpdate(
			req.params.id,
			{ $pull: { [updateField]: itemId } },
			{ new: true }
		).select('-password');
        
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'Kullanıcı bulunamadı'
			});
		}
        
		res.status(200).json({
			success: true,
			data: user
		});
	} catch (error) {
		next(error);
	}
};

