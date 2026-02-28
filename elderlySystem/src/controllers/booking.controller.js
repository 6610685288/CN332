const Booking = require('../models/booking.model');

exports.createBooking = async (req, res) => {
    try {
        const {
            elderlyId,
            destination,
            scheduledTime,
            passengers,
            wheelchair,
            helper
        } = req.body;

        const newBooking = await Booking.create({
            elderlyId,
            destination,
            scheduledTime,
            passengers,
            wheelchair,
            helper
        });

        res.status(201).json(newBooking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating booking" });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const { elderlyId } = req.params;

        const bookings = await Booking.findAll({
            where: { elderlyId },
            order: [['createdAt', 'DESC']]
        });

        res.json(bookings);
    } catch (error) {
        console.error("GET BOOKINGS ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};