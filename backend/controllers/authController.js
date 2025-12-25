const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Temporary storage for verification codes (in production, use Redis)
const verificationCodes = new Map();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Send verification code (before registration)
// @route   POST /api/auth/send-verification
// @access  Public
exports.sendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta gerekli'
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
        
        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code temporarily (5 minutes expiry)
        verificationCodes.set(email, {
            code: verificationCode,
            expires: Date.now() + 5 * 60 * 1000
        });
        
        // TODO: E-postaya kod gönder
        console.log(`\n📧 E-POSTA DOĞRULAMA KODU: ${verificationCode}`);
        console.log(`📨 Gönderilen adres: ${email}\n`);
        
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
        const { email, password, code } = req.body;
        
        if (!email || !password || !code) {
            return res.status(400).json({
                success: false,
                message: 'E-posta, şifre ve kod gerekli'
            });
        }
        
        // Check verification code
        const stored = verificationCodes.get(email);
        
        if (!stored) {
            return res.status(400).json({
                success: false,
                message: 'Doğrulama kodu bulunamadı veya süresi doldu'
            });
        }
        
        if (stored.expires < Date.now()) {
            verificationCodes.delete(email);
            return res.status(400).json({
                success: false,
                message: 'Doğrulama kodunun süresi doldu'
            });
        }
        
        if (stored.code !== code) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz doğrulama kodu'
            });
        }
        
        // Code is valid, create user
        const user = await User.create({
            username: email.split('@')[0],
            email,
            password,
            isVerified: true
        });
        
        // Remove verification code
        verificationCodes.delete(email);
        
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
                message: 'Email ve şifre gerekli'
            });
        }
        
        // Check for user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kimlik bilgileri'
            });
        }
        
        // Check if email is verified
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Lütfen önce e-postanızı doğrulayın'
            });
        }
        
        // Check if password matches
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kimlik bilgileri'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Giriş başarılı',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                token: generateToken(user._id)
            }
        });
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
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'E-posta ve kod gerekli'
            });
        }
        
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
        if (user.verificationCode !== code) {
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
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta gerekli'
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
            expires: Date.now() + 5 * 60 * 1000
        });
        
        // TODO: E-postaya kod gönder
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
