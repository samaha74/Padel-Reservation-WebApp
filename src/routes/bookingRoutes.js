const router = require('express').Router();
const bookingController = require('../controllers/bookingController');
const { BookingIsValid } = require('../middleware/BookingValidation');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Get bookings by userId
router.get('/user/:userId', bookingController.getBookingsByUserId);

// Get bookings by courtId
router.get('/court/:courtId', bookingController.getBookingsByCourtId);

// Get booking by date
router.get('/date', bookingController.getBookingsByDate);

// Create a new booking
router.post('/',BookingIsValid, bookingController.createBooking);

// Get all bookings
router.get('/',bookingController.getAllBookings);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking
router.put('/:id', BookingIsValid, bookingController.updateBooking);

// Cancel booking
router.delete('/:id', bookingController.cancelBooking);

module.exports = router;