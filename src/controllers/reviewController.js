// const Review = require("../models/Reviews");
// const Court = require("../models/Court");

// // ── POST /reviews ─────────────────────────────────────────────────────────────
// // Any logged-in user can review any court, once per court.
// exports.postReview = async (req, res) => {
//   try {
//     const { courtId, rating, comment } = req.body;
//     const userId = req.user._id;

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

//     // One review per user per court
//     const existing = await Review.findOne({ user: userId, court: courtId });
//     if (existing) {
//       return res
//         .status(409)
//         .json({ message: "You have already reviewed this court" });
//     }

//     const review = await Review.create({
//       user: userId,
//       court: courtId,
//       rating,
//       comment: comment || "",
//     });

//     // Recalculate court average rating
//     const allReviews = await Review.find({ court: courtId });
//     const avgRating =
//       allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

//     await Court.findByIdAndUpdate(courtId, {
//       avgRating: Math.round(avgRating * 10) / 10,
//       reviewCount: allReviews.length,
//     });

//     res.status(201).json({ message: "Review submitted successfully", review });
//   } catch (err) {
//     console.error("postReview error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ── GET /reviews/court/:courtId ───────────────────────────────────────────────
// exports.getCourtReviews = async (req, res) => {
//   try {
//     const { courtId } = req.params;
//     const reviews = await Review.find({ court: courtId })
//       .populate("user", "name")
//       .sort({ createdAt: -1 });

//     res.status(200).json({ reviews });
//   } catch (err) {
//     console.error("getCourtReviews error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };



const Review = require("../models/Reviews");
const Court  = require("../models/Court");

async function recalcRating(courtId) {
  const all = await Review.find({ court: courtId });
  const avg = all.length > 0 ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;
  await Court.findByIdAndUpdate(courtId, {
    avgRating:   all.length > 0 ? Math.round(avg * 10) / 10 : 0,
    reviewCount: all.length,
  });
}

exports.postReview = async (req, res) => {
  try {
    const { courtId, rating, comment } = req.body;
    const userId = req.user._id;
    if (!courtId || !rating)
      return res.status(400).json({ message: "courtId and rating are required" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    const existing = await Review.findOne({ user: userId, court: courtId });
    if (existing)
      return res.status(409).json({ message: "You have already reviewed this court" });
    const review = await Review.create({ user: userId, court: courtId, rating, comment: comment || "" });
    await recalcRating(courtId);
    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (err) {
    console.error("postReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    if (rating && (rating < 1 || rating > 5))
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.user.toString() !== userId.toString())
      return res.status(403).json({ message: "You can only edit your own reviews" });
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();
    await recalcRating(review.court.toString());
    res.status(200).json({ message: "Review updated successfully", review });
  } catch (err) {
    console.error("updateReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.user.toString() !== userId.toString())
      return res.status(403).json({ message: "You can only delete your own reviews" });
    const courtId = review.court.toString();
    await review.deleteOne();
    await recalcRating(courtId);
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("deleteReview error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

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