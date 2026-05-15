const express = require('express');
const router = express.Router();

const {
  getCourts,
  getCourtById
} = require('../controllers/courtController');

// GET all courts (with filters + ratings)
router.get('/', getCourts);

// GET court by id (with reviews + avgRating)
router.get('/:id', getCourtById);

module.exports = router;