const router = require('express').Router();
const ownerController = require('../controllers/ownerController');
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// authentication Owner role
router.use(authenticate);

router.post('/courts',authorize('Owner'), ownerController.addCourt);     
router.get('/courts', ownerController.getCourts);    
router.put('/courts/:courtId', authorize('Owner'), ownerController.updateCourt);  
router.delete('/courts/:courtId', authorize('Owner'), ownerController.deleteCourt);  
router.get('/courts/:courtId',  ownerController.getCourtById);  
router.get('/courts/:courtId/bookings', (req, res) => {
    req.query.courtId = req.params.courtId;
    return bookingController.getBookingsByCourtId(req, res);
}); 

module.exports = router;
