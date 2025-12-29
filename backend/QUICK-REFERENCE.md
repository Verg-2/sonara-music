# 🚀 Developer Quick Reference Guide

## Clean Architecture at a Glance

### The Golden Rule
**Dependencies flow INWARD only** - Outer layers depend on inner layers, never the reverse.

```
Routes → Controllers → Services → Repositories → Models → Database
                                         ↑
                                    [NO UPWARD FLOW]
```

### Layer Responsibilities (TL;DR)

| Layer | What | What NOT |
|-------|------|----------|
| **Routes** | URL paths, HTTP methods | Auth, validation, logging |
| **Controllers** | Parse requests, call services, format responses | Database queries, business logic |
| **Services** | Business logic, validation, caching, notifications | HTTP stuff, database queries |
| **Repositories** | Database queries only | Business logic, HTTP stuff |
| **Models** | Schema definition, hooks, computed fields | Anything else |
| **DTOs** | Format response data, hide sensitive fields | Calculation, logic |
| **Middleware** | Cross-cutting concerns (auth, validation, cache) | Feature-specific logic |

## Common Patterns

### Create a New Feature (Step-by-Step)

```bash
# 1. Create directory structure
mkdir -p backend/features/featureName/{models,repositories,services,controllers,dtos,middleware}

# 2. Use Song feature as template
cp backend/features/song/models/Song.js backend/features/featureName/models/FeatureName.js
# ... repeat for all layers

# 3. Update class names and field names

# 4. Register routes in server.js
const featureRoutes = require('./features/featureName/routes');
app.use('/api/featureName', featureRoutes);

# 5. Test it
npm test
```

### Error Handling Pattern

```javascript
// Service layer - throw errors
async createSong(data, userId) {
  if (!data.title) {
    throw new ValidationError('Title required');
  }
  
  const existing = await this.repository.findByTitle(data.title);
  if (existing) {
    throw new ConflictError('Song with this title already exists');
  }
  
  return await this.repository.create({...data, uploadedBy: userId});
}

// Controller layer - catch and delegate
async uploadSong(req, res, next) {
  try {
    const song = await this.service.createSong(req.body, req.user.id);
    res.status(201).json({ success: true, data: song });
  } catch (error) {
    next(error); // Middleware handles it
  }
}

// Global middleware handles all errors
app.use(errorHandler);
```

### Cache Pattern

```javascript
// Service layer
async getSong(id) {
  // Check cache first
  let song = await this.cache.get(`song:${id}`);
  
  // If not cached, query database
  if (!song) {
    song = await this.repository.findById(id);
    if (!song) throw new NotFoundError('Song');
    
    // Cache it
    await this.cache.set(`song:${id}`, song, 3600);
  }
  
  return song;
}

// When updating, invalidate cache
async updateSong(id, data, userId) {
  const song = await this.repository.findById(id);
  if (song.uploadedBy.toString() !== userId) {
    throw new UnauthorizedError();
  }
  
  const updated = await this.repository.update(id, data);
  
  // Clear cache
  await this.cache.invalidatePattern(`song:${id}*`);
  
  return updated;
}
```

### Validation Pattern

```javascript
// Middleware file: middleware/validateSong.js
const validateSongUpload = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title required')
    .isLength({ min: 3, max: 100 }).withMessage('Title 3-100 chars'),
  
  body('genre')
    .isIn(['pop', 'rock', 'jazz', ...])
    .withMessage('Invalid genre'),
  
  // Error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors.array()));
    }
    next();
  }
];

module.exports = { validateSongUpload };

// Routes file
router.post(
  '/',
  protect,                    // Auth middleware
  validate(validateSongUpload), // Validation middleware
  SongController.uploadSong   // Handler
);
```

### DTO Pattern

```javascript
// dtos/SongDTO.js
class SongDTO {
  // For list views - minimal fields
  static toListResponse(song) {
    return {
      id: song._id,
      title: song.title,
      artist: song.artist?.name,
      genre: song.genre,
      duration: song.duration,
      playCount: song.playCount,
      likeCount: song.likeCount
      // No sensitive fields like audioPublicId, etc.
    };
  }

  // For detail views - full fields
  static toDetailedResponse(song) {
    return {
      ...this.toListResponse(song),
      description: song.description,
      lyrics: song.lyrics,
      audioUrl: song.audioUrl,
      isPublished: song.isPublished,
      tags: song.tags
    };
  }

  // Only show published songs publicly
  static toPublicResponse(song) {
    if (!song.isPublished) return null;
    return this.toDetailedResponse(song);
  }

  // Batch processing
  static toListBatch(songs, detailed = false) {
    return songs
      .map(song => detailed ? this.toDetailedResponse(song) : this.toListResponse(song))
      .filter(song => song !== null);
  }
}

module.exports = SongDTO;

// Usage in controller
async listSongs(req, res, next) {
  try {
    const songs = await this.service.listSongs(req.query);
    res.json({
      success: true,
      data: SongDTO.toListBatch(songs)
    });
  } catch (error) {
    next(error);
  }
}
```

