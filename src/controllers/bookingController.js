const booking = require('../models/Booking');
const { BookingIsValid } = require('../middleware/BookingValidation');

// Create a new booking
exports.createBooking = async (req, res, next) => {
    try {
        // Check if the user is authenticated (Waiting for Nour's implementation of authentication middleware)
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Validate input
        BookingIsValid(req, res, () => {});


        const { user, court, startTime, endTime, totalPrice } = req.body;


        // Check for overlapping bookings for the same court
        const overlappingBooking = await booking.findOne({
            court: req.body.courtId,
            status: { $ne: 'Cancelled' },
            $or: [
                {
                    startTime: { $lt: req.body.endTime },
                    endTime: { $gt: req.body.startTime }
                }
            ]
        });

        if (overlappingBooking) {
            return res.status(400).json({ message: 'Court is not available for the requested time slot' });
        }

        const newBooking = new booking({
            user: req.user._id, 
            court: req.body.courtId,
            startTime,
            endTime,
            totalPrice
        });

        await newBooking.save();
        res.status(201).json(newBooking);
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// GetAll bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await booking.find().populate('user', 'name email').populate('court', 'name location');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await booking.findById(req.params.id).populate('user', 'name email').populate('court');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get Booking by date
exports.getBookingsByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const bookings = await booking.find({
            startTime: { $gte: startOfDay, $lte: endOfDay }
        }).populate('user', 'name email').populate('court');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        booking.status = 'Cancelled';
        await booking.save();
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const booking = await booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Validate input
        BookingIsValid(req, res, () => {});
        const { court, startTime, endTime, totalPrice } = req.body;
        booking.court = court || booking.court;
        booking.startTime = startTime || booking.startTime;
        booking.endTime = endTime || booking.endTime;
        booking.totalPrice = totalPrice || booking.totalPrice;
        await booking.save();
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}