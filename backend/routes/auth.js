const express = require('express');
const router = express.Router();
const {
    login,
    getMe,
    sendVerification,
    verifyAndRegister,
    resendCode
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { validateLogin, validateEmail } = require('../middleware/validation');

// Public routes
router.post('/send-verification', validateEmail, sendVerification);
router.post('/verify-and-register', verifyAndRegister); // Has its own validation
router.post('/resend-code', validateEmail, resendCode);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);

// Admin-only route example (Future use)
// router.get('/admin/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
