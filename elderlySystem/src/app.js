// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Database
const sequelize = require('./config/database');

// LOAD MODELS
require('./models/incident.model');
require('./models/booking.model');
require('./models/activity.model');
require('./models/activityJoin.model');

// Routes
const incidentRoutes = require('./routes/incident.routes');
const bookingRoutes = require('./routes/booking.routes');
const authRoutes = require('./routes/auth.routes');
const activityRoutes = require('./routes/activity.routes');
const scheduleRoutes = require('./routes/schedule.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/incidents', incidentRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/schedule', scheduleRoutes);

// Test route (optional but useful)
app.get('/', (req, res) => {
    res.send('Elderly System API is running');
});

// Database connection + server start
const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        await sequelize.sync();
        console.log('Database synchronized');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
    }
})();
