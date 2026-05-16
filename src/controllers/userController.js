// src/controllers/userController.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ─── GET /auth/me ────────────────────────────────────────────────────────────
// req.user is the JWT payload (plain object), not a Mongoose doc — fetch from DB
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PUT /auth/me ─────────────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    // Prevent duplicate email
    if (email) {
      const existing = await User.findOne({
        email,
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return res
          .status(409)
          .json({ message: "Email already in use by another account" });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(email && { email }) },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user: updated });
  } catch (err) {
    console.error("updateMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── PUT /auth/me/password ────────────────────────────────────────────────────
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both currentPassword and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Fresh query WITH password (middleware excluded it from req.user)
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Compare against the "password" field (not "password_hash")
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("updatePassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
