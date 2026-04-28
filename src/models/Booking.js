const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Reference to the User who made the booking (Player)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference to the Court being booked
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// To prevent double-bookings, you can't rely on MongoDB unique indexes alone.
// You will handle the overlap logic in the Controller (Samaha's task).

module.exports = mongoose.model('Booking', bookingSchema);