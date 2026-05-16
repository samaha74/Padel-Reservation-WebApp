const express = require('express');
const router = express.Router();


const {
  getCourts,
  getCourtById
} = require('../controllers/courtController');

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


// GET all courts (with filters + ratings)
router.get('/', getCourts);

// GET court by id (with reviews + avgRating)
router.get('/:id', getCourtById);

module.exports = router;