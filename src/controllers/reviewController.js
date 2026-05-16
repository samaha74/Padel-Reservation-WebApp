const Review = require("../models/Reviews");
const Court = require("../models/Court");

// ── POST /reviews ─────────────────────────────────────────────────────────────
// Any logged-in user can review any court, once per court.
exports.postReview = async (req, res) => {
  try {
    const { courtId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!courtId || !rating) {
      return res
        .status(400)
        .json({ message: "courtId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // One review per user per court
    const existing = await Review.findOne({ user: userId, court: courtId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already reviewed this court" });
    }

    const review = await Review.create({
      user: userId,
      court: courtId,
      rating,
      comment: comment || "",
    });

    // Recalculate court average rating
    const allReviews = await Review.find({ court: courtId });
    const avgRating =
      allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    await Court.findByIdAndUpdate(courtId, {
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (err) {
    console.error("postReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET /reviews/court/:courtId ───────────────────────────────────────────────
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
