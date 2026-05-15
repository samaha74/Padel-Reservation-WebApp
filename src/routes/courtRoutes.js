const express = require('express');
const router = express.Router();
const Court = require('../models/Court');

/**
 * @openapi
 * tags:
 *   - name: Courts
 *     description: Public court listings and details
 *
 * /courts:
 *   get:
 *     summary: Get all courts with optional filtering
 *     tags:
 *       - Courts
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Exact court location to filter by
 *       - in: query
 *         name: price
 *         schema:
 *           type: number
 *         description: Maximum price per hour to filter by
 *     responses:
 *       '200':
 *         description: List of courts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourtListResponse'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /courts/{id}:
 *   get:
 *     summary: Get court details by ID
 *     tags:
 *       - Courts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID
 *     responses:
 *       '200':
 *         description: Court details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Court'
 *       '404':
 *         description: Court not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

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