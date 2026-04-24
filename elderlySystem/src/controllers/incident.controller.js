const Incident = require('../models/incident.model');
const { sendEmail } = require("../services/email.service");

exports.createIncident = async (req, res) => {
    try {
        const { sensorId, location, type } = req.body;
        // elderlyId มาจาก JWT token (ปลอดภัยกว่า body)
        const elderlyId = req.user ? req.user.elderlyId : req.body.elderlyId;

        const newIncident = await Incident.create({
            sensorId: sensorId || 'SOS_MANUAL',
            elderlyId,
            location: location || 'ไม่ระบุ',
            type: type || 'sos'
        });

        if (type === "fall" || type === "sos") {
            await sendEmail(
                "oungzazahaha@gmail.com",
                type === 'sos' ? '🆘 SOS แจ้งเหตุฉุกเฉิน' : "🚨 Fall Detected Alert",
                `${type === 'sos' ? 'ผู้สูงอายุกดปุ่ม SOS!' : 'Fall detected!'}

Sensor ID: ${sensorId || 'SOS_MANUAL'}
Elderly ID: ${elderlyId}
Location: ${location || 'ไม่ระบุ'}
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

exports.getAllIncidents = async (req, res) => {
    try {
        const incidents = await Incident.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(incidents);
    } catch (error) {
        console.error('GET ALL INCIDENTS ERROR:', error);
        res.status(500).json({ message: 'Error fetching incidents' });
    }
};