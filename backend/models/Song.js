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
        default: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3E%E2%99%AA%3C/text%3E%3C/svg%3E"
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
