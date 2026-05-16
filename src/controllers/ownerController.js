const Court = require('../models/Court');

function parsePricePerHour(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const n = Number(value);
    return Number.isNaN(n) ? NaN : n;
}

function resolveImageUrl(req) {
    const uploadedFile = req.files?.image?.[0] || req.file;
    if (uploadedFile?.filename) {
        return `/uploads/courts/${uploadedFile.filename}`;
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
        console.error('Error adding court:', error);
        res.status(500).json({ message: error.message || 'Failed to add court' });
    }
};

// Get all courts for the logged-in owner
exports.getCourts = async (req, res) => {
    try {
        const userId = req.user.id;

        const courts = await Court.find({ user: userId });

        res.status(200).json({
            courts: courts.map((court) => courtResponseDoc(court))
        });
    } catch (error) {
        console.error('Error fetching owner courts:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch courts' });
    }
};

// Update court details
exports.updateCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { name, location, surface, description, isActive } = req.body;
        const pricePerHour = parsePricePerHour(req.body.pricePerHour);
        const userId = req.user.id;

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

        // secondary images are no longer supported; ignore related fields

        await court.save();

        res.status(200).json({
            message: 'Court updated successfully',
            court: courtResponseDoc(court)
        });
    } catch (error) {
        console.error('Error updating court:', error);
        res.status(500).json({ message: error.message || 'Failed to update court' });
    }
};

// Delete a court
exports.deleteCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const userId = req.user.id;

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
        console.error('Error deleting court:', error);
        res.status(500).json({ message: error.message || 'Failed to delete court' });
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
        console.error('Error fetching court by ID:', error);
        res.status(500).json({ message: error.message || 'Failed to fetch court' });
    }
};
