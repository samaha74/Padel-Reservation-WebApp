const router = require('express').Router();
const bookingController = require('../controllers/bookingController');
const { BookingIsValid } = require('../middleware/BookingValidation');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * @openapi
 * tags:
 *   - name: Bookings
 *     description: Booking management endpoints
 *
 * /bookings/user/{userId}:
 *   get:
 *     summary: Get bookings for the authenticated user
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (route parameter for compatibility)
 *     responses:
 *       '200':
 *         description: User bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 *       '401':
 *         description: Unauthorized
 *
 * /bookings/court/{courtId}:
 *   get:
 *     summary: Get bookings for a specific court
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courtId
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID
 *     responses:
 *       '200':
 *         description: Court bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 *       '401':
 *         description: Unauthorized
 *
 * /bookings/date:
 *   get:
 *     summary: Get bookings for a court on a specific date
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to filter bookings by
 *       - in: query
 *         name: courtId
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID to filter by
 *     responses:
 *       '200':
 *         description: Bookings found for the requested date and court
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 *       '400':
 *         description: Missing or invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 *       '401':
 *         description: Unauthorized
 *   post:
 *     summary: Create a new booking
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       '201':
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       '400':
 *         description: Validation error or court unavailable
 *       '401':
 *         description: Unauthorized
 *
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       '200':
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Booking not found
 *   put:
 *     summary: Update an existing booking
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingRequest'
 *     responses:
 *       '200':
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Booking not found
 *   delete:
 *     summary: Cancel a booking
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       '200':
 *         description: Booking cancelled successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Booking not found
 */
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