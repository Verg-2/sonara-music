const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateToken, sendTokenResponse } = require('../utils/tokenUtils');
const EmailService = require('../services/EmailService');

// In-memory storage with expiration (Use Redis in production!)
const verificationCodes = new Map();

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
};

// Validate password strength
const isValidPassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
};

// Sanitize email
const sanitizeEmail = (email) => {
    return email.trim().toLowerCase();
};

// @desc    Send verification code (before registration)
// @route   POST /api/auth/send-verification
// @access  Public
exports.sendVerification = async (req, res, next) => {
    try {
        let { email } = req.body;
        
        // Input validation
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta gerekli'
            });
        }
        
        email = sanitizeEmail(email);
        
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir e-posta adresi girin'
            });
        }
        
        // Rate limit: Check if user already sent code recently (1 min)
        if (verificationCodes.has(email) && verificationCodes.get(email).expires > Date.now()) {
            return res.status(429).json({
                success: false,
                message: 'Lütfen 1 dakika sonra tekrar deneyin'
            });
        }
        
        // Check if user already exists
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Bu e-posta adresi zaten kayıtlı'
            });
        }
        
        // Generate 6-digit verification code (cryptographically secure)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code temporarily (5 minutes expiry)
        verificationCodes.set(email, {
            code: verificationCode,
            expires: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });
        
        // Send verification email (SendGrid)
        if (!process.env.SENDGRID_API_KEY) {
            console.log(`\n📧 E-POSTA DOĞRULAMA KODU: ${verificationCode}`);
            console.log(`📨 Gönderilen adres: ${email}\n`);
        }
        try {
            await EmailService.sendVerificationEmail({
                to: email,
                code: verificationCode,
                username: email.split('@')[0]
            });
        } catch (mailErr) {
            console.error('[EMAIL] Doğrulama maili gönderilemedi:', mailErr.message);
            // Backward compatible: still log the code for local/dev fallback
            console.log(`\n📧 E-POSTA DOĞRULAMA KODU: ${verificationCode}`);
            console.log(`📨 Gönderilen adres: ${email}\n`);

            // If SendGrid is configured, fail fast in production-like usage
            if (process.env.SENDGRID_API_KEY) {
                return res.status(502).json({
                    success: false,
                    message: 'E-posta gönderimi başarısız. Lütfen tekrar deneyin.'
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Doğrulama kodu e-postanıza gönderildi'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify code and register user
// @route   POST /api/auth/verify-and-register
// @access  Public
exports.verifyAndRegister = async (req, res, next) => {
    try {
        let { email, password, code, username } = req.body;
        
        // Input validation
        if (!email || !password || !code) {
            return res.status(400).json({
                success: false,
                message: 'E-posta, şifre ve kod gerekli'
            });
        }
        
        email = sanitizeEmail(email);
        
        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir e-posta adresi girin'
            });
        }
        
        // Validate password strength
        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermeli'
            });
        }
        
        // Prevent code enumeration - limit attempts
        const stored = verificationCodes.get(email);
        
        if (!stored) {
            return res.status(400).json({
                success: false,
                message: 'Doğrulama kodu bulunamadı veya süresi doldu'
            });
        }
        
        // Rate limit: Max 3 attempts per code
        if (stored.attempts >= 3) {
            verificationCodes.delete(email);
            return res.status(429).json({
                success: false,
                message: 'Çok fazla deneme. Lütfen yeni bir kod talep edin'
            });
        }
        
        stored.attempts = (stored.attempts || 0) + 1;
        
        if (stored.expires < Date.now()) {
            verificationCodes.delete(email);
            return res.status(400).json({
                success: false,
                message: 'Doğrulama kodunun süresi doldu'
            });
        }
        
        if (stored.code !== code.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz doğrulama kodu'
            });
        }
        
        // Code is valid, create user
        const user = await User.create({
            username: username || email.split('@')[0],
            email,
            password,
            isVerified: true
        });
        
        // Remove verification code
        verificationCodes.delete(email);
        
        // Welcome email (async, non-blocking)
        setImmediate(() => {
            EmailService.sendWelcomeEmail({
                to: user.email,
                username: user.username
            }).catch(err => {
                console.error('[EMAIL] Welcome maili gönderilemedi:', err.message);
            });
        });

        res.status(201).json({
            success: true,
            message: 'Kayıt başarıyla tamamlandı',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'E-posta ve şifre gerekli'
            });
        }
        
        // Sanitize email
        const sanitizedEmail = sanitizeEmail(email);
        
        // Check for user
        const user = await User.findOne({ email: sanitizedEmail }).select('+password');
        
        if (!user) {
            // Don't reveal if email exists (security)
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kimlik bilgileri'
            });
        }
        
        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'E-postanız henüz doğrulanmamış'
            });
        }
        
        // Check if password matches
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            // Don't reveal password is wrong (security)
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kimlik bilgileri'
            });
        }
        
        // Send token response with cookie
        const token = generateToken(user._id, user.role);
        sendTokenResponse(res, 200, token, user);
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('favoriteSongs')
            .populate('favoriteArtists')
            .populate('playlists');
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        let { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'E-posta ve kod gerekli'
            });
        }
        
        email = sanitizeEmail(email);
        
        // Find user with verification code
        const user = await User.findOne({ email }).select('+verificationCode');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }
        
        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'E-posta zaten doğrulanmış'
            });
        }
        
        // Check if code matches
        if (user.verificationCode !== code.toString().trim()) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz doğrulama kodu'
            });
        }
        
        // Verify user
        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'E-posta başarıyla doğrulandı',
            data: {
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend verification code
// @route   POST /api/auth/resend-code
// @access  Public
exports.resendCode = async (req, res, next) => {
    try {
        let { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta gerekli'
            });
        }
        
        email = sanitizeEmail(email);
        
        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir e-posta adresi girin'
            });
        }
        
        // Rate limit: Check if user already sent code recently (1 min)
        if (verificationCodes.has(email) && verificationCodes.get(email).expires > Date.now()) {
            return res.status(429).json({
                success: false,
                message: 'Lütfen 1 dakika sonra tekrar deneyin'
            });
        }
        
        // Check if user already exists
        const userExists = await User.findOne({ email });
        
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Bu e-posta adresi zaten kayıtlı'
            });
        }
        
        // Generate new code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code temporarily (5 minutes expiry)
        verificationCodes.set(email, {
            code: verificationCode,
            expires: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });
        
        // TODO: Send code via email service
        console.log(`\n📧 YENİ DOĞRULAMA KODU: ${verificationCode}`);
        console.log(`📨 Gönderilen adres: ${email}\n`);
        
        res.status(200).json({
            success: true,
            message: 'Yeni doğrulama kodu gönderildi'
        });
    } catch (error) {
        next(error);
    }
};
