const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const connectDB = require('./config/database');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');

const courtRoutes = require('./routes/courtRoutes');

const ownerRoutes = require('./routes/ownerRoutes');

const userRoutes = require('./routes/userRoutes');     

const reviewRoutes = require('./routes/reviewRoutes');  


const app = express();


connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/auth', authRoutes);
app.use('/user', userRoutes);      
app.use('/bookings', bookingRoutes);
app.use('/reviews', reviewRoutes); 
app.use('/owner', ownerRoutes);
app.use('/courts', courtRoutes);

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


app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;