// const express = require("express");
// const router = express.Router();
// const { postReview } = require("../controllers/reviewController");
// const { authenticate } = require("../middleware/authMiddleware"); // ← was verifyToken

// router.post("/", authenticate, postReview); // ← was verifyToken

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  postReview,
  getCourtReviews,
} = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authMiddleware");

// Public — anyone can read reviews
router.get("/court/:courtId", getCourtReviews);

// Protected — must be logged in to post
router.post("/", authenticate, postReview);

module.exports = router;
