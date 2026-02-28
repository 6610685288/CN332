const Incident = require('../models/incident.model');

exports.createIncident = async (req, res) => {
    try {
        const { sensorId, elderlyId, location, type } = req.body;

        const newIncident = await Incident.create({
            sensorId,
            elderlyId,
            location,
            type
        });

        res.status(201).json(newIncident);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating incident" });
    }
};