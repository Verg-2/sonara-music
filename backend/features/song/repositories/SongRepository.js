/**
 * Song Repository
 * Data access layer for songs
 * features/song/repositories/SongRepository.js
 */

const Song = require('../models/Song');
const { NotFoundError } = require('../../../shared/utils/errors');

class SongRepository {
  /**
   * CREATE
   */
  async create(songData) {
    const song = new Song(songData);
    await song.save();
    await song.populate('artist', 'name avatar');
    return song;
  }

  /**
   * READ - Single song
   */
  async findById(id) {
    const song = await Song.findById(id)
      .populate('artist', 'name avatar')
      .populate('album', 'name coverImage');

    if (!song) {
      throw new NotFoundError(`Şarkı bulunamadı: ${id}`);
    }

    return song;
  }

  /**
   * READ - Multiple songs with filters & pagination
   */
  async findAll(filters = {}, options = {}) {
    const {
      limit = 20,
      skip = 0,
      sort = '-createdAt',
      published = true,
      genre,
      artist,
      search
    } = { ...filters, ...options };

    // Build query
    let query = Song.find();

    // Filters
    if (published) {
      query = query.where({ isPublished: true });
    }

    if (genre) {
      query = query.where({ genre });
    }

    if (artist) {
      query = query.where({ artist });
    }

    // Full-text search
    if (search) {
      query = query.find(
        { $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });
    } else {
      query = query.sort(sort);
    }

    // Pagination
    query = query.skip(skip).limit(limit);

    // Populate
    query = query
      .populate('artist', 'name avatar')
      .populate('album', 'name coverImage');

    const [data, total] = await Promise.all([
      query.exec(),
      Song.countDocuments(this._buildCountQuery(filters))
    ]);

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(skip / limit) + 1
    };
  }

  /**
   * READ - Trending songs
   */
  async findTrending(days = 7, limit = 20) {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return await Song.find({
      isPublished: true,
      createdAt: { $gte: date }
    })
      .sort({ playCount: -1 })
      .limit(limit)
      .populate('artist', 'name avatar');
  }

  /**
   * READ - Featured/recommended songs
   */
  async findRecommended(userId, limit = 20) {
    // User'ın dinlediklerinden benzer türleri bul
    // TODO: Machine learning based recommendation

    return await Song.find({ isPublished: true })
      .sort({ likeCount: -1 })
      .limit(limit)
      .populate('artist', 'name avatar');
  }

  /**
   * READ - Search
   */
  async search(query, limit = 20) {
    return await Song.find(
      { $text: { $search: query }, isPublished: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .populate('artist', 'name avatar');
  }

  /**
   * READ - By artist
   */
  async findByArtist(artistId, filters = {}) {
    const { limit = 20, skip = 0 } = filters;

    const [data, total] = await Promise.all([
      Song.find({ artist: artistId, isPublished: true })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('album', 'name'),

      Song.countDocuments({ artist: artistId, isPublished: true })
    ]);

    return { data, total };
  }

  /**
   * UPDATE
   */
  async update(id, updateData) {
    // Validations
    if (updateData.playCount !== undefined) {
      throw new Error('playCount doğrudan güncellenemez');
    }

    const song = await Song.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('artist', 'name avatar');

    if (!song) {
      throw new NotFoundError(`Şarkı bulunamadı: ${id}`);
    }

    return song;
  }

  /**
   * DELETE
   */
  async delete(id) {
    const song = await Song.findByIdAndDelete(id);

    if (!song) {
      throw new NotFoundError(`Şarkı bulunamadı: ${id}`);
    }

    // TODO: Delete audio file from Cloudinary
    // await fileService.deleteFile(song.audioPublicId);

    return song;
  }

  /**
   * STATISTICS
   */
  async incrementPlayCount(id) {
    return await Song.findByIdAndUpdate(
      id,
      { $inc: { playCount: 1 } },
      { new: true }
    );
  }

  async addLike(id, userId) {
    return await Song.findByIdAndUpdate(
      id,
      {
        $addToSet: { likedBy: userId },
        $inc: { likeCount: 1 }
      },
      { new: true }
    );
  }

  async removeLike(id, userId) {
    return await Song.findByIdAndUpdate(
      id,
      {
        $pull: { likedBy: userId },
        $inc: { likeCount: -1 }
      },
      { new: true }
    );
  }

  async incrementShareCount(id) {
    return await Song.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );
  }

  /**
   * PUBLISHING
   */
  async publish(id) {
    return await Song.findByIdAndUpdate(
      id,
      {
        isPublished: true,
        publishedAt: new Date()
      },
      { new: true }
    );
  }

  async unpublish(id) {
    return await Song.findByIdAndUpdate(
      id,
      { isPublished: false },
      { new: true }
    );
  }

  /**
   * BULK OPERATIONS
   */
  async createMany(songsData) {
    return await Song.insertMany(songsData);
  }

  async updateMany(filter, updateData) {
    return await Song.updateMany(filter, { $set: updateData });
  }

  async deleteMany(filter) {
    return await Song.deleteMany(filter);
  }

  /**
   * HELPER - Build count query
   */
  _buildCountQuery(filters) {
    const { published = true, genre, artist } = filters;
    const query = {};

    if (published) query.isPublished = true;
    if (genre) query.genre = genre;
    if (artist) query.artist = artist;

    return query;
  }

  /**
   * AGGREGATION - Advanced analytics
   */
  async getGenreStats() {
    return await Song.aggregate([
      {
        $match: { isPublished: true }
      },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          avgPlayCount: { $avg: '$playCount' },
          totalPlays: { $sum: '$playCount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  }

  async getArtistStats(artistId) {
    return await Song.aggregate([
      {
        $match: { artist: artistId }
      },
      {
        $group: {
          _id: null,
          totalSongs: { $sum: 1 },
          totalPlays: { $sum: '$playCount' },
          totalLikes: { $sum: '$likeCount' },
          avgPlaysPerSong: { $avg: '$playCount' }
        }
      }
    ]);
  }
}

module.exports = new SongRepository();
