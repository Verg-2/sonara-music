const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Bu işlem için giriş yapmalısınız'
        });
    }
    
    try {
        // Verify token with timeout
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'] // Only allow HS256 algorithm
        });
        
        // Ensure token is not too old (even if not expired in JWT terms)
        if (decoded.iat && Date.now() / 1000 - decoded.iat > 30 * 24 * 60 * 60) {
            throw new Error('Token too old');
        }
        
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token geçersiz veya süresi dolmuş',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Optional: Admin middleware for future use
exports.admin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için admin yetkisi gerekli'
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Yetkilendirme hatası'
        });
    }
};

/**
 * Role-based authorization middleware factory
 * @param {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Giriş yapmalısınız'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Bu işlem için ${roles.join(' veya ')} yetkisi gerekli`
            });
        }

        next();
    };
};
