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
        default: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EA%3C/text%3E%3C/svg%3E"
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
