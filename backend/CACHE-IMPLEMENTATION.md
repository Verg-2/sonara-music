# Redis Cache Implementation - Dökümantasyon

## 📋 Dosya Yapısı

```
backend/
├── services/
│   ├── redisClient.js          # Redis bağlantısı ve temel operasyonlar
│   └── cacheService.js         # Cache işlemleri (getOrSet, invalidate vb.)
├── middleware/
│   └── cache.js                # Cache middleware ve invalidation
├── utils/
│   └── logger.js               # Logging utility
├── controllers/
│   ├── artistController-cache.js      # Artist controller + cache
│   └── songController-cache.js        # Song controller + cache örnekleri
├── routes/
│   └── artists-cache.js        # Artists route + cache middleware
└── package.json                # redis paketi eklendi
```

## 🚀 Kurulum Adımları

### 1. Redis Paketini İndir
```bash
cd backend
npm install redis@4.6.13
```

### 2. Environment Değişkenlerini Ayarla (.env)
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=            # Opsiyonel (production'da şifre kullan)

# Debug mode (loglama)
DEBUG=true
```

### 3. Redis Server'ı Başlat
```bash
# Windows (Redis yüklü ise)
redis-server

# Veya Docker ile
docker run -d -p 6379:6379 redis:latest

# macOS (Homebrew)
brew services start redis
```

### 4. Server'ı Başlat
```bash
npm run dev
```

## 💡 Cache Stratejisi & TTL Değerleri

| Endpoint | Cache Key | TTL | Açıklama |
|----------|-----------|-----|----------|
| GET /artists | `artists:all` | 3600s (1h) | Statik, sık değişmez |
| GET /artists/:id | `artist:${id}` | 3600s (1h) | Belirli artist |
| GET /songs | `songs:all` | 600s (10m) | Daha dinamik |
| GET /songs/popular | `songs:popular` | 300s (5m) | Playcount sürekli değişiyor |
| GET /songs/search | `songs:search:${query}` | 300s (5m) | Arama sonuçları dinamik |

## 🔧 Kullanım Örnekleri

### Örnek 1: Cache Service Kullanarak Veri Getirme
```javascript
const cacheService = require('../services/cacheService');

// Controller'da
const result = await cacheService.getOrSet(
  'artists:category:odaklanma',
  async () => {
    // Database query
    return await Artist.find({ category: 'odaklanma' });
  },
  3600 // TTL: 1 saat
);
```

### Örnek 2: Cache Middleware ile Route Koruma
```javascript
const { cacheMiddleware } = require('../middleware/cache');

// route tanımlama
router.get(
  '/',
  cacheMiddleware('artists:all', 3600), // GET'lerde cache
  getArtists
);
```

### Örnek 3: Veri Güncellendiğinde Cache Temizleme
```javascript
const { invalidateCache } = require('../middleware/cache');

router.put(
  '/:id',
  invalidateCache('artists:*', 'artist:*'), // PUT sonrası cache sil
  updateArtist
);
```

### Örnek 4: Manuel Cache Temizleme
```javascript
const cacheService = require('../services/cacheService');

// Belirli key'i sil
await cacheService.invalidate('artist:123');

// Pattern'a uyan tüm key'leri sil
await cacheService.invalidatePattern('artists:*');

// Tüm cache'i temizle (DİKKAT: production'da kullanmayın!)
await cacheService.flushAll();
```

## 📊 Cache Hit/Miss Tracking

### Response Headers
- **X-Cache: HIT** → Veri Redis'ten döndürüldü
- **X-Cache: MISS** → Veri database'den alındı ve cache'e yazıldı

### Konsol Logs
```
✅ Cache HIT: artists:all
📥 Cache MISS: artists:all - Veritabanından çekiliyor...
💾 Cache SAVED: artists:all (TTL: 3600s)
🗑️ Cache INVALIDATED: artist:123
```

## 🔍 Cache İstatistikleri

### Cache durumunu kontrol etme
```javascript
const stats = await cacheService.getStats();
console.log(stats);
// { totalKeys: 45, info: '...' }
```

## 🛡️ Hata Yönetimi

Cache işlemleri başarısız olsa bile:
1. **GET işlemleri** → Database'den veri döndürülür
2. **SET işlemleri** → Sadece log kaydı yapılır, hata throw'lanmaz
3. **Invalidation** → Redis bağlantısı kopsa bile server çalışmaya devam eder

## 📝 Best Practices

✅ **Yapılması gerekenler:**
- Sık sorgulanacak endpoint'lerde cache kullan
- Veri güncellemesinde cache'i temizle
- TTL değerlerini veri değişim hızına göre ayarla
- Cache'de JSON stringi sakla
- Error handling'i düzgün yap

❌ **Yapılmaması gerekenler:**
- Production'da `flushAll()` kullanmayın
- Cache'de şifreli veriyi plain text saklamayın
- Çok uzun TTL değerleri kullanmayın (stale data)
- Pattern'lı silme işlemlerini sık yapmayın (performance)

## 🚨 Sorun Giderme

### Redis bağlantısı başarısız
```
❌ Redis bağlantı hatası: ECONNREFUSED
→ Çözüm: Redis server'ını başlat
```

### Cache temizlenmiyor
```javascript
// Tüm pattern'ları kontrol et
const keys = await redis.keys('*');
console.log(keys); // Tüm cache key'lerini göster
```

### TTL sorunu
```javascript
// Belirli key'in TTL'sini kontrol et
const ttl = await redis.ttl('artist:123');
console.log(ttl); // -1: key yok, -2: TTL yok
```

## 🔄 Next Steps

1. **Diğer controller'ları cache ile entegre et:**
   - playlistController
   - userController
   - searchController

2. **Advanced caching strategies:**
   - Cache warming (uygulama başlayınca popüler verileri cache'e yükle)
   - TTL refresh (her erişimde TTL'yi uzat)
   - Distributed caching (birden fazla server)

3. **Monitoring:**
   - Redis memory usage
   - Cache hit rate
   - Slow queries

## 📚 Referanslar

- Redis Documentation: https://redis.io/docs/
- Node Redis: https://github.com/redis/node-redis
- Cache Patterns: https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside
