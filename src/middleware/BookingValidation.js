const booking = require('../models/Booking');


exports.BookingIsValid = (req, res, next) => {
    const court = req.body.courtId || req.body.court;
    const { startTime, endTime, totalPrice } = req.body;

    if (!court || !startTime || !endTime || !totalPrice) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (new Date(startTime) < new Date()) {
        return res.status(400).json({ message: "You cannot book a court in the past!" });
    }

    if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({ message: "End time must be after start time." });
    }

    next();
}