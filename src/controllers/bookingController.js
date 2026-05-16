const booking = require("../models/Booking");
const { BookingIsValid } = require("../middleware/BookingValidation");

// Create a new booking
exports.createBooking = async (req, res) => {
    console.log("=== CREATE BOOKING CALLED ===");
    console.log("REQ USER FULL:", JSON.stringify(req.user));
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = req.user._id || req.user.id;
        console.log("REQ USER:", req.user);
        console.log("USER ID:", userId);

        const courtId = req.body.courtId || req.body.court;
        const { startTime, endTime, totalPrice } = req.body;
        let promoCode = req.body.promoCode;

        if (!courtId || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

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

        let discountPercent = 0;
        let validPromo = null;

        if (promoCode && promoCode.trim() !== "") {
            const cleanCode = promoCode.trim().toUpperCase();
            validPromo = await PromoCode.findOne({ code: cleanCode, isActive: true });

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
            user: userId,
            court: courtId,
            startTime: start,
            endTime: end,
            totalPrice: finalPrice,
            promoCode: validPromo ? validPromo.code : null,
            discountPercent,
            status: "Upcoming"
        });

        await newBooking.save();

        if (validPromo) {
            validPromo.usedCount += 1;
            await validPromo.save();
        }

        return res.status(201).json({
            message: "Booking created successfully",
            booking: newBooking
        });

    } catch (error) {
        console.error("CREATE BOOKING ERROR:", error);
        return res.status(500).json({ message: error.message });
    }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const filter = req.user.role === 'Admin' ? {} : { user: userId };
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
        const userId = req.user._id || req.user.id;
        const foundBooking = await Booking.findById(req.params.id)
            .populate('user', 'name email')
            .populate('court');
        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (!foundBooking.user._id.equals(userId) && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
        res.status(200).json(foundBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
 };


exports.getBookingsByDate = async (req, res) => {
  try {
    const { date, courtId } = req.query;

    // 1. Validation
    if (!date || !courtId) {
      return res.status(400).json({ message: "Missing date or courtId" });
    }

    // 2. Date Parsing
    const startOfDay = new Date(date);
    if (isNaN(startOfDay.getTime())) {
      return res.status(400).json({ message: "Invalid Date format" });
    }


    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await booking
      .find({
        court: courtId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "Cancelled" },
      })
      .populate("court");

        res.status(200).json(bookings);
    } catch (error) {
        console.error("ERROR IN getBookingsByDate:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Get bookings by user id
exports.getBookingsByUserId = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const bookings = await Booking.find({ user: userId }).populate('court');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get bookings by court id
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
        const userId = req.user._id || req.user.id;
        const foundBooking = await Booking.findById(req.params.id);
        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (!foundBooking.user.equals(userId) && req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
        foundBooking.status = 'Cancelled';
        await foundBooking.save();
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const foundBooking = await booking.findById(req.params.id);
    if (!foundBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!foundBooking.user.equals(req.user._id) && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Access denied" });
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
};