const router = require('express').Router();
const bookingController = require('../controllers/bookingController');
const { BookingIsValid } = require('../middleware/BookingValidation');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Create a new booking
router.post('/', BookingIsValid, bookingController.createBooking);

// Get all bookings
router.get('/', bookingController.getAllBookings);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Get booking by date
router.get('/date', bookingController.getBookingsByDate);

// Update booking
router.put('/:id', BookingIsValid, bookingController.updateBooking);

// Cancel booking
router.delete('/:id', bookingController.cancelBooking);


//
//waiting for Nour's implementation of authentication middleware to protect the routes
//

module.exports = router;