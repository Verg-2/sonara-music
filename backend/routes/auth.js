const express = require('express');
const router = express.Router();
const {
    login,
    getMe,
    sendVerification,
    verifyAndRegister,
    resendCode
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-verification', sendVerification);
router.post('/verify-and-register', verifyAndRegister);
router.post('/resend-code', resendCode);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
