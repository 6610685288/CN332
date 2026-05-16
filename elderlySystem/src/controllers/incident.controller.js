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

        // Fetch User to get displayName instead of showing raw elderlyId
        const User = require('../models/user.model');
        const userRec = await User.findOne({ where: { elderlyId } });
        const displayName = userRec ? (userRec.name || userRec.username) : elderlyId;

        if (type === "fall" || type === "sos") {
            await sendEmail(
                "oungzazahaha@gmail.com",
                type === 'sos' ? '🆘 SOS แจ้งเหตุฉุกเฉิน' : "🚨 Fall Detected Alert",
                `${type === 'sos' ? 'ผู้สูงอายุกดปุ่ม SOS!' : 'Fall detected!'}

Sensor ID: ${sensorId || 'SOS_MANUAL'}
Elderly Name/ID: ${displayName}
Location: ${location || 'ไม่ระบุ'}
Type: ${type}

Please check immediately.`
            );
            
            // Notify Admins and Staff inside the system
            try {
                const { Op } = require('sequelize');
                const User = require('../models/user.model');
                const Notification = require('../models/notification.model');
                
                const adminUsers = await User.findAll({
                    where: {
                        role: { [Op.in]: ['admin', 'staff'] }
                    }
                });
                const notifications = adminUsers.map(admin => ({
                    elderlyId: admin.elderlyId,
                    title: type === 'sos' ? '🆘 ผู้ใช้งานกดปุ่มฉุกเฉิน!' : '🚨 ตรวจพบการล้ม!',
                    message: `ผู้ใช้ ${displayName} ต้องการความช่วยเหลือด่วน\nสถานที่: ${location || 'ไม่ระบุ'}`
                }));
                await Notification.bulkCreate(notifications);
            } catch (e) {
                console.error('Failed to notify admin via system:', e);
            }
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