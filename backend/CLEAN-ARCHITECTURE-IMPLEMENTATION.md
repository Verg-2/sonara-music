# 🏗️ Clean Architecture Implementation Guide

## Project Structure Overview

```
backend/
├── config/                      # Configuration files
│   ├── db.js                   # MongoDB connection
│   ├── cloudinary.js           # Cloudinary setup
│   └── socket.js               # Socket.io configuration
│
├── shared/                      # Shared across features
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── cache.js           # Cache middleware
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── validation.js      # Input validation
│   │   ├── fileValidation.js  # File upload validation
│   │   └── upload.js          # File upload handler (multer)
│   │
│   ├── errors/                # Error classes
│   │   ├── AppError.js        # Base error class
│   │   └── errorCodes.js      # Error code constants
│   │
│   ├── utils/
│   │   ├── logger.js          # Logging utility
│   │   ├── tokenUtils.js      # JWT helpers
│   │   └── fileHelper.js      # File operations
│   │
│   └── constants/
│       ├── genres.js          # Genre enums
│       ├── roles.js           # User roles
│       └── httpStatus.js      # HTTP status codes
│
├── features/                   # Feature modules (by domain)
│   ├── song/                  # Song feature
│   │   ├── models/
│   │   │   └── Song.js       # Domain entity
│   │   │
│   │   ├── repositories/
│   │   │   └── SongRepository.js    # Data access layer
│   │   │
│   │   ├── services/
│   │   │   └── SongService.js       # Business logic
│   │   │
│   │   ├── controllers/
│   │   │   └── SongController.js    # HTTP handlers
│   │   │
│   │   ├── dtos/
│   │   │   └── SongDTO.js          # Response formatting
│   │   │
│   │   ├── middleware/
│   │   │   └── validateSong.js     # Input validation rules
│   │   │
│   │   ├── routes.js               # Endpoint definitions
│   │   └── index.js                # Barrel export
│   │
│   ├── user/                  # User feature
│   │   ├── models/User.js
│   │   ├── repositories/UserRepository.js
│   │   ├── services/UserService.js
│   │   ├── controllers/UserController.js
│   │   ├── dtos/UserDTO.js
│   │   ├── middleware/validateUser.js
│   │   └── routes.js
│   │
│   ├── artist/                # Artist feature
│   ├── playlist/              # Playlist feature
│   └── auth/                  # Authentication feature
│
├── services/                  # Cross-feature services
│   ├── cacheService.js       # Cache abstraction
│   ├── uploadService.js      # File upload abstraction
│   ├── searchService.js      # Search abstraction
│   └── notificationService.js # Notification abstraction
│
├── routes/                    # Main route aggregation
│   └── index.js              # Mount all feature routes
│
├── server.js                 # Application entry point
└── package.json             # Dependencies
```

## Key Architectural Principles

### 1. Dependency Flow (One Direction)

```
Routes → Controllers → Services → Repositories → Models → Database
   ↑                      ↑            ↑
   └── Auth Middleware ───┴─── Cache Middleware
```

**Rules:**
- Inner layers (Models, Repositories) don't know about outer layers
- Controllers don't have business logic
- Services don't know about HTTP/Express
- Repositories abstract all database queries

### 2. Layer Responsibilities

#### Models (Domain Entity Layer)
- Define schema structure
- Implement domain-specific methods
- Add validation hooks
- Create indexes for performance
- Enforce constraints at DB level
- Include virtuals for computed fields

#### Repositories (Data Access Layer)
- CRUD operations abstraction
- Query building
- Error handling for DB operations
- No business logic
- Reusable query methods
- Consistency across operations

#### Services (Business Logic Layer)
- Validate input
- Implement business rules
- Orchestrate complex operations
- Manage caching
- Call external services
- Emit events/notifications
- No HTTP concerns

#### Controllers (Request Handler Layer)
- Parse HTTP requests
- Extract parameters
- Call services
- Format responses
- Set status codes
- Delegate errors to middleware
- No database access

#### DTOs (Data Transfer Object)
- Format response data
- Protect sensitive fields
- Support multiple response formats
- Normalize data structure
- No logic, pure transformation

#### Middleware (Cross-Cutting Concerns)
- Authentication
- Authorization
- Input validation
- Caching
- Logging
- Error handling
- Rate limiting

## Implementation Pattern for New Features

### 1. Create Feature Directory
```bash
mkdir -p backend/features/artist/{models,repositories,services,controllers,dtos,middleware}
```

