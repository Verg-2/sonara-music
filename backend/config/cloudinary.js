/**
 * Cloudinary Configuration
 * Cloud-based media storage ve CDN servisi
 */

const cloudinary = require('cloudinary').v2;

// Check if Cloudinary is enabled
const isCloudinaryEnabled = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_API_KEY && 
                            process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryEnabled) {
    // Cloudinary credentials from environment variables
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true // Always use HTTPS
    });
} else {
    console.log('[CLOUDINARY] ⚠️  Yapılandırma eksik - local dosya sistemi kullanılacak');
}

/**
 * Cloudinary bağlantısını test et
 */
const testConnection = async () => {
    if (!isCloudinaryEnabled) {
        console.log('[CLOUDINARY] ℹ️  Cloudinary devre dışı - local storage kullanımda');
        return false;
    }
    
    try {
        await cloudinary.api.ping();
        console.log('[CLOUDINARY] ✅ Bağlantı başarılı');
        return true;
    } catch (error) {
        console.error('[CLOUDINARY] ❌ Bağlantı hatası:', error.message);
        return false;
    }
};

/**
 * Cloudinary upload options presets
 */
const uploadPresets = {
    // Audio files (mp3, wav)
    audio: {
        resource_type: 'video', // Cloudinary'de audio da 'video' olarak upload edilir
        folder: 'music-app/audio',
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a'],
        max_file_size: 10485760, // 10MB in bytes
        quality: 'auto',
        fetch_format: 'auto'
    },
    
    // Image files (jpg, png, webp)
    image: {
        resource_type: 'image',
        folder: 'music-app/images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        max_file_size: 5242880, // 5MB in bytes
        transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ]
    },
    
    // Profile avatars
    avatar: {
        resource_type: 'image',
        folder: 'music-app/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_file_size: 2097152, // 2MB in bytes
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ]
    },
    
    // Album covers
    cover: {
        resource_type: 'image',
        folder: 'music-app/covers',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_file_size: 3145728, // 3MB in bytes
        transformation: [
            { width: 800, height: 800, crop: 'fill' },
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
        ]
    }
};

module.exports = {
    cloudinary,
    uploadPresets,
    testConnection
};
