// Ensure this function is exported
exports.createBooking = (req, res) => {
    // Add your logic here
    res.status(201).json({ message: "Booking Created" });
};
