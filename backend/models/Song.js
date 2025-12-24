const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Şarkı adı gerekli'],
        trim: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },
    album: {
        type: String,
        default: 'Single'
    },
    duration: {
        type: Number, // saniye cinsinden
        required: true
    },
    audioUrl: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: 'https://via.placeholder.com/300x300/333/fff?text=Song'
    },
    category: {
        type: String,
        enum: ['odaklanma', 'antreman', 'parti', 'huzunlu', 'enerjik'],
        required: true
    },
    playCount: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    releaseDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for search
SongSchema.index({ title: 'text', album: 'text' });

module.exports = mongoose.model('Song', SongSchema);
