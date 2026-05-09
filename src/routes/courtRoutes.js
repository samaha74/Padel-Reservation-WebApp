const express = require('express');
const router = express.Router();
const Court = require('../models/Court');


// =========================
// GET ALL COURTS + FILTERS
// =========================
router.get('/', async (req, res) => {
    try {
        const { location, price } = req.query;

        let filter = {};

        // filter by location (exact match)
        if (location) {
            filter.location = location;
        }

        // filter by max price
        if (price) {
            filter.pricePerHour = { $lte: Number(price) };
        }

        const courts = await Court.find(filter);
        res.json(courts);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// =========================
// GET COURT BY ID
// =========================
router.get('/:id', async (req, res) => {
    try {
        const court = await Court.findById(req.params.id);

        if (!court) {
            return res.status(404).json({ message: "Court not found" });
        }

        res.json(court);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// export router
module.exports = router;