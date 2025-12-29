/**
 * Song Controller
 * HTTP request handling
 * features/song/controllers/SongController.js
 */

const SongService = require('../services/SongService');
const SongDTO = require('../dtos/SongDTO');
const { httpStatus } = require('../../../shared/constants');
const logger = require('../../../shared/utils/logger');

class SongController {
  /**
   * UPLOAD SONG
   * POST /api/songs/upload
   */
  async uploadSong(req, res, next) {
    try {
      const songData = req.body;
      const uploadedFile = req.file;
      const userId = req.user.id;

      logger.info(`Şarkı yükleniyor: ${songData.title}`);

      const song = await SongService.createSong(
        uploadedFile,
        songData,
        userId
      );

      const dto = SongDTO.toDetailedResponse(song);

      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Şarkı başarıyla yüklendi',
        data: dto
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET SONG
   * GET /api/songs/:id
   */
  async getSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user?.id;

      const song = await SongService.getSongById(songId, userId);
      const dto = SongDTO.toDetailedResponse(song);

      res.status(httpStatus.OK).json({
        success: true,
        data: dto
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * LIST SONGS
   * GET /api/songs
   * Query: page, limit, genre, artist, search, sort
   */
  async listSongs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        genre,
        artist,
        search,
        sort = '-createdAt'
      } = req.query;

      const filters = {
        genre,
        artist,
        search,
        published: true
      };

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort
      };

      const result = await SongService.listSongs(filters, options);

      res.status(httpStatus.OK).json({
        success: true,
        data: result.data.map(song => SongDTO.toListResponse(song)),
        pagination: {
          total: result.total,
          pages: result.pages,
          currentPage: result.currentPage
        }
      });

      logger.info(`Şarkılar listelendi: ${result.data.length}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * SEARCH SONGS
   * GET /api/songs/search?q=query
   */
  async searchSongs(req, res, next) {
    try {
      const { q, limit = 20 } = req.query;

      const results = await SongService.searchSongs(q, parseInt(limit));

      res.status(httpStatus.OK).json({
        success: true,
        data: results.map(song => SongDTO.toListResponse(song)),
        count: results.length
      });

      logger.info(`Şarkı arama: "${q}" - ${results.length} sonuç`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET TRENDING SONGS
   * GET /api/songs/trending
   */
  async getTrendingSongs(req, res, next) {
    try {
      const { days = 7, limit = 20 } = req.query;

      const songs = await SongService.getTrendingSongs(
        parseInt(days),
        parseInt(limit)
      );

      res.status(httpStatus.OK).json({
        success: true,
        data: songs.map(song => SongDTO.toListResponse(song)),
        period: `Son ${days} gün`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PLAY SONG (Increment play count)
   * POST /api/songs/:id/play
   */
  async playSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user?.id;

      const song = await SongService.playSong(songId, userId);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Oynatılma sayısı güncellendi',
        data: {
          songId: song._id,
          playCount: song.playCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * LIKE SONG
   * POST /api/songs/:id/like
   */
  async likeSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user.id;

      const song = await SongService.likeSong(songId, userId);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Şarkı beğenildi',
        data: {
          songId: song._id,
          likeCount: song.likeCount,
          isLiked: true
        }
      });

      logger.info(`Şarkı beğenildi: ${songId}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * UNLIKE SONG
   * DELETE /api/songs/:id/like
   */
  async unlikeSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user.id;

      const song = await SongService.unlikeSong(songId, userId);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Beğeni kaldırıldı',
        data: {
          songId: song._id,
          likeCount: song.likeCount,
          isLiked: false
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATE SONG
   * PATCH /api/songs/:id
   */
  async updateSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user.id;
      const updateData = req.body;

      const song = await SongService.updateSong(songId, updateData, userId);
      const dto = SongDTO.toDetailedResponse(song);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Şarkı güncellendi',
        data: dto
      });

      logger.info(`Şarkı güncellendi: ${songId}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE SONG
   * DELETE /api/songs/:id
   */
  async deleteSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user.id;

      await SongService.deleteSong(songId, userId);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Şarkı silindi'
      });

      logger.info(`Şarkı silindi: ${songId}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUBLISH SONG
   * POST /api/songs/:id/publish
   */
  async publishSong(req, res, next) {
    try {
      const songId = req.params.id;
      const userId = req.user.id;

      const song = await SongService.publishSong(songId, userId);
      const dto = SongDTO.toDetailedResponse(song);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Şarkı yayınlandı',
        data: dto
      });

      logger.info(`Şarkı yayınlandı: ${songId}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET RECOMMENDATIONS
   * GET /api/songs/recommendations
   */
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;

      const songs = await SongService.getRecommendations(
        userId,
        parseInt(limit)
      );

      res.status(httpStatus.OK).json({
        success: true,
        data: songs.map(song => SongDTO.toListResponse(song))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET STATISTICS
   * GET /api/songs/stats/genres
   */
  async getGenreStats(req, res, next) {
    try {
      const stats = await SongService.getGenreStatistics();

      res.status(httpStatus.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET ARTIST STATISTICS
   * GET /api/songs/stats/artist/:id
   */
  async getArtistStats(req, res, next) {
    try {
      const artistId = req.params.id;

      const stats = await SongService.getArtistStatistics(artistId);

      res.status(httpStatus.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SongController();
