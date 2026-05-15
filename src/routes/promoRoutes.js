const express = require("express");
const router = express.Router();
const { validatePromoCode } = require("../controllers/promoController");

router.post("/validate", validatePromoCode);

module.exports = router;