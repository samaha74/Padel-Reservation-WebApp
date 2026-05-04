const router = require('express').Router();
const bookingController = require('../controllers/bookingController');
const { BookingIsValid } = require('../middleware/BookingValidation');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Create a new booking
router.post('/',authenticate ,BookingIsValid, bookingController.createBooking);

// Get all bookings
router.get('/',authenticate , bookingController.getAllBookings);

// Get booking by ID
router.get('/:id', authenticate, bookingController.getBookingById);

// Get booking by date
router.get('/date', authenticate, bookingController.getBookingsByDate);

// Get bookings by userId
router.get('/user/:userId', authenticate, bookingController.getBookingsByUserId);

// Get bookings by courtId
router.get('/court/:courtId', authenticate, bookingController.getBookingsByCourtId);

// Update booking
router.put('/:id', authenticate, BookingIsValid, bookingController.updateBooking);

// Cancel booking
router.delete('/:id', authenticate, bookingController.cancelBooking);


//
//waiting for Nour's implementation of authentication middleware to protect the routes
//

module.exports = router;