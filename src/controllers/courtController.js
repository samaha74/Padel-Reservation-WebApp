const Court = require('../models/Court');
const Review = require('../models/Reviews');

// GET all courts (with filters: name, location, price)
const getCourts = async (req, res) => {
    try {
        const { name, location, price } = req.query;

        let filter = {};

        // ✅ FIX: search by name (case-insensitive partial match)
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }

        // filter by location (case-insensitive partial match)
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        // filter by max price
        if (price) {
            filter.pricePerHour = { $lte: Number(price) };
        }

        const courts = await Court.find(filter);

        // ✅ FIX: attach avgRating and reviewCount from Reviews collection
        const courtsWithRatings = await Promise.all(
            courts.map(async (court) => {
                const reviews = await Review.find({ court: court._id });
                const avgRating =
                    reviews.length > 0
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                        : null;

                return {
                    ...court.toObject(),
                    avgRating,
                    reviewCount: reviews.length,
                };
            })
        );

        res.json(courtsWithRatings);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET court by id (with avgRating + reviews)
const getCourtById = async (req, res) => {
    try {
        const court = await Court.findById(req.params.id);

        if (!court) {
            return res.status(404).json({ message: "Court not found" });
        }

        // ✅ FIX: compute avgRating and attach full reviews with user info
        const reviews = await Review.find({ court: court._id }).populate('user', 'name');
        const avgRating =
            reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : null;

        res.json({
            ...court.toObject(),
            avgRating,
            reviewCount: reviews.length,
            reviews,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCourts,
    getCourtById
};