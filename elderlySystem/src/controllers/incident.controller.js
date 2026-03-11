const Incident = require('../models/incident.model');
const { sendEmail } = require("../services/email.service");

exports.createIncident = async (req, res) => {
    try {
        const { sensorId, elderlyId, location, type } = req.body;

        const newIncident = await Incident.create({
            sensorId,
            elderlyId,
            location,
            type
        });

        if (type === "fall") {
            await sendEmail(
                "oungzazahaha@gmail.com",
                "🚨 Fall Detected Alert",
                `Fall detected!

Sensor ID: ${sensorId}
Elderly ID: ${elderlyId}
Location: ${location}
Type: ${type}

Please check immediately.`
            );
        }

        res.status(201).json(newIncident);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating incident" });
    }
};