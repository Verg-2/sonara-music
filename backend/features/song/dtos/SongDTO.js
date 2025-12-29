/**
 * Song DTO (Data Transfer Object)
 * Response formatting
 * features/song/dtos/SongDTO.js
 */

class SongDTO {
  /**
   * List response (minimal data)
   */
  static toListResponse(song) {
    return {
      id: song._id,
      title: song.title,
      artist: {
        id: song.artist._id,
        name: song.artist.name,
        avatar: song.artist.avatar
      },
      genre: song.genre,
      coverImage: song.coverImage,
      duration: song.duration,
      playCount: song.playCount,
      likeCount: song.likeCount,
      isLiked: song._isLiked || false,
      createdAt: song.createdAt
    };
  }

  /**
   * Detailed response (full data)
   */
  static toDetailedResponse(song) {
    return {
      id: song._id,
      title: song.title,
      artist: {
        id: song.artist._id,
        name: song.artist.name,
        avatar: song.artist.avatar
      },
      album: song.album ? {
        id: song.album._id,
        name: song.album.name,
        coverImage: song.album.coverImage
      } : null,
      genre: song.genre,
      description: song.description,
      lyrics: song.lyrics,
      audioUrl: song.audioUrl,
      coverImage: song.coverImage,
      duration: song.duration,
      releaseDate: song.releaseDate,
      playCount: song.playCount,
      likeCount: song.likeCount,
      shareCount: song.shareCount,
      isLiked: song._isLiked || false,
      isPublished: song.isPublished,
      publishedAt: song.publishedAt,
      tags: song.tags,
      createdAt: song.createdAt,
      updatedAt: song.updatedAt
    };
  }

  /**
   * Public profile response (show only published)
   */
  static toPublicResponse(song) {
    if (!song.isPublished) return null;

    return {
      id: song._id,
      title: song.title,
      artist: {
        id: song.artist._id,
        name: song.artist.name,
        avatar: song.artist.avatar
      },
      genre: song.genre,
      coverImage: song.coverImage,
      duration: song.duration,
      playCount: song.playCount,
      likeCount: song.likeCount,
      createdAt: song.createdAt
    };
  }

  /**
   * Batch response for multiple songs
   */
  static toListBatch(songs, detailed = false) {
    return songs
      .filter(song => song !== null)
      .map(song => detailed ? this.toDetailedResponse(song) : this.toListResponse(song));
  }
}

module.exports = SongDTO;
