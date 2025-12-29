/**
 * Global Error Handler Middleware
 * Tüm hataları yakalar, loglar ve standart formatta client'a döner
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging (production'da Winston/Morgan kullan)
    console.error('[ERROR]', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Kaynak bulunamadı';
        error = { statusCode: 404, message };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Bu ${field} zaten kullanımda`;
        error = { statusCode: 400, message };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { statusCode: 400, message };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Geçersiz token';
        error = { statusCode: 401, message };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token süresi dolmuş';
        error = { statusCode: 401, message };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Sunucu hatası',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
