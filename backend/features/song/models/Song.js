/**
 * Song Model
 * Music domain entity
 * features/song/models/Song.js
 */

const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Şarkı adı gerekli'],
    trim: true,
    maxlength: [200, 'Şarkı adı 200 karakterden uzun olamaz'],
    index: true
  },

  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true,
    index: true
  },

  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album'
  },

  genre: {
    type: String,
    enum: ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hip-hop', 'other'],
    required: true,
    index: true
  },

  // Audio File
  audioUrl: {
    type: String,
    required: true
  },

  audioPublicId: {
    type: String // Cloudinary public ID
  },

  duration: {
    type: Number, // seconds
    required: true
  },

  // Metadata
  coverImage: {
    type: String,
    default: null
  },

  description: {
    type: String,
    maxlength: 1000
  },

  lyrics: {
    type: String,
    maxlength: 10000
  },

  releaseDate: {
    type: Date,
    default: Date.now
  },

  // Statistics
  playCount: {
    type: Number,
    default: 0,
    index: true
  },

  likeCount: {
    type: Number,
    default: 0
  },

  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],

  shareCount: {
    type: Number,
    default: 0
  },

  // Publishing
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },

  publishedAt: {
    type: Date
  },

  // Ownership
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// VIRTUALS
songSchema.virtual('isLiked')
  .get(function() {
    // Server-side populated during query
    return this._isLiked || false;
  });

// INDEXES
songSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Full-text search
songSchema.index({ artist: 1, isPublished: 1 });
songSchema.index({ genre: 1, isPublished: 1 });
songSchema.index({ createdAt: -1 });
songSchema.index({ playCount: -1 }); // Popular songs query

// INSTANCE METHODS
songSchema.methods.toggleLike = function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.likeCount = Math.max(0, this.likeCount - 1);
  } else {
    this.likedBy.push(userId);
    this.likeCount += 1;
  }
  return this.save();
};

songSchema.methods.incrementPlayCount = function() {
  this.playCount += 1;
  return this.save();
};

songSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// STATIC METHODS
songSchema.statics.findPublished = function() {
  return this.find({ isPublished: true });
};

songSchema.statics.findByGenre = function(genre) {
  return this.find({ genre, isPublished: true });
};

songSchema.statics.findTrending = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({
    isPublished: true,
    createdAt: { $gte: date }
  }).sort({ playCount: -1 });
};

// QUERY HELPERS
songSchema.query.published = function() {
  return this.where({ isPublished: true });
};

songSchema.query.byArtist = function(artistId) {
  return this.where({ artist: artistId });
};

songSchema.query.byGenre = function(genre) {
  return this.where({ genre });
};

songSchema.query.includeArtist = function() {
  return this.populate('artist', 'name avatar');
};

songSchema.query.withLikeStatus = function(userId) {
  return this.addFields({
    _isLiked: {
      $in: [userId, '$likedBy']
    }
  });
};

// PRE-SAVE HOOKS
songSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

songSchema.pre('save', async function(next) {
  if (this.isModified('audioUrl') && !this.audioUrl.startsWith('http')) {
    throw new Error('Geçersiz audio URL');
  }
  next();
});

// PRE-FIND HOOKS (Auto-populate)
songSchema.pre(/^find/, function(next) {
  if (this.options._recursed) {
    return next();
  }
  this.populate({
    path: 'artist',
    select: 'name avatar'
  });
  next();
});

// PRE-DELETE HOOKS (Cascade)
songSchema.pre('findByIdAndDelete', async function(next) {
  const song = await this.model.findOne(this.getFilter());
  if (song) {
    // Remove from playlists
    await mongoose.model('Playlist').updateMany(
      { songs: song._id },
      { $pull: { songs: song._id } }
    );
    // TODO: Remove from user libraries
  }
  next();
});

module.exports = mongoose.model('Song', songSchema);
