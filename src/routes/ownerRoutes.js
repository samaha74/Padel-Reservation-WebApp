const router = require('express').Router();
const ownerController = require('../controllers/ownerController');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const uploadCourtImage = require('../middleware/uploadCourtImage');

/**
 * @openapi
 * tags:
 *   - name: Owner
 *     description: Owner court management endpoints
 *
 * /owner/courts:
 *   get:
 *     summary: Get all courts for the logged-in owner
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Owner courts list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Court'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *   post:
 *     summary: Add a new court as an owner
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               pricePerHour:
 *                 type: number
 *               surface:
 *                 type: string
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Court added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourtResponse'
 *       '400':
 *         description: Invalid court data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *
 * /owner/courts/{courtId}:
 *   get:
 *     summary: Get details for an owner court by ID
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courtId
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
 *               $ref: '#/components/schemas/OwnerCourtResponse'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Court not found
 *   put:
 *     summary: Update a court owned by the authenticated owner
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courtId
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               pricePerHour:
 *                 type: number
 *               surface:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               imageUrl:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Court updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OwnerCourtResponse'
 *       '400':
 *         description: Invalid court data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Court not found
 *   delete:
 *     summary: Delete a court owned by the authenticated owner
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courtId
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID
 *     responses:
 *       '200':
 *         description: Court deleted successfully
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Court not found
 *
 * /owner/courts/{courtId}/bookings:
 *   get:
 *     summary: Get bookings for a specific owner court
 *     tags:
 *       - Owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courtId
 *         required: true
 *         schema:
 *           type: string
 *         description: Court ID
 *     responses:
 *       '200':
 *         description: Court bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingListResponse'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Court not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// authentication Owner role
router.use(authenticate);

router.post('/courts', authorize('Owner'), uploadCourtImage, ownerController.addCourt);
router.get('/courts', ownerController.getCourts);
router.put('/courts/:courtId', authorize('Owner'), uploadCourtImage, ownerController.updateCourt);  
router.delete('/courts/:courtId', authorize('Owner'), ownerController.deleteCourt);  
router.get('/courts/:courtId',  ownerController.getCourtById);  
router.get('/courts/:courtId/bookings', (req, res) => {
    req.query.courtId = req.params.courtId;
    return bookingController.getBookingsByCourtId(req, res);
}); 

module.exports = router;
