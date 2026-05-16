// // src/controllers/reviewController.js
// const Review = require("../models/Reviews"); // Aya's existing Reviews model
// const Booking = require("../models/Booking"); // Samaha's existing Booking model
// const Court = require("../models/Court"); // Moaz's existing Court model

// // ─── POST /reviews ──────────────────────────────────────────────────────────
// exports.postReview = async (req, res) => {
//   try {
//     const { courtId, rating, comment } = req.body;
//     const userId = req.user._id;

//     // 1. Validate input
//     if (!courtId || !rating) {
//       return res
//         .status(400)
//         .json({ message: "courtId and rating are required" });
//     }
//     if (rating < 1 || rating > 5) {
//       return res
//         .status(400)
//         .json({ message: "Rating must be between 1 and 5" });
//     }

//     // Step 2: find completed booking
//     const completedBooking = await Booking.findOne({
//       user: userId, // ← was user_id
//       court: courtId, // ← was court_id
//       status: "Completed", // ← check exact capitalisation in your DB (see note below)
//     });

//     if (!completedBooking) {
//       return res.status(403).json({
//         message: "You can only review a court after completing a booking there",
//       });
//     }

//     // Step 3: prevent duplicate review
//     const existing = await Review.findOne({
//       user: userId, // ← was user_id
//       court: courtId, // ← was court_id
//     });
//     if (existing) {
//       return res
//         .status(409)
//         .json({ message: "You have already reviewed this court" });
//     }

//     // Step 4: create the review
//     const review = await Review.create({
//       user: userId, // ← was user_id
//       court: courtId, // ← was court_id
//       rating,
//       comment: comment || "",
//     });

//     // 5. Mark the booking as reviewed so the button disappears on the frontend
//     await Booking.findByIdAndUpdate(completedBooking._id, { reviewed: true });

//     // Step 6: recalculate average
//     const allReviews = await Review.find({ court: courtId }); // ← was court_id
//     const avgRating =
//       allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

//     await Court.findByIdAndUpdate(courtId, {
//       avgRating: Math.round(avgRating * 10) / 10, // round to 1 decimal
//       reviewCount: allReviews.length,
//     });

//     res.status(201).json({ message: "Review submitted successfully", review });
//   } catch (err) {
//     console.error("postReview error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const Review  = require("../models/Reviews");
const Booking = require("../models/Booking");
const Court   = require("../models/Court");

// ── POST /reviews ─────────────────────────────────────────────────────────────
exports.postReview = async (req, res) => {
  try {
    const { courtId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!courtId || !rating) {
      return res.status(400).json({ message: "courtId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Must have a Completed booking for this court
    const completedBooking = await Booking.findOne({
      user:   userId,
      court:  courtId,
      status: { $in: ["Completed", "Paid"] },   // treat Paid as completed
    });

    if (!completedBooking) {
      return res.status(403).json({
        message: "You can only review a court after completing a booking there",
      });
    }

    // One review per user per court
    const existing = await Review.findOne({ user: userId, court: courtId });
    if (existing) {
      return res.status(409).json({ message: "You have already reviewed this court" });
    }

    const review = await Review.create({
      user:    userId,
      court:   courtId,
      rating,
      comment: comment || "",
    });

    // Mark booking as reviewed → hides button on frontend
    await Booking.findByIdAndUpdate(completedBooking._id, { reviewed: true });

    // Recalculate court average rating
    const allReviews = await Review.find({ court: courtId });
    const avgRating  = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    await Court.findByIdAndUpdate(courtId, {
      avgRating:   Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (err) {
    console.error("postReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET /reviews/court/:courtId ───────────────────────────────────────────────
// Public — no auth needed. Used on CourtDetails page.
exports.getCourtReviews = async (req, res) => {
  try {
    const { courtId } = req.params;
    const reviews = await Review.find({ court: courtId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (err) {
    console.error("getCourtReviews error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
