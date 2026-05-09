const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');

const courtRoutes = require('./routes/courtRoutes');

const ownerRoutes = require('./routes/ownerRoutes');


const app = express();


connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/bookings', bookingRoutes);
app.use('/owner', ownerRoutes);
app.use('/courts', courtRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});


app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app;