### Repository Pattern

```javascript
// repository.js - Single Responsibility
class SongRepository {
  async create(data) {
    const song = new Song(data);
    return await song.save();
  }

  async findById(id) {
    return await Song.findById(id).lean(); // lean() for read-only
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;
    
    return await Song
      .find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async update(id, data) {
    // Protect sensitive fields
    const forbidden = ['audioUrl', 'playCount', 'likeCount'];
    forbidden.forEach(field => delete data[field]);
    
    return await Song.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Song.findByIdAndDelete(id);
  }

  // Helper method for reusable query logic
  _buildQuery(filters) {
    let query = Song.find();
    
    if (filters.genre) query = query.where('genre', filters.genre);
    if (filters.artist) query = query.where('artist', filters.artist);
    if (filters.published) query = query.where('isPublished', true);
    
    return query;
  }
}

module.exports = new SongRepository();
```

### Socket.io Pattern

```javascript
// Service emits events
async playSong(songId, userId) {
  const result = await this.repository.incrementPlayCount(songId);
  
  // Broadcast to all connected users
  this.io.emit('song:played', {
    songId,
    playCount: result.playCount,
    timestamp: new Date()
  });
  
  return result;
}

async likeSong(songId, userId) {
  const result = await this.repository.addLike(songId, userId);
  
  // Notify the song owner
  this.io.to(`user:${result.uploadedBy}`).emit('song:liked', {
    songId,
    userName: userId,
    likeCount: result.likeCount
  });
  
  return result;
}
```

## Testing Patterns

### Service Testing
```javascript
describe('SongService', () => {
  let service;
  let mockRepository;
  let mockCache;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      invalidatePattern: jest.fn()
    };

    service = new SongService(mockRepository, mockCache);
  });

  test('should create song with validation', async () => {
    const data = { title: 'Test', artist: '123' };
    mockRepository.create.mockResolvedValue({ _id: 'song123', ...data });

    const result = await service.createSong(data, 'user123');

    expect(mockRepository.create).toHaveBeenCalled();
    expect(result._id).toBe('song123');
  });

  test('should throw on missing title', async () => {
    await expect(
      service.createSong({}, 'user123')
    ).rejects.toThrow('Title required');
  });

  test('should use cache for reads', async () => {
    mockCache.get.mockResolvedValue({ _id: 'song123', title: 'Cached' });

    const result = await service.getSong('song123');

    expect(mockCache.get).toHaveBeenCalledWith('song:song123');
    expect(mockRepository.findById).not.toHaveBeenCalled();
    expect(result.title).toBe('Cached');
  });
});
```

## Performance Tips

### Database
```javascript
// ✅ Good - lean() for read-only queries
const songs = await Song.find().lean();

// ✅ Good - selective population
const song = await Song.findById(id).populate('artist', 'name avatar');

// ✅ Good - pagination
const songs = await Song.find().limit(20).skip((page - 1) * 20);

// ❌ Bad - full population of everything
const songs = await Song.find().populate('*');

// ❌ Bad - no pagination
const songs = await Song.find();
```

### Caching
```javascript
// ✅ Good - cache with appropriate TTL
await cache.set('song:123', song, 3600); // 1 hour

// ✅ Good - pattern-based invalidation
await cache.invalidatePattern('songs:*');

// ❌ Bad - no caching
const song = await repository.findById(id); // Every time from DB

// ❌ Bad - excessive cache usage
await cache.set('temp:data', value, 1); // Too short TTL
```

### Queries
```javascript
// ✅ Good - indexed field
Song.find({ genre: 'pop' });  // With index on genre

// ❌ Bad - non-indexed field in filter
Song.find({ randomField: 'value' }); // No index = slow

// ✅ Good - compound query
Song.find({ artist: '123', isPublished: true });

// ❌ Bad - inefficient aggregation
Song.find().then(songs => songs.filter(s => s.playCount > 1000));
```

## Common Mistakes & Fixes

