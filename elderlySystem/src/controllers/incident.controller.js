exports.createIncident = (req, res) => {
    const { sensorId, elderlyId, location, type } = req.body;
    // Add your logic here, like saving to the DB
    res.status(201).json({ message: "Incident Created" });
};
