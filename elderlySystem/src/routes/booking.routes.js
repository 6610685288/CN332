const express = require('express');
const router = express.Router();
// Import the booking controller (the handler)
const bookingController = require('../controllers/booking.controller');

// Define your route handlers correctly
router.post('/create', bookingController.createBooking);
router.get('/my-bookings/:elderlyId', bookingController.getMyBookings);

module.exports = router;