### 2. Create Model
```javascript
// features/artist/models/Artist.js
const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// Indexes
artistSchema.index({ userId: 1 });

// Methods
artistSchema.methods.addFollower = async function(userId) {
  if (!this.followers.includes(userId)) {
    this.followers.push(userId);
    await this.save();
  }
};

module.exports = mongoose.model('Artist', artistSchema);
```

### 3. Create Repository
```javascript
// features/artist/repositories/ArtistRepository.js
class ArtistRepository {
  async create(artistData) {
    const artist = new Artist(artistData);
    return await artist.save();
  }

  async findById(id) {
    return await Artist.findById(id).populate('userId');
  }

  async addFollower(artistId, userId) {
    return await Artist.findByIdAndUpdate(
      artistId,
      { $addToSet: { followers: userId } },
      { new: true }
    );
  }

  // More methods...
}

module.exports = new ArtistRepository();
```

### 4. Create Service
```javascript
// features/artist/services/ArtistService.js
class ArtistService {
  constructor(repository, cache) {
    this.repository = repository;
    this.cache = cache;
  }

  async createArtist(userId, data) {
    // Validation
    if (!userId) throw new ValidationError('User ID required');

    // Check existing
    const existing = await this.repository.findByUserId(userId);
    if (existing) throw new ConflictError('Artist profile already exists');

    // Create
    const artist = await this.repository.create({ userId, ...data });

    // Cache
    await this.cache.set(`artist:${artist._id}`, artist, 3600);

    return artist;
  }

  async getArtist(id) {
    // Cache-first pattern
    let artist = await this.cache.get(`artist:${id}`);
    if (!artist) {
      artist = await this.repository.findById(id);
      if (!artist) throw new NotFoundError('Artist not found');
      await this.cache.set(`artist:${id}`, artist, 3600);
    }
    return artist;
  }

  // More methods...
}

module.exports = ArtistService;
```

### 5. Create Controller
```javascript
// features/artist/controllers/ArtistController.js
class ArtistController {
  constructor(service) {
    this.service = service;
  }

  async createArtist(req, res, next) {
    try {
      const { bio } = req.body;
      const artist = await this.service.createArtist(req.user.id, { bio });
      
      res.status(201).json({
        success: true,
        data: ArtistDTO.toDetailedResponse(artist)
      });
    } catch (error) {
      next(error);
    }
  }

  async getArtist(req, res, next) {
    try {
      const artist = await this.service.getArtist(req.params.id);
      
      res.status(200).json({
        success: true,
        data: ArtistDTO.toPublicResponse(artist)
      });
    } catch (error) {
      next(error);
    }
  }

  // More handlers...
}

module.exports = ArtistController;
```

### 6. Create DTO
```javascript
// features/artist/dtos/ArtistDTO.js
class ArtistDTO {
  static toPublicResponse(artist) {
    return {
      id: artist._id,
      name: artist.userId?.name,
      bio: artist.bio,
      followers: artist.followers.length,
      avatar: artist.userId?.avatar
    };
  }

  static toDetailedResponse(artist) {
    return {
      ...this.toPublicResponse(artist),
      following: artist.following.length,
      createdAt: artist.createdAt
    };
  }
}

module.exports = ArtistDTO;
```

### 7. Create Validation Middleware
```javascript
// features/artist/middleware/validateArtist.js
const { body, validationResult } = require('express-validator');

const validateArtistCreation = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }
    next();
  }
];

module.exports = { validateArtistCreation };
```

### 8. Create Routes
```javascript
// features/artist/routes.js
const express = require('express');
const ArtistController = require('./controllers/ArtistController');
const { protect } = require('../../shared/middleware/auth');
const { validateArtistCreation } = require('./middleware/validateArtist');
const { cacheMiddleware, invalidateCache } = require('../../shared/middleware/cache');

const router = express.Router();

router.post(
  '/',
  protect,
  validateArtistCreation,
  invalidateCache('artists:*'),
  ArtistController.createArtist
);

router.get(
  '/:id',
  cacheMiddleware('artist', 3600),
  ArtistController.getArtist
);

// More routes...

module.exports = router;
```

## Error Handling Pattern

### Custom Error Classes
```javascript
// shared/errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super('Validation failed', 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = { AppError, ValidationError, NotFoundError, UnauthorizedError, ConflictError };
```

### Error Handler Middleware
```javascript
// shared/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(`[${code}] ${message}`, {
    url: req.originalUrl,
    method: req.method,
    statusCode,
    details: err.details
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(err.details && { details: err.details })
    }
  });
};

module.exports = errorHandler;
```

