/**
 * Multer Middleware Configuration
 * File upload middleware with memory storage
 * Files are stored in memory temporarily, then uploaded to Cloudinary
 */

const multer = require('multer');
const path = require('path');

/**
 * File filter - MIME type validation
 * @param {Object} req - Express request
 * @param {Object} file - Multer file object
 * @param {Function} cb - Callback
 */
const fileFilter = (req, file, cb) => {
    // Allowed MIME types
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const allowedTypes = [...allowedAudioTypes, ...allowedImageTypes];
    
    if (allowedTypes.includes(file.mimetype)) {
        // Accept file
        cb(null, true);
    } else {
        // Reject file
        cb(new Error(`Geçersiz dosya tipi: ${file.mimetype}. İzin verilen: mp3, wav, jpg, png, webp`), false);
    }
};

/**
 * Memory storage configuration
 * Files stored in buffer (RAM) temporarily
 * Better for cloud upload - no disk I/O overhead
 */
const storage = multer.memoryStorage();

/**
 * Base multer configuration
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max (will be overridden per route)
        files: 5, // Max 5 files per request
        fields: 10, // Max 10 non-file fields
    }
});

/**
 * Multer configurations for different upload types
 */

// Single audio file upload
const uploadAudio = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece audio dosyaları (mp3, wav) yüklenebilir'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    }
}).single('audio');

// Single image file upload
const uploadImage = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları (jpg, png, webp) yüklenebilir'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
}).single('image');

// Avatar upload (smaller size limit)
const uploadAvatar = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Avatar için sadece resim dosyaları yüklenebilir'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
        files: 1
    }
}).single('avatar');

// Multiple images upload
const uploadMultipleImages = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 5 // Max 5 images
    }
}).array('images', 5);

// Song with cover (audio + image)
const uploadSongWithCover = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 2
    }
}).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);

/**
 * Error handling middleware for Multer
 * Converts Multer errors to standard error format
 */
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        let message = 'Dosya yükleme hatası';
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'Dosya boyutu çok büyük. Maksimum boyut: 10MB (audio), 5MB (resim)';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Çok fazla dosya. Maksimum 5 dosya yüklenebilir';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Beklenmeyen dosya alanı';
                break;
            case 'LIMIT_FIELD_COUNT':
                message = 'Çok fazla form alanı';
                break;
            default:
                message = err.message;
        }
        
        return res.status(400).json({
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } else if (err) {
        // Other errors (from fileFilter, etc.)
        return res.status(400).json({
            success: false,
            message: err.message || 'Dosya yükleme hatası'
        });
    }
    
    next();
};

module.exports = {
    upload,
    uploadAudio,
    uploadImage,
    uploadAvatar,
    uploadMultipleImages,
    uploadSongWithCover,
    handleMulterError
};
