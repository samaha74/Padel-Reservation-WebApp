const Booking = require('../models/Booking');
const PromoCode = require('../models/PromoCode');

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const courtId = req.body.courtId || req.body.court;
        const { startTime, endTime, totalPrice, promoCode } = req.body;

        if (!courtId || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        // Check overlapping bookings
        const overlappingBooking = await Booking.findOne({
            court: courtId,
            status: { $ne: 'Cancelled' },
            startTime: { $lt: end },
            endTime: { $gt: start }
        });

        if (overlappingBooking) {
            return res.status(400).json({
                message: 'Court is not available for the requested time slot'
            });
        }

        // ================= PROMO CODE =================
        let discountPercent = 0;
        let validPromo = null;

        if (promoCode) {
            validPromo = await PromoCode.findOne({
                code: promoCode.toUpperCase(),
                isActive: true
            });

            if (!validPromo) {
                return res.status(400).json({ message: "Invalid promo code" });
            }

            if (validPromo.expiresAt && validPromo.expiresAt < new Date()) {
                return res.status(400).json({ message: "Promo code expired" });
            }

            if (validPromo.usedCount >= validPromo.maxUses) {
                return res.status(400).json({ message: "Promo code fully used" });
            }

            discountPercent = validPromo.discountPercent;
        }

        const finalPrice = Math.round(totalPrice * (1 - discountPercent / 100));

        const newBooking = new Booking({
            user: req.user._id,
            court: courtId,
            startTime: start,
            endTime: end,
            totalPrice: finalPrice,
            promoCode: promoCode || null,
            discountPercent: discountPercent,
            status: "Pending"
        });

        await newBooking.save();

        // increase promo usage
        if (validPromo) {
            validPromo.usedCount += 1;
            await validPromo.save();
        }

        return res.status(201).json({
            message: "Booking created successfully",
            booking: newBooking
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


// GetAll bookings
exports.getAllBookings = async (req, res) => {
    try {
        const filter = req.user.role === 'Admin' ? {} : { user: req.user._id };
        const bookings = await Booking.find(filter)
            .populate('user', 'name email')
            .populate('court', 'name location');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.id)
            .populate('user', 'name email')
            .populate('court');

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
};


// Get bookings by date + court
exports.getBookingsByDate = async (req, res) => {
    try {
        const { date, courtId } = req.query;

        if (!date || !courtId) {
            return res.status(400).json({ message: "Missing date or courtId" });
        }

        const startOfDay = new Date(date);
        if (isNaN(startOfDay.getTime())) {
            return res.status(400).json({ message: "Invalid Date format" });
        }

        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            court: courtId,
            startTime: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'Cancelled' }
        }).populate('court');

        res.status(200).json(bookings);

    } catch (error) {
        res.status(500).json({ error: error.message });

    }
};


// Get bookings by user
exports.getBookingsByUserId = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('court');

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get bookings by court
exports.getBookingsByCourtId = async (req, res) => {
    try {
        const courtId = req.params.courtId || req.query.courtId;

        if (!courtId) {
            return res.status(400).json({ message: 'courtId is required' });
        }

        const bookings = await Booking.find({ court: courtId })
            .populate('user', 'name email')
            .populate('court');

        res.status(200).json(bookings);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }

        booking.status = 'Cancelled';
        await booking.save();

        res.status(200).json({ message: 'Booking cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }

        const { courtId, court, startTime, endTime, totalPrice } = req.body;

        if (courtId || court) booking.court = courtId || court;
        if (startTime) booking.startTime = startTime;
        if (endTime) booking.endTime = endTime;
        if (totalPrice) booking.totalPrice = totalPrice;

        await booking.save();

        res.status(200).json(booking);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};