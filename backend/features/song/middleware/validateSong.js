/**
 * Song Validation Middleware
 * features/song/middleware/validateSong.js
 * 
 * Express-validator rules for Song feature endpoints
 */

const { body, param, query, validationResult } = require('express-validator');
const AppError = require('../../../shared/errors/AppError');

/**
 * Validation error handler
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errorMessages));
  }
  next();
};

/**
 * CREATE / UPLOAD SONG VALIDATION
 */
const validateSongUpload = [
  // File validation (handled by multer, but double-check here)
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('artist')
    .trim()
    .notEmpty()
    .withMessage('Artist ID is required')
    .isMongoId()
    .withMessage('Artist ID must be valid'),

  body('album')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Album ID must be valid'),

  body('genre')
    .notEmpty()
    .withMessage('Genre is required')
    .isIn(['pop', 'rock', 'jazz', 'classical', 'hip-hop', 'electronic', 'country', 'rnb', 'indie', 'metal', 'other'])
    .withMessage('Invalid genre'),

  body('duration')
    .optional()
    .isInt({ min: 10, max: 3600 })
    .withMessage('Duration must be between 10 and 3600 seconds'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('lyrics')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Lyrics must not exceed 5000 characters'),

  body('releaseDate')
    .optional()
    .isISO8601()
    .withMessage('Release date must be valid ISO8601 format'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom(arr => arr.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 20))
    .withMessage('Each tag must be a string between 1 and 20 characters'),

  validate
];

/**
 * UPDATE SONG VALIDATION
 */
const validateSongUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid song ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('album')
    .optional()
    .isMongoId()
    .withMessage('Album ID must be valid'),

  body('genre')
    .optional()
    .isIn(['pop', 'rock', 'jazz', 'classical', 'hip-hop', 'electronic', 'country', 'rnb', 'indie', 'metal', 'other'])
    .withMessage('Invalid genre'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  body('lyrics')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Lyrics must not exceed 5000 characters'),

  body('releaseDate')
    .optional()
    .isISO8601()
    .withMessage('Release date must be valid ISO8601 format'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom(arr => arr.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 20))
    .withMessage('Each tag must be a string between 1 and 20 characters'),

  // Prevent updating protected fields
  body()
    .custom(body => {
      const protectedFields = ['audioUrl', 'audioPublicId', 'playCount', 'likeCount', 'likedBy', 'shareCount', 'isPublished', 'publishedAt'];
      const requestKeys = Object.keys(body);
      const protectedAttempt = requestKeys.filter(key => protectedFields.includes(key));
      if (protectedAttempt.length > 0) {
        throw new Error(`Cannot update protected fields: ${protectedAttempt.join(', ')}`);
      }
      return true;
    }),

  validate
];

/**
 * SINGLE SONG GET VALIDATION
 */
const validateSongId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid song ID'),

  validate
];

/**
 * LIST/FILTER VALIDATION
 */
const validateSongFilters = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('genre')
    .optional()
    .isIn(['pop', 'rock', 'jazz', 'classical', 'hip-hop', 'electronic', 'country', 'rnb', 'indie', 'metal', 'other']),

  query('artist')
    .optional()
    .isMongoId()
    .withMessage('Artist ID must be valid'),

  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'trending', 'popular', 'random'])
    .withMessage('Invalid sort option'),

  validate
];

/**
 * SEARCH VALIDATION
 */
const validateSongSearch = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  validate
];

/**
 * TRENDING VALIDATION
 */
const validateTrendingParams = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  validate
];

/**
 * RECOMMENDATIONS VALIDATION
 */
const validateRecommendations = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  validate
];

module.exports = {
  validate,
  validateSongUpload,
  validateSongUpdate,
  validateSongId,
  validateSongFilters,
  validateSongSearch,
  validateTrendingParams,
  validateRecommendations
};
