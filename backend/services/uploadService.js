/**
 * Upload Service
 * Business logic for file uploads to cloud storage
 * Handles Cloudinary integration
 */

const { cloudinary, uploadPresets } = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from Multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        
        // Convert buffer to stream and pipe to Cloudinary
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Upload audio file
 * @param {Object} file - Multer file object
 * @param {Object} metadata - Additional metadata (title, artist, etc.)
 * @returns {Promise<Object>} Upload result
 */
const uploadAudio = async (file, metadata = {}) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Geçersiz dosya');
        }
        
        const options = {
            ...uploadPresets.audio,
            public_id: metadata.title ? `${Date.now()}-${metadata.title}` : undefined,
            context: {
                title: metadata.title || '',
                artist: metadata.artist || '',
                album: metadata.album || ''
            }
        };
        
        const result = await uploadToCloudinary(file.buffer, options);
        
        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            duration: result.duration || null,
            size: result.bytes,
            resourceType: result.resource_type,
            createdAt: result.created_at
        };
    } catch (error) {
        console.error('[UPLOAD SERVICE] Audio upload error:', error);
        throw new Error(`Audio yükleme hatası: ${error.message}`);
    }
};

/**
 * Upload image file
 * @param {Object} file - Multer file object
 * @param {String} type - Image type (image, avatar, cover)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (file, type = 'image', metadata = {}) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Geçersiz dosya');
        }
        
        // Get preset based on type
        const preset = uploadPresets[type] || uploadPresets.image;
        
        const options = {
            ...preset,
            public_id: metadata.name ? `${Date.now()}-${metadata.name}` : undefined,
            context: metadata.context || {}
        };
        
        const result = await uploadToCloudinary(file.buffer, options);
        
        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            resourceType: result.resource_type,
            createdAt: result.created_at
        };
    } catch (error) {
        console.error('[UPLOAD SERVICE] Image upload error:', error);
        throw new Error(`Resim yükleme hatası: ${error.message}`);
    }
};

/**
 * Upload avatar (optimized for profile pictures)
 * @param {Object} file - Multer file object
 * @param {String} userId - User ID for naming
 * @returns {Promise<Object>} Upload result
 */
const uploadAvatar = async (file, userId) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('Geçersiz dosya');
        }
        
        const options = {
            ...uploadPresets.avatar,
            public_id: `avatar-${userId}-${Date.now()}`,
            overwrite: true, // Replace old avatar
            invalidate: true // Invalidate CDN cache
        };
        
        const result = await uploadToCloudinary(file.buffer, options);
        
        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes
        };
    } catch (error) {
        console.error('[UPLOAD SERVICE] Avatar upload error:', error);
        throw new Error(`Avatar yükleme hatası: ${error.message}`);
    }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of Multer file objects
 * @param {String} type - Image type
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImages = async (files, type = 'image') => {
    try {
        if (!files || files.length === 0) {
            throw new Error('Dosya yok');
        }
        
        const uploadPromises = files.map((file, index) => 
            uploadImage(file, type, { name: `image-${index}` })
        );
        
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error('[UPLOAD SERVICE] Multiple images upload error:', error);
        throw new Error(`Toplu resim yükleme hatası: ${error.message}`);
    }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - Resource type (image, video)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        if (!publicId) {
            throw new Error('Public ID gerekli');
        }
        
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            invalidate: true // Invalidate CDN cache
        });
        
        return result;
    } catch (error) {
        console.error('[UPLOAD SERVICE] Delete error:', error);
        throw new Error(`Dosya silme hatası: ${error.message}`);
    }
};

/**
 * Get Cloudinary URL with transformations
 * @param {String} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {String} Transformed URL
 */
const getTransformedUrl = (publicId, transformations = {}) => {
    try {
        return cloudinary.url(publicId, {
            secure: true,
            ...transformations
        });
    } catch (error) {
        console.error('[UPLOAD SERVICE] Transform URL error:', error);
        throw new Error(`URL oluşturma hatası: ${error.message}`);
    }
};

module.exports = {
    uploadAudio,
    uploadImage,
    uploadAvatar,
    uploadMultipleImages,
    deleteFromCloudinary,
    getTransformedUrl
};
