# 🔧 Song Feature Integration Guide

## Current Status

The Song feature has been created with all necessary files:
- Model, Repository, Service, Controller, DTO, Validation, Routes, Index

However, the new feature-based routes need to be activated. You have two options:

## Option 1: Use New Feature-Based Routes (Recommended)

The new implementation in `backend/features/song/` is production-ready and follows Clean Architecture.

### Step 1: Update server.js

Replace this line (around line 289):
```javascript
app.use('/api/songs', require('./routes/songs'));
```

With this:
```javascript
// Use new feature-based Song routes
app.use('/api/songs', require('./features/song/routes'));
```

### Step 2: Ensure Dependencies are Installed

Make sure all required packages are in package.json:
```bash
npm install
```

### Step 3: Test the Routes

```bash
# Start the server
npm run dev

# Test a GET request
curl http://localhost:5000/api/songs

# Test with Postman or another API client
```

## Option 2: Parallel Development (During Transition)

Keep both routes active temporarily:

```javascript
// Old route
app.use('/api/songs/legacy', require('./routes/songs'));

// New route
app.use('/api/songs', require('./features/song/routes'));
```

Then gradually migrate endpoints and remove the old one.

## File Mapping

### What's New (Feature-Based - In `backend/features/song/`)
```
Song.js                    - Complete domain model with hooks
SongRepository.js          - 30+ data access methods
SongService.js             - Business logic with caching
SongController.js          - 14 HTTP endpoints
SongDTO.js                 - 4 response formats
validateSong.js            - Comprehensive validation
routes.js                  - All endpoint definitions
index.js                   - Barrel export
```

### What Exists (Old - In `backend/routes/`)
```
songs.js                   - Old endpoint definitions
```

## Key Differences

### Old Approach (In routes/)
- Routes and controller logic mixed
- Less separation of concerns
- Basic validation
- Limited caching

### New Approach (In features/song/)
- Clear layer separation (Model → Repo → Service → Controller → DTO)
- Comprehensive validation middleware
- Cache integration with pattern-based invalidation
- Socket.io real-time updates
- Proper error handling with custom error classes
- Authorization checks in Service
- Protected fields in DTOs

## API Endpoints (Same as Before)

All endpoints remain the same:

```http
GET    /api/songs                    → List all songs
GET    /api/songs/:id                → Get single song
GET    /api/songs/search/:q          → Search songs
GET    /api/songs/trending/weekly    → Trending songs
GET    /api/songs/stats/genres       → Genre statistics
GET    /api/songs/stats/artist/:id   → Artist statistics

POST   /api/songs                    → Upload new song
POST   /api/songs/:id/play           → Record play
POST   /api/songs/:id/like           → Like song
POST   /api/songs/:id/publish        → Publish song

DELETE /api/songs/:id                → Delete song
DELETE /api/songs/:id/like           → Unlike song

PATCH  /api/songs/:id                → Update song
```

## Configuration Required

The new routes expect these utilities to exist (they already do):

### Middleware
- `auth.js` - JWT authentication
- `cache.js` - Redis caching
- `upload.js` - File upload with Multer
- `errorHandler.js` - Global error handling

### Services
- `cacheService.js` - Cache abstraction
- `uploadService.js` - File upload abstraction

### Error Classes
- `AppError.js` - Base error class
- Custom error classes: ValidationError, NotFoundError, etc.

## Migration Steps

### Step 1: Backup Old Routes (Optional)
```bash
cp backend/routes/songs.js backend/routes/songs.js.backup
```

### Step 2: Update server.js
```javascript
// Around line 289
app.use('/api/songs', require('./features/song/routes'));
```

### Step 3: Test All Endpoints
```bash
# List
curl http://localhost:5000/api/songs

# Get by ID
curl http://localhost:5000/api/songs/[SONG_ID]

# Search
curl http://localhost:5000/api/songs/search/rock

# Trending
curl http://localhost:5000/api/songs/trending/weekly

# Create (requires auth)
curl -X POST http://localhost:5000/api/songs \
  -H "Authorization: Bearer [TOKEN]" \
  -F "audio=@song.mp3" \
  -F "title=Song Title" \
  -F "artist=[ARTIST_ID]" \
  -F "genre=pop"

# Like (requires auth)
curl -X POST http://localhost:5000/api/songs/[SONG_ID]/like \
  -H "Authorization: Bearer [TOKEN]"

# Publish (requires auth)
curl -X POST http://localhost:5000/api/songs/[SONG_ID]/publish \
  -H "Authorization: Bearer [TOKEN]"
```

