/**
 * Input Validation Middleware
 * Request body validasyonu için reusable middleware'ler
 */

/**
 * Email validasyonu
 */
const validateEmail = (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email gerekli'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
        return res.status(400).json({
            success: false,
            message: 'Geçerli bir email adresi girin'
        });
    }

    // Email'i normalize et
    req.body.email = email.trim().toLowerCase();
    next();
};

/**
 * Şifre validasyonu
 */
const validatePassword = (req, res, next) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Şifre gerekli'
        });
    }

    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({
            success: false,
            message: 'Şifre 8-128 karakter arasında olmalı'
        });
    }

    // Güçlü şifre kontrolü
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return res.status(400).json({
            success: false,
            message: 'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermeli'
        });
    }

    next();
};

/**
 * Username validasyonu
 */
const validateUsername = (req, res, next) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Kullanıcı adı gerekli'
        });
    }

    if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
            success: false,
            message: 'Kullanıcı adı 3-30 karakter arasında olmalı'
        });
    }

    // Sadece alfanumerik ve alt çizgi
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).json({
            success: false,
            message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
        });
    }

    req.body.username = username.trim();
    next();
};

/**
 * Register için combined validation
 */
const validateRegister = [
    validateEmail,
    validatePassword,
    validateUsername
];

/**
 * Login için combined validation
 */
const validateLogin = [
    validateEmail,
    (req, res, next) => {
        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'Şifre gerekli'
            });
        }
        next();
    }
];

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    validateRegister,
    validateLogin
};
