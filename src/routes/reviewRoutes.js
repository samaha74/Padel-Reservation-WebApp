const express = require("express");
const router = express.Router();
const { postReview } = require("../controllers/reviewController");
const { authenticate } = require("../middleware/authMiddleware"); // ← was verifyToken

router.post("/", authenticate, postReview); // ← was verifyToken

module.exports = router;