const booking = require("../models/Booking");
const { BookingIsValid } = require("../middleware/BookingValidation");

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const courtId = req.body.courtId || req.body.court;
    const { startTime, endTime, totalPrice } = req.body;

    const overlappingBooking = await booking.findOne({
      court: courtId,
      status: { $ne: "Cancelled" },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message: "Court is not available for the requested time slot",
      });
    }

    const newBooking = new booking({
      user: req.user._id,
      court: courtId,
      startTime,
      endTime,
      totalPrice,
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GetAll bookings
exports.getAllBookings = async (req, res) => {
  try {
    const filter = req.user.role === "Admin" ? {} : { user: req.user._id };
    const bookings = await booking
      .find(filter)
      .populate("user", "name email")
      .populate("court", "name location");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const foundBooking = await booking
      .findById(req.params.id)
      .populate("user", "name email")
      .populate("court");
    if (!foundBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      !foundBooking.user._id.equals(req.user._id) &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    res.status(200).json(foundBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Booking by date for a specific court
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

    // 3. Query - Note: Ensure your field is 'court' and not 'courtId' in the Schema
    console.log(`Searching for Court: ${courtId} on ${date}`);

    const bookings = await booking
      .find({
        court: courtId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: "Cancelled" },
      })
      .populate("court");

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Booking by user id
exports.getBookingsByUserId = async (req, res) => {
  try {
    const bookings = await booking
      .find({ user: req.user._id })
      .populate("court");
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get booking by court id
exports.getBookingsByCourtId = async (req, res) => {
  try {
    const courtId = req.params.courtId || req.query.courtId;
    if (!courtId) {
      return res.status(400).json({ message: "courtId is required" });
    }

    console.log("getBookingsByCourtId courtId=", courtId);

    const bookings = await booking
      .find({ court: courtId })
      .populate("user", "name email")
      .populate("court");

    console.log("found bookings count=", bookings.length);

    res.status(200).json(bookings);
  } catch (error) {
    console.error("getBookingsByCourtId error=", error);
    res.status(500).json({ message: error.message });
  }
};
// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const foundBooking = await booking.findById(req.params.id);
    if (!foundBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!foundBooking.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    foundBooking.status = "Cancelled";
    await foundBooking.save();
    res.status(200).json({ message: "Booking cancelled successfully" });
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
