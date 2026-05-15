const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },

  isActive: {
    type: Boolean,
    default: true
  },

  expiresAt: {
    type: Date,
    default: null
  },

  maxUses: {
    type: Number,
    default: 100
  },

  usedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);