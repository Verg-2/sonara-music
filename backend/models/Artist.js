const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Sanatçı adı gerekli'],
        trim: true,
        unique: true
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/150x150/333/fff?text=Artist'
    },
    category: {
        type: String,
        enum: ['odaklanma', 'antreman', 'parti', 'huzunlu', 'enerjik'],
        required: true
    },
    bio: {
        type: String,
        default: ''
    },
    followers: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for search
ArtistSchema.index({ name: 'text', bio: 'text' });

module.exports = mongoose.model('Artist', ArtistSchema);
