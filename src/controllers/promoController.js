const PromoCode = require("../models/PromoCode");

// Validate promo code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!promo) {
      return res.status(404).json({ message: "Invalid promo code" });
    }

    // check expiry
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ message: "Promo code expired" });
    }

    // check usage limit
    if (promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ message: "Promo code fully used" });
    }

    return res.status(200).json({
      valid: true,
      discountPercent: promo.discountPercent,
      code: promo.code,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};