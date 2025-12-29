/**
 * Song Service
 * Business logic for songs
 * features/song/services/SongService.js
 */

const SongRepository = require('../repositories/SongRepository');
const CacheService = require('../../../shared/services/cacheService');
const FileService = require('../../../shared/services/fileService');
const NotificationService = require('../../../shared/services/notificationService');
const { ValidationError, NotFoundError } = require('../../../shared/utils/errors');
const logger = require('../../../shared/utils/logger');

class SongService {
  constructor(
    songRepository,
    cacheService,
    fileService,
    notificationService
  ) {
    this.songRepository = songRepository;
    this.cacheService = cacheService;
    this.fileService = fileService;
    this.notificationService = notificationService;
  }

  /**
   * CREATE SONG (Upload)
   */
  async createSong(uploadedFile, songData, userId) {
    logger.info(`Şarkı oluşturiliyor: ${songData.title}`);

    // Validation
    if (!uploadedFile) {
      throw new ValidationError('Audio dosyası gerekli');
    }

    if (!songData.title || !songData.artist || !songData.genre) {
      throw new ValidationError('Başlık, sanatçı ve tür gerekli');
    }

    // Upload to Cloudinary
    const uploadResult = await this.fileService.uploadAudio(
      uploadedFile.buffer,
      {
        public_id: `songs/${userId}/${Date.now()}`,
        resource_type: 'video', // Audio files
        quality: 'auto'
      }
    );

    // Create song record
    const song = await this.songRepository.create({
      title: songData.title,
      artist: songData.artist,
      album: songData.album,
      genre: songData.genre,
      description: songData.description,
      lyrics: songData.lyrics,
      audioUrl: uploadResult.secure_url,
      audioPublicId: uploadResult.public_id,
      duration: songData.duration,
      uploadedBy: userId,
      isPublished: false,
      tags: songData.tags || []
    });

    logger.info(`Şarkı oluşturuldu: ${song._id}`);

    return song;
  }

