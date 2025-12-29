/**
 * JWT Token Utility Functions
 * Token oluşturma, doğrulama ve cookie yönetimi
 */

const jwt = require('jsonwebtoken');

/**
 * JWT Token oluştur
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @returns {String} JWT token
 */
const generateToken = (userId, role = 'user') => {
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '30d',
            algorithm: 'HS256'
        }
    );
};

/**
 * Refresh Token oluştur (daha uzun ömürlü)
 * @param {String} userId - User ID
 * @returns {String} Refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        {
            expiresIn: '90d',
            algorithm: 'HS256'
        }
    );
};

/**
 * Token'ı doğrula
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
    });
};

/**
 * HTTP-only cookie olarak token gönder
 * @param {Object} res - Express response object
 * @param {String} token - JWT token
 */
const sendTokenResponse = (res, statusCode, token, user) => {
    const options = {
        expires: new Date(
            Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // XSS protection
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict' // CSRF protection
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    sendTokenResponse
};