### ❌ Business Logic in Controller
```javascript
// WRONG
async uploadSong(req, res) {
  const song = new Song(req.body);
  if (req.body.title.length < 3) {
    res.status(400).json({ error: 'Title too short' });
    return;
  }
  await song.save();
  res.json(song);
}

// RIGHT
async uploadSong(req, res, next) {
  try {
    const song = await this.service.uploadSong(req.body);
    res.status(201).json({ data: SongDTO.toDetailedResponse(song) });
  } catch (error) {
    next(error);
  }
}
```

### ❌ Database Queries in Service
```javascript
// WRONG
async getSong(id) {
  return await Song.findById(id); // Direct DB access
}

// RIGHT
async getSong(id) {
  let song = await this.cache.get(`song:${id}`);
  if (!song) {
    song = await this.repository.findById(id);
    await this.cache.set(`song:${id}`, song);
  }
  return song;
}
```

### ❌ Sensitive Data in Responses
```javascript
// WRONG
res.json(song); // Exposes all fields including passwords, IDs, etc.

// RIGHT
res.json(SongDTO.toDetailedResponse(song)); // Only safe fields
```

### ❌ No Error Handling
```javascript
// WRONG
async uploadSong(req, res) {
  const song = await this.service.uploadSong(req.body);
  res.json(song);
}

// RIGHT
async uploadSong(req, res, next) {
  try {
    const song = await this.service.uploadSong(req.body);
    res.json(song);
  } catch (error) {
    next(error); // Global handler manages it
  }
}
```

## Debugging Tips

### Enable Detailed Logging
```bash
DEBUG=music:* npm run dev
```

### Check Cache Status
```bash
redis-cli
> KEYS *
> GET song:123
> FLUSHDB  # Clear all cache
```

### Monitor Database
```bash
# MongoDB shell
mongo
> use music-platform
> db.songs.find({})
> db.songs.explain('executionStats').find({genre: 'pop'})
```

### Check Socket.io Connections
```javascript
const io = require('./config/socket');

io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });
  logger.info('Total connections', { count: io.engine.clientsCount });
});
```

## Performance Monitoring

### Add Timing Middleware
```javascript
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        status: res.statusCode
      });
    }
  });
  
  next();
});
```

### Monitor Cache Hit Rates
```javascript
class CacheService {
  constructor() {
    this.hits = 0;
    this.misses = 0;
  }

  async get(key) {
    const value = await redis.get(key);
    if (value) {
      this.hits++;
    } else {
      this.misses++;
    }
    return value ? JSON.parse(value) : null;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total ? (this.hits / total * 100).toFixed(2) : 0;
    return { hits: this.hits, misses: this.misses, hitRate: `${hitRate}%` };
  }
}
```

## Useful Commands

```bash
# Development
npm run dev              # Start with nodemon
npm test                # Run tests
npm run test:coverage   # Coverage report

# Database
npm run db:seed         # Seed test data
npm run db:migrate      # Run migrations
npm run db:backup       # Backup database

# Deployment
npm run build           # Build for production
npm start              # Start production server
npm run docker:up      # Docker Compose up

# Debugging
npm run debug          # Start with debugger
npm run logs           # View application logs
npm run health         # Health check
```

## File Naming Convention

```
Feature: song

✅ Correct:
- models/Song.js
- repositories/SongRepository.js
- services/SongService.js
- controllers/SongController.js
- dtos/SongDTO.js
- middleware/validateSong.js
- routes.js
- index.js

❌ Incorrect:
- models/song-model.js
- repositories/song-repo.js
- controllers/SongControllers.js (plural)
- services/songServiceFile.js
```

## Quick Reference - HTTP Methods

```
GET    /api/songs              → List all (with filters/pagination)
POST   /api/songs              → Create new
GET    /api/songs/:id          → Get single
PATCH  /api/songs/:id          → Update
DELETE /api/songs/:id          → Delete

GET    /api/songs/search?q=... → Search
GET    /api/songs/trending     → Get trending
POST   /api/songs/:id/play     → Record play
POST   /api/songs/:id/like     → Like song
DELETE /api/songs/:id/like     → Unlike song
```

## Status Codes

```
200  OK (successful GET, PATCH)
201  Created (successful POST)
204  No Content (successful DELETE)
400  Bad Request (validation error)
401  Unauthorized (auth required)
403  Forbidden (permission denied)
404  Not Found (resource doesn't exist)
409  Conflict (resource already exists)
500  Server Error
```

---

**Master these patterns and you can build any feature! 🚀**
