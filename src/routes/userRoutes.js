const express = require("express");
const router = express.Router();
const { getMe, updateMe, updatePassword } = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware"); // ← exact filename

router.use(authenticate);
router.get("/me", getMe);
router.put("/me", updateMe);
router.put("/me/password", updatePassword);

module.exports = router;