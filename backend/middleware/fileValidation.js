/**
 * File Validation Middleware
 * Additional validation after Multer
 * Security checks, metadata validation
 */

/**
 * Validate uploaded file exists
 */
const validateFileExists = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({
            success: false,
            message: 'Dosya yüklenmedi'
        });
    }
    next();
};

/**
 * Validate file metadata
 */
const validateFileMetadata = (req, res, next) => {
    const file = req.file;
    
    if (!file) {
        return next();
    }
    
    // Check if buffer exists
    if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Dosya içeriği boş'
        });
    }
    
    // Check original filename
    if (!file.originalname || file.originalname.length > 255) {
        return res.status(400).json({
            success: false,
            message: 'Geçersiz dosya adı'
        });
    }
    
    // Security: Check for dangerous file extensions in original name
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html'];
    const hasDangerousExt = dangerousExtensions.some(ext => 
        file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasDangerousExt) {
        return res.status(400).json({
            success: false,
            message: 'Güvenlik nedeniyle bu dosya tipi yüklenemez'
        });
    }
    
    next();
};

/**
 * Validate audio file specifically
 */
const validateAudioFile = (req, res, next) => {
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'Audio dosyası yüklenmedi'
        });
    }
    
    // Check MIME type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'Geçersiz audio formatı. Sadece mp3 ve wav desteklenir'
        });
    }
    
    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
            success: false,
            message: 'Audio dosyası çok büyük. Maksimum: 10MB'
        });
    }
    
    // Check minimum size (10KB - prevents empty files)
    if (file.size < 10 * 1024) {
        return res.status(400).json({
            success: false,
            message: 'Audio dosyası çok küçük veya bozuk'
        });
    }
    
    next();
};

/**
 * Validate image file specifically
 */
const validateImageFile = (req, res, next) => {
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({
            success: false,
            message: 'Resim dosyası yüklenmedi'
        });
    }
    
    // Check MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: 'Geçersiz resim formatı. Sadece jpg, png, webp desteklenir'
        });
    }
    
    // Check file size (5MB for images, 2MB for avatars)
    const maxSize = req.path.includes('avatar') ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return res.status(400).json({
            success: false,
            message: `Resim çok büyük. Maksimum: ${maxSize / (1024 * 1024)}MB`
        });
    }
    
    // Check minimum size (1KB)
    if (file.size < 1024) {
        return res.status(400).json({
            success: false,
            message: 'Resim çok küçük veya bozuk'
        });
    }
    
    // Basic image validation via magic numbers (file signature)
    const buffer = file.buffer;
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWEBP = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    
    if (!isJPEG && !isPNG && !isWEBP) {
        return res.status(400).json({
            success: false,
            message: 'Dosya gerçek bir resim değil'
        });
    }
    
    next();
};

/**
 * Validate multiple files
 */
const validateMultipleFiles = (req, res, next) => {
    const files = req.files;
    
    if (!files || files.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Dosya yüklenmedi'
        });
    }
    
    // Check each file
    for (const file of files) {
        if (!file.buffer || file.buffer.length === 0) {
            return res.status(400).json({
                success: false,
                message: `Dosya boş: ${file.originalname}`
            });
        }
    }
    
    next();
};

/**
 * Validate song upload request body
 */
const validateSongUpload = (req, res, next) => {
    const { title, artist } = req.body;
    
    if (!title || title.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Şarkı başlığı gerekli'
        });
    }
    
    if (title.length > 200) {
        return res.status(400).json({
            success: false,
            message: 'Şarkı başlığı çok uzun (max 200 karakter)'
        });
    }
    
    if (!artist || artist.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Sanatçı adı gerekli'
        });
    }
    
    if (artist.length > 100) {
        return res.status(400).json({
            success: false,
            message: 'Sanatçı adı çok uzun (max 100 karakter)'
        });
    }
    
    next();
};

module.exports = {
    validateFileExists,
    validateFileMetadata,
    validateAudioFile,
    validateImageFile,
    validateMultipleFiles,
    validateSongUpload
};
