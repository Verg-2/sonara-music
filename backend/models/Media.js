/**
 * Media Model
 * Stores metadata and URLs for uploaded files
 * NO binary data - only references to cloud storage
 */

const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
    // File identification
    filename: {
        type: String,
        required: [true, 'Dosya adı gerekli'],
        trim: true,
        maxlength: 255
    },
    
    // Cloud storage reference
    url: {
        type: String,
        required: [true, 'URL gerekli'],
        trim: true
    },
    
    publicId: {
        type: String,
        required: [true, 'Public ID gerekli'],
        unique: true,
        trim: true
    },
    
    // File metadata
    mimetype: {
        type: String,
        required: true,
        enum: [
            'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav',
            'image/jpeg', 'image/png', 'image/jpg', 'image/webp'
        ]
    },
    
    resourceType: {
        type: String,
        required: true,
        enum: ['audio', 'image', 'video'],
        default: 'image'
    },
    
    format: {
        type: String,
        trim: true
    },
    
    size: {
        type: Number, // in bytes
        required: true,
        min: 0
    },
    
    // Image-specific
    width: {
        type: Number,
        min: 0
    },
    
    height: {
        type: Number,
        min: 0
    },
    
    // Audio-specific
    duration: {
        type: Number, // in seconds
        min: 0
    },
    
    // Categorization
    category: {
        type: String,
        enum: ['song', 'cover', 'avatar', 'banner', 'playlist_cover', 'other'],
        default: 'other'
    },
    
    // Owner relationship
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Related entity (optional)
    relatedTo: {
        entityType: {
            type: String,
            enum: ['Song', 'Artist', 'Album', 'Playlist', 'User'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'relatedTo.entityType'
        }
    },
    
    // Additional metadata
    metadata: {
        title: String,
        artist: String,
        album: String,
        tags: [String],
        description: String
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'deleted', 'archived'],
        default: 'active'
    },
    
    // Timestamps
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    
    lastModified: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
MediaSchema.index({ uploadedBy: 1, createdAt: -1 });
MediaSchema.index({ category: 1, status: 1 });
// publicId already has unique: true in schema definition, no need for separate index
MediaSchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });

// Virtual for formatted size
MediaSchema.virtual('formattedSize').get(function() {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for formatted duration
MediaSchema.virtual('formattedDuration').get(function() {
    if (!this.duration) return null;
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Method: Get thumbnail URL (for images)
MediaSchema.methods.getThumbnailUrl = function(width = 200, height = 200) {
    if (this.resourceType !== 'image') return null;
    
    // Cloudinary transformation
    return this.url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
};

// Method: Get optimized URL
MediaSchema.methods.getOptimizedUrl = function() {
    // Cloudinary auto-optimization
    return this.url.replace('/upload/', '/upload/q_auto,f_auto/');
};

// Static method: Find media by user
MediaSchema.statics.findByUser = function(userId, options = {}) {
    const query = { uploadedBy: userId, status: 'active' };
    
    if (options.category) {
        query.category = options.category;
    }
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50);
};

// Static method: Find media by entity
MediaSchema.statics.findByEntity = function(entityType, entityId) {
    return this.find({
        'relatedTo.entityType': entityType,
        'relatedTo.entityId': entityId,
        status: 'active'
    });
};

// Pre-save middleware: Update lastModified
MediaSchema.pre('save', function(next) {
    this.lastModified = Date.now();
    next();
});

module.exports = mongoose.model('Media', MediaSchema);
