/**
 * Artist Controller - Cache ile optimize edilmiş
 * CacheService aracılığıyla veri alır
 */

const Artist = require('../models/Artist');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

// In-memory data fallback
let artistsData = [
  { _id: '1', name: 'Şiire Gazele', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EŞG%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
  { _id: '2', name: 'Baytar', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EBY%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
];

/**
 * GET /api/artists
 * Tüm artist'leri category ile filtreleyerek getir (CACHE: 1 saat)
 */
exports.getArtists = async (req, res, next) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;

    // Cache key oluştur
    const cacheKey = category 
      ? `artists:category:${category}:${page}:${limit}`
      : `artists:all:${page}:${limit}`;

    // Cache Service kullanarak veriyi al
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Database query
        if (Artist.db && Artist.db.readyState === 1) {
          const query = category ? { category } : {};
          const artists = await Artist.find(query)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort('-createdAt');

          const total = await Artist.countDocuments(query);

          return {
            success: true,
            count: artists.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: artists,
          };
        }

        // Fallback: In-memory data
        const filtered = category 
          ? artistsData.filter(a => a.category === category)
          : artistsData;

        return {
          success: true,
          count: filtered.length,
          data: filtered,
        };
      },
      3600 // TTL: 1 saat
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('Artist getArtists hatası:', error.message);
    next(error);
  }
};

/**
 * GET /api/artists/:id
 * Belirli artist'i getir (CACHE: 1 saat)
 */
exports.getArtistById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `artist:${id}`;

    const artist = await cacheService.getOrSet(
      cacheKey,
      async () => {
        if (Artist.db && Artist.db.readyState === 1) {
          return await Artist.findById(id);
        }
        return artistsData.find(a => a._id === id);
      },
      3600
    );

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist bulunamadı' });
    }

    res.status(200).json({ success: true, data: artist });
  } catch (error) {
    logger.error('Artist getArtistById hatası:', error.message);
    next(error);
  }
};

/**
 * POST /api/artists
 * Yeni artist oluştur ve cache'i temizle
 */
exports.createArtist = async (req, res, next) => {
  try {
    const { name, category, image } = req.body;

    const artist = new Artist({ name, category, image });
    const saved = await artist.save();

    // Cache'i temizle
    await cacheService.invalidatePattern('artists:*');

    logger.info(`✅ Artist oluşturuldu: ${saved._id}`);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    logger.error('Artist createArtist hatası:', error.message);
    next(error);
  }
};

/**
 * PUT /api/artists/:id
 * Artist güncelle ve ilgili cache'leri temizle
 */
exports.updateArtist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, image } = req.body;

    const artist = await Artist.findByIdAndUpdate(
      id,
      { name, category, image },
      { new: true, runValidators: true }
    );

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist bulunamadı' });
    }

    // İlgili cache'leri temizle
    await cacheService.invalidate(`artist:${id}`);
    await cacheService.invalidatePattern('artists:*');

    logger.info(`✅ Artist güncellendi: ${id}`);
    res.status(200).json({ success: true, data: artist });
  } catch (error) {
    logger.error('Artist updateArtist hatası:', error.message);
    next(error);
  }
};

/**
 * DELETE /api/artists/:id
 * Artist sil ve cache'leri temizle
 */
exports.deleteArtist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const artist = await Artist.findByIdAndDelete(id);

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist bulunamadı' });
    }

    // Cache'leri temizle
    await cacheService.invalidate(`artist:${id}`);
    await cacheService.invalidatePattern('artists:*');

    logger.info(`✅ Artist silindi: ${id}`);
    res.status(200).json({ success: true, message: 'Artist silindi' });
  } catch (error) {
    logger.error('Artist deleteArtist hatası:', error.message);
    next(error);
  }
};
