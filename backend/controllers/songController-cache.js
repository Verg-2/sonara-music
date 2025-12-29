/**
 * CACHE ENTEGRASYONu ÖRNEĞİ - Songs Controller
 * 
 * Farklı endpoint'ler için cache pattern'ı gösterir:
 * - Popular songs: 5 dakika (değişken)
 * - User's songs: 10 dakika (daha dinamik)
 * - Search results: 5 dakika
 */

const Song = require('../models/Song');
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * GET /api/songs
 * Şarkıları kategori/artist ile filtreleyerek al (CACHE: 10 dakika)
 */
exports.getSongs = async (req, res, next) => {
  try {
    const { artist, category, page = 1, limit = 20 } = req.query;

    const cacheKey = artist
      ? `songs:artist:${artist}:${page}:${limit}`
      : category
        ? `songs:category:${category}:${page}:${limit}`
        : `songs:all:${page}:${limit}`;

    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const query = {};
        if (artist) query.artist = artist;
        if (category) query.category = category;

        const songs = await Song.find(query)
          .populate('artist', 'name')
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .sort('-createdAt');

        const total = await Song.countDocuments(query);

        return {
          success: true,
          count: songs.length,
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          data: songs,
        };
      },
      600 // TTL: 10 dakika (daha dinamik)
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('Song getSongs hatası:', error.message);
    next(error);
  }
};

/**
 * GET /api/songs/popular
 * En popüler şarkıları al (CACHE: 5 dakika - daha dinamik)
 */
exports.getPopularSongs = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const cacheKey = `songs:popular:${limit}`;

    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const songs = await Song.find()
          .populate('artist', 'name')
          .sort('-playCount')
          .limit(parseInt(limit));

        return {
          success: true,
          count: songs.length,
          data: songs,
        };
      },
      300 // TTL: 5 dakika (popülarite sürekli değişiyor)
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('Song getPopularSongs hatası:', error.message);
    next(error);
  }
};

/**
 * GET /api/songs/search
 * Şarkı ara (CACHE: 5 dakika - arama sonuçları değişken)
 */
exports.searchSongs = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'En az 2 karakter girin' });
    }

    // Arama terimine göre cache key oluştur
    const cacheKey = `songs:search:${q.toLowerCase()}`;

    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const songs = await Song.find({
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { artist: { $regex: q, $options: 'i' } },
          ],
        })
          .populate('artist', 'name')
          .limit(20);

        return {
          success: true,
          count: songs.length,
          query: q,
          data: songs,
        };
      },
      300 // TTL: 5 dakika (arama sonuçları değişken)
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error('Song searchSongs hatası:', error.message);
    next(error);
  }
};

/**
 * GET /api/songs/:id
 * Belirli şarkıyı al (CACHE: 1 saat)
 */
exports.getSongById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `song:${id}`;

    const song = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await Song.findById(id).populate('artist', 'name');
      },
      3600 // TTL: 1 saat
    );

    if (!song) {
      return res.status(404).json({ success: false, message: 'Şarkı bulunamadı' });
    }

    res.status(200).json({ success: true, data: song });
  } catch (error) {
    logger.error('Song getSongById hatası:', error.message);
    next(error);
  }
};

/**
 * POST /api/songs/play/:id
 * Şarkı oynatıldığında playCount'ı artır
 * Cache'i temizle
 */
exports.playSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    // playCount'ı artır
    const song = await Song.findByIdAndUpdate(
      id,
      { $inc: { playCount: 1 } },
      { new: true }
    );

    if (!song) {
      return res.status(404).json({ success: false, message: 'Şarkı bulunamadı' });
    }

    // Cache'leri temizle (popülarite değişti)
    await cacheService.invalidate(`song:${id}`);
    await cacheService.invalidatePattern('songs:popular:*');
    await cacheService.invalidatePattern('songs:*');

    res.status(200).json({ success: true, data: song });
  } catch (error) {
    logger.error('Song playSong hatası:', error.message);
    next(error);
  }
};

/**
 * PUT /api/songs/:id
 * Şarkıyı güncelle ve cache'i temizle
 */
exports.updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, artist, duration, category } = req.body;

    const song = await Song.findByIdAndUpdate(
      id,
      { title, artist, duration, category },
      { new: true, runValidators: true }
    );

    if (!song) {
      return res.status(404).json({ success: false, message: 'Şarkı bulunamadı' });
    }

    // İlgili cache'leri temizle
    await cacheService.invalidate(`song:${id}`);
    await cacheService.invalidatePattern('songs:*');
    await cacheService.invalidatePattern('songs:search:*');

    logger.info(`✅ Şarkı güncellendi: ${id}`);
    res.status(200).json({ success: true, data: song });
  } catch (error) {
    logger.error('Song updateSong hatası:', error.message);
    next(error);
  }
};

/**
 * DELETE /api/songs/:id
 * Şarkıyı sil ve cache'i temizle
 */
exports.deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    const song = await Song.findByIdAndDelete(id);

    if (!song) {
      return res.status(404).json({ success: false, message: 'Şarkı bulunamadı' });
    }

    // Tüm song cache'lerini temizle
    await cacheService.invalidate(`song:${id}`);
    await cacheService.invalidatePattern('songs:*');
    await cacheService.invalidatePattern('songs:search:*');

    logger.info(`✅ Şarkı silindi: ${id}`);
    res.status(200).json({ success: true, message: 'Şarkı silindi' });
  } catch (error) {
    logger.error('Song deleteSong hatası:', error.message);
    next(error);
  }
};
