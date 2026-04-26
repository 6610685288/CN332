const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Public/User routes
router.get('/my-bookings', authMiddleware, bookingController.getMyBookings);
router.post('/create', authMiddleware, bookingController.createBooking);
router.patch('/:id/cancel', authMiddleware, bookingController.cancelBooking);

// Admin routes
router.get('/all', authMiddleware, roleCheck(['admin', 'staff']), bookingController.getAllBookings);
router.patch('/:id/status', authMiddleware, roleCheck(['admin', 'staff']), bookingController.updateBookingStatus);

module.exports = router;
