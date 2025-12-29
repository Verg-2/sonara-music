/**
 * Upload Routes
 * File upload endpoints
 */

const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fileValidation = require('../middleware/fileValidation');
const uploadController = require('../controllers/uploadController');

/**
 * @route   POST /api/upload/audio
 * @desc    Upload audio file
 * @access  Private
 */
router.post(
    '/audio',
    protect,
    upload.uploadAudio,
    fileValidation.validateFileExists,
    fileValidation.validateAudioFile,
    uploadController.uploadAudio
);

/**
 * @route   POST /api/upload/image
 * @desc    Upload image file
 * @access  Private
 */
router.post(
    '/image',
    protect,
    upload.uploadImage,
    fileValidation.validateFileExists,
    fileValidation.validateImageFile,
    uploadController.uploadImage
);

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
    '/avatar',
    protect,
    upload.uploadAvatar,
    fileValidation.validateFileExists,
    fileValidation.validateImageFile,
    uploadController.uploadAvatar
);

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images
 * @access  Private
 */
router.post(
    '/images',
    protect,
    upload.uploadMultipleImages,
    fileValidation.validateMultipleFiles,
    uploadController.uploadMultipleImages
);

/**
 * @route   POST /api/upload/song
 * @desc    Upload song with cover
 * @access  Private
 */
router.post(
    '/song',
    protect,
    upload.uploadSongWithCover,
    fileValidation.validateSongUpload,
    uploadController.uploadSongWithCover
);

/**
 * @route   GET /api/upload/my-files
 * @desc    Get current user's uploaded files
 * @access  Private
 */
router.get('/my-files', protect, uploadController.getMyFiles);

/**
 * @route   DELETE /api/upload/:id
 * @desc    Delete uploaded file
 * @access  Private
 */
router.delete('/:id', protect, uploadController.deleteFile);

module.exports = router;