## Caching Strategy

### Cache Keys Pattern
```javascript
// Cache keys should be hierarchical
'artist:123'                    // Single artist
'artists:list:page:1'          // List pagination
'artists:search:rock'          // Search results
'artist:123:songs'             // Related data
'stats:artist:123'             // Aggregated data

// Invalidation pattern
await cache.invalidatePattern('artist:123:*');  // Invalidate all keys for artist
await cache.invalidatePattern('artists:*');     // Invalidate all artists
```

### Cache Middleware Usage
```javascript
router.get(
  '/:id',
  cacheMiddleware('artist', 3600),  // Cache for 1 hour
  ArtistController.getArtist
);

router.post(
  '/:id/follow',
  protect,
  invalidateCache('artist:*'),  // Clear all artist caches
  ArtistController.followArtist
);
```

## Testing Pattern

### Service Testing
```javascript
// features/artist/services/ArtistService.test.js
describe('ArtistService', () => {
  let service;
  let mockRepository;
  let mockCache;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn()
    };
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidatePattern: jest.fn()
    };

    service = new ArtistService(mockRepository, mockCache);
  });

  describe('createArtist', () => {
    it('should create artist and cache it', async () => {
      const mockArtist = { _id: '123', userId: 'user123', bio: 'Test' };
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockArtist);

      const result = await service.createArtist('user123', { bio: 'Test' });

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user123',
        bio: 'Test'
      });
      expect(mockCache.set).toHaveBeenCalledWith(
        'artist:123',
        mockArtist,
        3600
      );
      expect(result).toEqual(mockArtist);
    });
  });
});
```

## Security Best Practices

### 1. Input Validation
- Validate all inputs in middleware
- Sanitize string inputs
- Check file types and sizes
- Use Mongoose schema validation

### 2. Authorization
- Check user permissions before operations
- Implement role-based access control
- Validate ownership of resources
- Use middleware for route protection

### 3. Data Protection
- Hash passwords (bcrypt)
- Use JWT for authentication
- Protect sensitive fields in responses (DTOs)
- Implement rate limiting
- Use HTTPS in production

### 4. File Security
- Validate file types
- Limit file sizes
- Scan for malware
- Store files in cloud (Cloudinary)
- Generate access tokens with expiration

## Performance Best Practices

### 1. Database Optimization
- Create indexes for frequently queried fields
- Use lean() for read-only queries
- Implement pagination
- Use aggregation for complex queries
- Monitor slow queries

### 2. Caching Strategy
- Cache frequently accessed data
- Set appropriate TTLs
- Invalidate on data changes
- Use pattern-based invalidation
- Monitor cache hit rates

### 3. API Optimization
- Compress responses (gzip)
- Implement rate limiting
- Use pagination for large datasets
- Return only needed fields (DTOs)
- Monitor response times

## Development Workflow

### 1. Create New Feature
```bash
# Create directories
mkdir -p backend/features/playlist/{models,repositories,services,controllers,dtos,middleware}

# Create files following the pattern above
```

### 2. Register Routes
```javascript
// server.js
const playlistRoutes = require('./features/playlist/routes');
app.use('/api/playlists', playlistRoutes);
```

### 3. Test Feature
```bash
npm test -- --testPathPattern=playlist
```

### 4. Deploy
```bash
npm run build
npm start
```

## Common Patterns

### Pagination
```javascript
async listArtists(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const total = await Artist.countDocuments();
  const items = await Artist.find()
    .skip(skip)
    .limit(limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

### Soft Delete
```javascript
// Add deletedAt field to schema
schema.add({ deletedAt: Date });

// Soft delete
async delete(id) {
  return await Artist.findByIdAndUpdate(id, { deletedAt: new Date() });
}

// Exclude soft deleted in queries
schema.pre('find', function() {
  this.where({ deletedAt: null });
});
```

### Timestamps
```javascript
// Automatically added by timestamps: true in schema
const schema = new Schema({...}, { timestamps: true });

// Provides createdAt and updatedAt fields
```

---

## Summary

This Clean Architecture pattern ensures:
- ✅ Separation of concerns
- ✅ Testability
- ✅ Maintainability
- ✅ Scalability
- ✅ Reusability
- ✅ Clear dependencies
- ✅ Error handling consistency
- ✅ Security enforcement
- ✅ Performance optimization
- ✅ Code organization

Each new feature follows the same pattern, making the codebase predictable and easy to navigate.