  /**
   * GET SONG
   */
  async getSongById(songId, userId = null) {
    // Cache kontrol
    const cacheKey = `song:${songId}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return JSON.parse(cached);
    }

    // Database'den çek
    const song = await this.songRepository.findById(songId);

    // Like status'ü ekle
    if (userId) {
      song._isLiked = song.likedBy.includes(userId);
    }

    // Cache'e yaz (10 dakika)
    await this.cacheService.set(cacheKey, JSON.stringify(song), 600);

    logger.debug(`Cache MISS: ${cacheKey}`);

    return song;
  }

  /**
   * LIST SONGS with filters
   */
  async listSongs(filters = {}, options = {}) {
    logger.debug(`Şarkılar listeleniyor`, { filters, options });

    // Cache key oluştur
    const cacheKey = `songs:list:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Repository'den çek
    const result = await this.songRepository.findAll(filters, options);

    // Cache'e yaz (5 dakika - dinamik veri)
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  /**
   * SEARCH SONGS
   */
  async searchSongs(query, limit = 20) {
    if (!query || query.length < 2) {
      throw new ValidationError('Arama terimi en az 2 karakter olmalı');
    }

    logger.info(`Şarkı aranıyor: ${query}`);

    const cacheKey = `songs:search:${query}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const results = await this.songRepository.search(query, limit);

    // Cache'e yaz (5 dakika)
    await this.cacheService.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }

  /**
   * GET TRENDING SONGS
   */
  async getTrendingSongs(days = 7, limit = 20) {
    const cacheKey = `songs:trending:${days}:${limit}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const songs = await this.songRepository.findTrending(days, limit);

    // Cache'e yaz (1 saat)
    await this.cacheService.set(cacheKey, JSON.stringify(songs), 3600);

    return songs;
  }

  /**
   * PLAY SONG (Dinle)
   */
  async playSong(songId, userId) {
    logger.info(`Şarkı çalındı: ${songId} - Kullanıcı: ${userId}`);

    // Play count artır
    const song = await this.songRepository.incrementPlayCount(songId);

    // Cache'i temizle
    await this.cacheService.invalidate(`song:${songId}`);
    await this.cacheService.invalidatePattern('songs:*');

    // Socket.io ile broadcast
    if (global.io) {
      global.io.emit('song:played', {
        songId,
        userId,
        title: song.title,
        playedAt: new Date()
      });
    }

    // User listening history'e ekle (async)
    setImmediate(async () => {
      // TODO: Add to user listening history
    });

    return song;
  }

  /**
   * LIKE SONG (Beğen)
   */
  async likeSong(songId, userId) {
    logger.info(`Şarkı beğenildi: ${songId}`);

    // Check if already liked
    const song = await this.songRepository.findById(songId);

    if (song.likedBy.includes(userId)) {
      throw new ValidationError('Bu şarkıyı zaten beğenmişsiniz');
    }

    // Add like
    const updatedSong = await this.songRepository.addLike(songId, userId);

    // Cache'i temizle
    await this.cacheService.invalidate(`song:${songId}`);

    // Notify song owner
    await this.notificationService.notify({
      type: 'like',
      recipientId: song.uploadedBy,
      message: `Şarkını biri beğendi: ${song.title}`
    });

    // Socket.io broadcast
    if (global.io) {
      global.io.emit('song:liked', {
        songId,
        likeCount: updatedSong.likeCount
      });
    }

    return updatedSong;
  }

  /**
   * UNLIKE SONG
   */
  async unlikeSong(songId, userId) {
    logger.info(`Beğeni kaldırıldı: ${songId}`);

    const song = await this.songRepository.findById(songId);

    if (!song.likedBy.includes(userId)) {
      throw new ValidationError('Bu şarkıyı beğenmemişsiniz');
    }

    const updatedSong = await this.songRepository.removeLike(songId, userId);

    // Cache'i temizle
    await this.cacheService.invalidate(`song:${songId}`);

    return updatedSong;
  }

  /**
   * UPDATE SONG
   */
  async updateSong(songId, updateData, userId) {
    logger.info(`Şarkı güncelleniyor: ${songId}`);

    const song = await this.songRepository.findById(songId);

    // Authorization: Owner veya admin
    if (song.uploadedBy.toString() !== userId && !userId.isAdmin) {
      throw new ValidationError('Bu şarkıyı güncelleyemezsiniz');
    }

    // Güncelleme yasaklı alanlar
    const restrictedFields = ['audioUrl', 'playCount', 'likeCount', 'uploadedBy'];
    restrictedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        delete updateData[field];
      }
    });

    const updated = await this.songRepository.update(songId, updateData);

    // Cache'i temizle
    await this.cacheService.invalidate(`song:${songId}`);
    await this.cacheService.invalidatePattern('songs:*');

    return updated;
  }

  /**
   * DELETE SONG
   */
  async deleteSong(songId, userId) {
    logger.info(`Şarkı siliniyor: ${songId}`);

    const song = await this.songRepository.findById(songId);

    // Authorization
    if (song.uploadedBy.toString() !== userId && !userId.isAdmin) {
      throw new ValidationError('Bu şarkıyı silemezsiniz');
    }

    // Delete audio file from Cloudinary
    await this.fileService.deleteFile(song.audioPublicId);

    // Delete from database
    const deleted = await this.songRepository.delete(songId);

    // Cache'i temizle
    await this.cacheService.invalidate(`song:${songId}`);
    await this.cacheService.invalidatePattern('songs:*');

    return deleted;
  }

  /**
   * PUBLISH SONG
   */
  async publishSong(songId, userId) {
    logger.info(`Şarkı yayınlanıyor: ${songId}`);

    const song = await this.songRepository.findById(songId);

    if (song.uploadedBy.toString() !== userId) {
      throw new ValidationError('Sadece kendi şarkılarınızı yayınlayabilirsiniz');
    }

    if (song.isPublished) {
      throw new ValidationError('Bu şarkı zaten yayınlanmış');
    }

    const published = await this.songRepository.publish(songId);

    // Cache'i temizle
    await this.cacheService.invalidate(`song:${songId}`);
    await this.cacheService.invalidatePattern('songs:*');

    // Socket.io broadcast
    if (global.io) {
      global.io.emit('song:published', {
        songId,
        title: published.title,
        artist: published.artist
      });
    }

    return published;
  }

  /**
   * GET RECOMMENDATIONS
   */
  async getRecommendations(userId, limit = 20) {
    const cacheKey = `songs:recommendations:${userId}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // ML-based recommendations (TODO: implement)
    const recommendations = await this.songRepository.findRecommended(userId, limit);

    // Cache'e yaz (1 saat)
    await this.cacheService.set(cacheKey, JSON.stringify(recommendations), 3600);

    return recommendations;
  }

  /**
   * STATISTICS
   */
  async getGenreStatistics() {
    const cacheKey = 'stats:genres';
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const stats = await this.songRepository.getGenreStats();

    // Cache'e yaz (1 gün)
    await this.cacheService.set(cacheKey, JSON.stringify(stats), 86400);

    return stats;
  }

  async getArtistStatistics(artistId) {
    const cacheKey = `stats:artist:${artistId}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const stats = await this.songRepository.getArtistStats(artistId);

    await this.cacheService.set(cacheKey, JSON.stringify(stats), 3600);

    return stats;
  }
}

// Dependency Injection
module.exports = new SongService(
  SongRepository,
  CacheService,
  FileService,
  NotificationService
);
