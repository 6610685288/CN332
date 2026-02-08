const express = require('express');
const router = express.Router();

// Import the booking controller (the handler)
const bookingController = require('../controllers/booking.controller');

// Define your route handlers correctly
router.post('/create', bookingController.createBooking);  // Make sure the function exists

module.exports = router;
