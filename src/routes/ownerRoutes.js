const router = require('express').Router();
const ownerController = require('../controllers/ownerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and Owner role
router.use(authenticate);
router.use(authorize('Owner'));

router.post('/courts', ownerController.addCourt);      // → /owner/courts ✓
router.get('/courts', ownerController.getCourts);      // → /owner/courts ✓
router.put('/courts/:courtId', ownerController.updateCourt);    // → /owner/courts/:courtId ✓
router.delete('/courts/:courtId', ownerController.deleteCourt);  // → /owner/courts/:courtId ✓

module.exports = router;
