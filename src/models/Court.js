const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: String,
        required: true
    },
    pricePerHour: {
        type: Number,
        required: true
    },
    surface: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    // ✅ NEW: court photo URL
    imageUrl: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Court', courtSchema);