### Step 4: Verify Cache Works
```bash
# Check Redis
redis-cli

# View keys
> KEYS *

# Check if songs are cached
> GET song:123
```

### Step 5: Test Socket.io Events
Open the Socket.io test page and verify:
- Play events broadcast
- Like notifications send
- Publish updates broadcast

### Step 6: Monitor Logs
```bash
# Watch logs for any errors
npm run logs

# Or check console for [ERROR] messages
```

## Troubleshooting

### Error: "Cannot find module './features/song/routes'"

**Solution:** Make sure the file exists:
```bash
ls -la backend/features/song/routes.js
```

If missing, the routes file was created but check the path.

### Error: "ValidationError: Title is required"

**Solution:** Make sure you're sending the required fields:
```bash
curl -X POST http://localhost:5000/api/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "title": "Song Title",
    "artist": "5f8d1c4b3c9e1a2b3c4d5e6f",
    "genre": "pop"
  }'
```

### Error: "Cache service not available"

**Solution:** Ensure Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Error: "FileValidation: Invalid file type"

**Solution:** Make sure you're uploading an audio file:
```bash
# Valid formats: mp3, wav, flac, ogg
curl -X POST http://localhost:5000/api/songs \
  -H "Authorization: Bearer [TOKEN]" \
  -F "audio=@my-song.mp3" \
  -F "title=Song Title" \
  -F "artist=[ARTIST_ID]" \
  -F "genre=pop"
```

## Performance Tuning

### Enable Cache
Cache is automatically enabled with these TTLs:
```javascript
songs:list          → 5 minutes
songs:search:[q]    → 5 minutes
songs:trending      → 1 hour
song:[id]           → 10 minutes
stats:genres        → 1 day
stats:artist:[id]   → 1 hour
recommendations:[u] → 1 hour
```

### Monitor Cache Hit Rate
```javascript
// In your code
const cacheStats = cacheService.getStats();
console.log(cacheStats);
// { hits: 234, misses: 45, hitRate: '83.87%' }
```

### Optimize Database Queries
Indexes are automatically created:
- Text search on title, description, tags
- Compound index on artist + isPublished
- Index on playCount for trending
- Index on createdAt for chronological queries

## Next Steps

After successful integration:

1. **Test Thoroughly** - Run full test suite
2. **Load Test** - Use Apache Bench or Artillery
3. **Monitor Performance** - Watch cache hit rates, query times
4. **Implement User Feature** - Follow same Song pattern
5. **Implement Artist Feature** - Follow same Song pattern
6. **Deploy to Production** - Follow deployment checklist

## Feature Completeness Check

Before going live, verify all features:

- [x] List songs (with filtering and pagination)
- [x] Get single song (with caching)
- [x] Search songs (full-text search)
- [x] Get trending songs (by time period)
- [x] Upload song (with metadata and file validation)
- [x] Play song (with Socket.io broadcast)
- [x] Like song (with notification)
- [x] Unlike song
- [x] Update song (owner only)
- [x] Delete song (owner only, with cascade)
- [x] Publish song (make discoverable)
- [x] Get statistics (by genre and artist)
- [x] Get recommendations (personalized)

## Rollback Plan

If something goes wrong:

```javascript
// Temporarily switch back to old routes
app.use('/api/songs', require('./routes/songs'));

// Or disable new routes
// app.use('/api/songs', require('./features/song/routes'));
```

Then:
1. Check logs for errors
2. Fix issues in feature files
3. Test again
4. Re-enable

## Support Resources

| Issue | Resource |
|-------|----------|
| How do the endpoints work? | [README-BACKEND.md](../README-BACKEND.md) - API Examples |
| How is the code structured? | [CLEAN-ARCHITECTURE.md](../docs/CLEAN-ARCHITECTURE.md) |
| How do I debug? | [QUICK-REFERENCE.md](../backend/QUICK-REFERENCE.md) |
| What patterns to follow? | [CLEAN-ARCHITECTURE-IMPLEMENTATION.md](../backend/CLEAN-ARCHITECTURE-IMPLEMENTATION.md) |

## Summary

✅ **Song feature is fully implemented and ready to integrate**

Simply update one line in `server.js` to:
```javascript
app.use('/api/songs', require('./features/song/routes'));
```

Then test thoroughly. All other features follow the same pattern!

---

**Estimated Integration Time:** 15 minutes  
**Estimated Testing Time:** 1 hour  
**Risk Level:** Low (backward compatible endpoints)  
**Rollback Time:** 1 minute
