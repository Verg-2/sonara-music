/**
 * File Helper Utilities
 * Common file operations and helpers
 */

const path = require('path');
const crypto = require('crypto');

/**
 * Sanitize filename - Remove dangerous characters
 */
exports.sanitizeFilename = (filename) => {
    if (!filename) return 'unnamed';
    
    // Remove path traversal attempts
    let safe = filename.replace(/\.\./g, '');
    
    // Remove dangerous characters
    safe = safe.replace(/[<>:"|?*\x00-\x1F]/g, '');
    
    // Replace spaces with underscores
    safe = safe.replace(/\s+/g, '_');
    
    // Limit length
    if (safe.length > 100) {
        const ext = path.extname(safe);
        const name = path.basename(safe, ext);
        safe = name.substring(0, 100 - ext.length) + ext;
    }
    
    return safe || 'unnamed';
};

/**
 * Get file extension
 */
exports.getExtension = (filename) => {
    if (!filename) return '';
    return path.extname(filename).toLowerCase().replace('.', '');
};

/**
 * Validate file extension against allowed list
 */
exports.validateExtension = (filename, allowedExtensions) => {
    const ext = exports.getExtension(filename);
    return allowedExtensions.includes(ext);
};

/**
 * Generate unique filename
 */
exports.generateUniqueFilename = (originalFilename) => {
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const sanitized = exports.sanitizeFilename(basename);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    
    return `${sanitized}_${timestamp}_${random}${ext}`;
};

/**
 * Format bytes to human readable size
 */
exports.formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format duration (seconds) to human readable time
 */
exports.formatDuration = (seconds) => {
    if (!seconds || seconds < 0) return '0:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get MIME type category
 */
exports.getMimeCategory = (mimetype) => {
    if (!mimetype) return 'unknown';
    
    const [category] = mimetype.split('/');
    return category;
};

/**
 * Check if MIME type is allowed
 */
exports.isAllowedMimeType = (mimetype, allowedTypes) => {
    if (!mimetype) return false;
    return allowedTypes.includes(mimetype);
};

/**
 * Check if file size is within limit
 */
exports.isWithinSizeLimit = (size, limitInBytes) => {
    return size <= limitInBytes;
};

/**
 * Get file metadata from buffer
 */
exports.getFileMetadata = (file) => {
    return {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        sizeFormatted: exports.formatBytes(file.size),
        extension: exports.getExtension(file.originalname),
        category: exports.getMimeCategory(file.mimetype)
    };
};

/**
 * Validate multiple files
 */
exports.validateFiles = (files, options = {}) => {
    const {
        maxCount = 5,
        maxSize = 5 * 1024 * 1024, // 5MB
        allowedMimeTypes = []
    } = options;
    
    const errors = [];
    
    if (!files || files.length === 0) {
        errors.push('Dosya yok');
        return { valid: false, errors };
    }
    
    if (files.length > maxCount) {
        errors.push(`Maksimum ${maxCount} dosya yüklenebilir`);
    }
    
    files.forEach((file, index) => {
        if (file.size > maxSize) {
            errors.push(`Dosya ${index + 1}: Boyut limiti aşıldı (${exports.formatBytes(maxSize)})`);
        }
        
        if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
            errors.push(`Dosya ${index + 1}: İzin verilmeyen dosya türü (${file.mimetype})`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Generate safe public ID for Cloudinary
 */
exports.generatePublicId = (folder, filename) => {
    const sanitized = exports.sanitizeFilename(filename);
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    
    return `${folder}/${sanitized}_${timestamp}_${random}`;
};

module.exports = exports;
