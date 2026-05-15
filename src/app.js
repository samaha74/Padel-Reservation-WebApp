const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const courtRoutes = require('./routes/courtRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

// ✅ PAYMENT ROUTES (NEW)
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/owner', ownerRoutes);
app.use('/courts', courtRoutes);

// ✅ PAYMENT ENDPOINTS
app.use('/payment', paymentRoutes);

// error handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Image too large (max 5MB)' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err && err.message === 'Only JPEG, PNG, GIF, or WebP images are allowed') {
        return res.status(400).json({ message: err.message });
    }

    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;