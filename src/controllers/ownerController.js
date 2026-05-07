const Court = require('../models/Court');

// Add a new court
exports.addCourt = async (req, res) => {
    try {
        const { name, location, pricePerHour, surface, description } = req.body;
        const userId = req.user.id;

        if (!name || !location || pricePerHour === undefined) {
            return res.status(400).json({ 
                message: 'Name, location, and price per hour are required' 
            });
        }

        if (req.user.role !== 'Owner') {
            return res.status(403).json({ 
                message: 'Only court owners can add courts' 
            });
        }

        const newCourt = new Court({
            user: userId,
            name,
            location,
            pricePerHour,
            surface,
            description,
            isActive: true
        });

        await newCourt.save();

        res.status(201).json({
            message: 'Court added successfully',
            court: {
                id: newCourt._id,
                name: newCourt.name,
                location: newCourt.location,
                pricePerHour: newCourt.pricePerHour,
                surface: newCourt.surface,
                description: newCourt.description,
                isActive: newCourt.isActive,
                createdAt: newCourt.createdAt
            }
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
            courts: courts.map(court => ({
                id: court._id,
                name: court.name,
                location: court.location,
                pricePerHour: court.pricePerHour,
                surface: court.surface,
                description: court.description,
                isActive: court.isActive,
                createdAt: court.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update court details
exports.updateCourt = async (req, res) => {
    try {
        const { courtId } = req.params;
        const { name, location, pricePerHour, surface, description, isActive } = req.body;
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
        if (pricePerHour !== undefined) court.pricePerHour = pricePerHour;
        if (surface) court.surface = surface;
        if (description) court.description = description;
        if (isActive !== undefined) court.isActive = isActive;

        await court.save();

        res.status(200).json({
            message: 'Court updated successfully',
            court: {
                id: court._id,
                name: court.name,
                location: court.location,
                pricePerHour: court.pricePerHour,
                surface: court.surface,
                description: court.description,
                isActive: court.isActive
            }
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
            court: {
                id: court._id,
                name: court.name,
                location: court.location,
                pricePerHour: court.pricePerHour,
                surface: court.surface,
                description: court.description,
                isActive: court.isActive,
                createdAt: court.createdAt,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};