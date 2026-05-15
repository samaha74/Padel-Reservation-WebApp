const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// POST /payment/pay
exports.payForBooking = async (req, res) => {
  try {
    const { bookingId, method } = req.body;

    // 1. check booking exists
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. prevent double payment
    if (booking.status === "Paid") {
      return res.status(400).json({ message: "Already paid" });
    }

    // 3. calculate amount properly
    const amount = booking.totalPrice;

    // 4. fake payment success
    const payment = await Payment.create({
      booking: booking._id,
      amount,
      method,
      status: "SUCCESS",
    });

    // 5. update booking
    booking.status = "Paid";
    await booking.save();

    return res.status(201).json({
      message: "Payment successful",
      payment,
      booking,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};