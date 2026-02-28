const Booking = require('../models/booking.model');
const ActivityJoin = require('../models/activityJoin.model');
const Activity = require('../models/activity.model');

exports.getMySchedule = async (req, res) => {
    try {
        const { elderlyId } = req.params;

        // 1️⃣ Get bookings
        const bookings = await Booking.findAll({
            where: { elderlyId }
        });

        // 2️⃣ Get joined activities
        const joins = await ActivityJoin.findAll({
            where: { elderlyId }
        });

        const activityIds = joins.map(j => j.activityId);

        const activities = await Activity.findAll({
            where: { id: activityIds }
        });

        // 3️⃣ Format activities like booking format
        const formattedActivities = activities.map(a => ({
            type: 'activity',
            title: `กิจกรรม: ${a.name}`,
            detail: `วันที่: ${new Date(a.date).toLocaleDateString()}`,
            timestamp: a.createdAt,
            status: 'joined'
        }));

        const formattedBookings = bookings.map(b => ({
            type: 'vehicle',
            title: `จองรถไป ${b.destination}`,
            detail: `เวลา: ${b.scheduledTime} | ผู้โดยสาร: ${b.passengers} คน`,
            timestamp: b.createdAt,
            status: b.status
        }));

        const combined = [...formattedBookings, ...formattedActivities];

        res.json(combined);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error loading schedule' });
    }
};