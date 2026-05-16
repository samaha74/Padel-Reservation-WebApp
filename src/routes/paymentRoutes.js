const express = require("express");
const router = express.Router();
const { payForBooking } = require("../controllers/paymentController");

router.post("/pay", payForBooking);

module.exports = router;