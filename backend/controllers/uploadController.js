/**
 * Upload Controller
 * Handles file upload HTTP requests
 * Delegates business logic to uploadService
 */

const uploadService = require('../services/uploadService');
const Media = require('../models/Media');

/**
 * @desc    Upload audio file
 * @route   POST /api/upload/audio
 * @access  Private
 */
exports.uploadAudio = async (req, res, next) => {
    try {
        const file = req.file;
        const { title, artist, album } = req.body;
        
        // Upload to Cloudinary
        const uploadResult = await uploadService.uploadAudio(file, {
            title,
            artist,
            album
        });
        
        // Save metadata to database
        const media = await Media.create({
            filename: file.originalname,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            mimetype: file.mimetype,
            resourceType: 'audio',
            format: uploadResult.format,
            size: uploadResult.size,
            duration: uploadResult.duration,
            category: 'song',
            uploadedBy: req.user.id,
            metadata: {
                title,
                artist,
                album
            }
        });
        
        res.status(201).json({
            success: true,
            message: 'Audio başarıyla yüklendi',
            data: {
                id: media._id,
                url: media.url,
                publicId: media.publicId,
                duration: media.formattedDuration,
                size: media.formattedSize,
                uploadedAt: media.uploadedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload image file
 * @route   POST /api/upload/image
 * @access  Private
 */
exports.uploadImage = async (req, res, next) => {
    try {
        const file = req.file;
        const { category = 'other', description } = req.body;
        
        // Upload to Cloudinary
        const uploadResult = await uploadService.uploadImage(file, 'image', {
            name: file.originalname.split('.')[0]
        });
        
        // Save metadata to database
        const media = await Media.create({
            filename: file.originalname,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            mimetype: file.mimetype,
            resourceType: 'image',
            format: uploadResult.format,
            size: uploadResult.size,
            width: uploadResult.width,
            height: uploadResult.height,
            category: category,
            uploadedBy: req.user.id,
            metadata: {
                description
            }
        });
        
        res.status(201).json({
            success: true,
            message: 'Resim başarıyla yüklendi',
            data: {
                id: media._id,
                url: media.url,
                thumbnailUrl: media.getThumbnailUrl(300, 300),
                publicId: media.publicId,
                dimensions: `${media.width}x${media.height}`,
                size: media.formattedSize,
                uploadedAt: media.uploadedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload avatar
 * @route   POST /api/upload/avatar
 * @access  Private
 */
exports.uploadAvatar = async (req, res, next) => {
    try {
        const file = req.file;
        const userId = req.user.id;
        
        // Upload to Cloudinary
        const uploadResult = await uploadService.uploadAvatar(file, userId);
        
        // Save metadata to database
        const media = await Media.create({
            filename: file.originalname,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            mimetype: file.mimetype,
            resourceType: 'image',
            format: uploadResult.format,
            size: uploadResult.size,
            width: uploadResult.width,
            height: uploadResult.height,
            category: 'avatar',
            uploadedBy: userId,
            relatedTo: {
                entityType: 'User',
                entityId: userId
            }
        });
        
        // Optional: Update user profile with new avatar URL
        // await User.findByIdAndUpdate(userId, { profileImage: media.url });
        
        res.status(201).json({
            success: true,
            message: 'Avatar başarıyla yüklendi',
            data: {
                id: media._id,
                url: media.url,
                thumbnailUrl: media.getThumbnailUrl(200, 200),
                uploadedAt: media.uploadedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/images
 * @access  Private
 */
exports.uploadMultipleImages = async (req, res, next) => {
    try {
        const files = req.files;
        const { category = 'other' } = req.body;
        
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Dosya yok'
            });
        }
        
        // Upload all to Cloudinary
        const uploadResults = await uploadService.uploadMultipleImages(files, 'image');
        
        // Save all metadata to database
        const mediaPromises = uploadResults.map((result, index) => 
            Media.create({
                filename: files[index].originalname,
                url: result.url,
                publicId: result.publicId,
                mimetype: files[index].mimetype,
                resourceType: 'image',
                format: result.format,
                size: result.size,
                width: result.width,
                height: result.height,
                category: category,
                uploadedBy: req.user.id
            })
        );
        
        const mediaRecords = await Promise.all(mediaPromises);
        
        res.status(201).json({
            success: true,
            message: `${mediaRecords.length} resim başarıyla yüklendi`,
            data: mediaRecords.map(media => ({
                id: media._id,
                url: media.url,
                thumbnailUrl: media.getThumbnailUrl(300, 300),
                size: media.formattedSize
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Upload song with cover
 * @route   POST /api/upload/song
 * @access  Private
 */
exports.uploadSongWithCover = async (req, res, next) => {
    try {
        const files = req.files;
        const { title, artist, album } = req.body;
        
        if (!files || !files.audio) {
            return res.status(400).json({
                success: false,
                message: 'Audio dosyası gerekli'
            });
        }
        
        const audioFile = files.audio[0];
        const coverFile = files.cover ? files.cover[0] : null;
        
        // Upload audio
        const audioResult = await uploadService.uploadAudio(audioFile, {
            title,
            artist,
            album
        });
        
        // Save audio metadata
        const audioMedia = await Media.create({
            filename: audioFile.originalname,
            url: audioResult.url,
            publicId: audioResult.publicId,
            mimetype: audioFile.mimetype,
            resourceType: 'audio',
            format: audioResult.format,
            size: audioResult.size,
            duration: audioResult.duration,
            category: 'song',
            uploadedBy: req.user.id,
            metadata: { title, artist, album }
        });
        
        let coverMedia = null;
        
        // Upload cover if exists
        if (coverFile) {
            const coverResult = await uploadService.uploadImage(coverFile, 'cover', {
                name: title
            });
            
            coverMedia = await Media.create({
                filename: coverFile.originalname,
                url: coverResult.url,
                publicId: coverResult.publicId,
                mimetype: coverFile.mimetype,
                resourceType: 'image',
                format: coverResult.format,
                size: coverResult.size,
                width: coverResult.width,
                height: coverResult.height,
                category: 'cover',
                uploadedBy: req.user.id,
                relatedTo: {
                    entityType: 'Song',
                    entityId: audioMedia._id
                }
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Şarkı başarıyla yüklendi',
            data: {
                audio: {
                    id: audioMedia._id,
                    url: audioMedia.url,
                    duration: audioMedia.formattedDuration,
                    size: audioMedia.formattedSize
                },
                cover: coverMedia ? {
                    id: coverMedia._id,
                    url: coverMedia.url,
                    thumbnailUrl: coverMedia.getThumbnailUrl(400, 400)
                } : null
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's uploaded files
 * @route   GET /api/upload/my-files
 * @access  Private
 */
exports.getMyFiles = async (req, res, next) => {
    try {
        const { category, limit = 50, page = 1 } = req.query;
        
        const query = {
            uploadedBy: req.user.id,
            status: 'active'
        };
        
        if (category) {
            query.category = category;
        }
        
        const skip = (page - 1) * limit;
        
        const [files, total] = await Promise.all([
            Media.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .select('-__v'),
            Media.countDocuments(query)
        ]);
        
        res.status(200).json({
            success: true,
            count: files.length,
            total: total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: files.map(file => ({
                id: file._id,
                url: file.url,
                thumbnailUrl: file.getThumbnailUrl ? file.getThumbnailUrl(200, 200) : null,
                filename: file.filename,
                category: file.category,
                resourceType: file.resourceType,
                size: file.formattedSize,
                duration: file.formattedDuration,
                uploadedAt: file.uploadedAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete uploaded file
 * @route   DELETE /api/upload/:id
 * @access  Private
 */
exports.deleteFile = async (req, res, next) => {
    try {
        const media = await Media.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Dosya bulunamadı'
            });
        }
        
        // Check ownership
        if (media.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu dosyayı silme yetkiniz yok'
            });
        }
        
        // Delete from Cloudinary
        await uploadService.deleteFromCloudinary(
            media.publicId,
            media.resourceType === 'audio' ? 'video' : media.resourceType
        );
        
        // Soft delete from database
        media.status = 'deleted';
        await media.save();
        
        res.status(200).json({
            success: true,
            message: 'Dosya başarıyla silindi'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
