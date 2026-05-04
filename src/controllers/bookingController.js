const booking = require('../models/Booking');
const { BookingIsValid } = require('../middleware/BookingValidation');

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const courtId = req.body.courtId || req.body.court;
        const { startTime, endTime, totalPrice } = req.body;

        const overlappingBooking = await booking.findOne({
            court: courtId,
            status: { $ne: 'Cancelled' },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (overlappingBooking) {
            return res.status(400).json({ message: 'Court is not available for the requested time slot' });
        }

        const newBooking = new booking({
            user: req.user._id,
            court: courtId,
            startTime,
            endTime,
            totalPrice
        });

        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// GetAll bookings
exports.getAllBookings = async (req, res) => {
    try {
        const filter = req.user.role === 'Admin' ? {} : { user: req.user._id };
        const bookings = await booking.find(filter).populate('user', 'name email').populate('court', 'name location');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const foundBooking = await booking.findById(req.params.id).populate('user', 'name email').populate('court');
        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!foundBooking.user._id.equals(req.user._id) && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }

        res.status(200).json(foundBooking);
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
        const foundBooking = await booking.findById(req.params.id);
        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!foundBooking.user.equals(req.user._id) && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }

        foundBooking.status = 'Cancelled';
        await foundBooking.save();
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const foundBooking = await booking.findById(req.params.id);
        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!foundBooking.user.equals(req.user._id) && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }

        const { courtId, court, startTime, endTime, totalPrice } = req.body;
        foundBooking.court = courtId || court || foundBooking.court;
        foundBooking.startTime = startTime || foundBooking.startTime;
        foundBooking.endTime = endTime || foundBooking.endTime;
        foundBooking.totalPrice = totalPrice || foundBooking.totalPrice;
        await foundBooking.save();
        res.status(200).json(foundBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}