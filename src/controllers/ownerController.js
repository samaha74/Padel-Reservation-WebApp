const Court = require('../models/Court');

function parsePricePerHour(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const n = Number(value);
    return Number.isNaN(n) ? NaN : n;
}

function resolveImageUrl(req) {
    if (req.file) {
        return `/uploads/courts/${req.file.filename}`;
    }
    if (typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim() !== '') {
        return req.body.imageUrl.trim();
    }
    return null;
}

function courtResponseDoc(court) {
    return {
        id: court._id,
        name: court.name,
        location: court.location,
        pricePerHour: court.pricePerHour,
        surface: court.surface,
        description: court.description,
        imageUrl: court.imageUrl || '',
        secondaryImages: court.secondaryImages || [],
        isActive: court.isActive,
        createdAt: court.createdAt
    };
}

// Add a new court
exports.addCourt = async (req, res) => {
    try {
        const { name, location, surface, description } = req.body;
        const pricePerHour = parsePricePerHour(req.body.pricePerHour);
        const userId = req.user.id;

        if (!name || !location || pricePerHour === undefined || Number.isNaN(pricePerHour)) {
            return res.status(400).json({
                message: 'Name, location, and price per hour are required'
            });
        }

        if (req.user.role !== 'Owner') {
            return res.status(403).json({
                message: 'Only court owners can add courts'
            });
        }

        const imageUrl = resolveImageUrl(req) || '';

        const newCourt = new Court({
            user: userId,
            name,
            location,
            pricePerHour,
            surface,
            description,
            imageUrl,
            isActive: true
        });

        await newCourt.save();

        res.status(201).json({
            message: 'Court added successfully',
            court: courtResponseDoc(newCourt)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all courts for the logged-in owner
exports.getCourts = async (req, res) => {
    try {
        const userId = req.user.id;

        if (req.user.role !== 'Owner') {
            return res.status(403).json({
                message: 'Only court owners can view courts'
            });
        }

        const courts = await Court.find({ user: userId }).populate('user', 'name email');

        res.status(200).json({
            courts: courts.map((court) => courtResponseDoc(court))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update court details
exports.updateCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { name, location, surface, description, isActive } = req.body;
        const pricePerHour = parsePricePerHour(req.body.pricePerHour);
        const userId = req.user.id;

        if (req.user.role !== 'Owner') {
            return res.status(403).json({
                message: 'Only court owners can update courts'
            });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ message: 'Court not found' });
        }

        if (court.user.toString() !== userId) {
            return res.status(403).json({
                message: 'You can only update your own courts'
            });
        }

        if (name) court.name = name;
        if (location) court.location = location;
        if (pricePerHour !== undefined && !Number.isNaN(pricePerHour)) {
            court.pricePerHour = pricePerHour;
        }
        if (surface !== undefined) court.surface = surface;
        if (description !== undefined) court.description = description;
        if (isActive !== undefined) {
            court.isActive = isActive === true || isActive === 'true';
        }

        const nextImage = resolveImageUrl(req);
        if (nextImage !== null) {
            court.imageUrl = nextImage;
        } else if (Object.prototype.hasOwnProperty.call(req.body, 'imageUrl')) {
            court.imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl : '';
        }

        await court.save();

        res.status(200).json({
            message: 'Court updated successfully',
            court: courtResponseDoc(court)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a court
exports.deleteCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const userId = req.user.id;

        if (req.user.role !== 'Owner') {
            return res.status(403).json({
                message: 'Only court owners can delete courts'
            });
        }

        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ message: 'Court not found' });
        }

        if (court.user.toString() !== userId) {
            return res.status(403).json({
                message: 'You can only delete your own courts'
            });
        }

        await Court.findByIdAndDelete(courtId);

        res.status(200).json({ message: 'Court deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// get court by id
exports.getCourtById = async (req, res) => {
    try {
        const { courtId } = req.params;
        const court = await Court.findById(courtId);

        if (!court) {
            return res.status(404).json({ message: 'Court not found' });
        }
        res.status(200).json({
            court: courtResponseDoc(court)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
