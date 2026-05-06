const express = require('express');
const router = express.Router();
const Court = require('../models/Court');
router.get('/', async (req, res) => {
    try {
        const courts = await Court.find();
        res.json(courts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;