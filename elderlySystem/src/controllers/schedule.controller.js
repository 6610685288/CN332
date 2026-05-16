const Booking = require('../models/booking.model');
const ActivityJoin = require('../models/activityJoin.model');
const Activity = require('../models/activity.model');
const Note = require('../models/note.model');

exports.getMySchedule = async (req, res) => {
    try {
        // elderlyId from JWT token
        const elderlyId = req.user.elderlyId;

        // 1️⃣ Get bookings
        const bookings = await Booking.findAll({
            where: { elderlyId },
            order: [['scheduledTime', 'ASC']]
        });

        // 2️⃣ Get joined activity IDs
        const joins = await ActivityJoin.findAll({
            where: { elderlyId }
        });

        const activityIds = joins.map(j => j.activityId);

        // 3️⃣ Fetch activity details (only if there are any joins)
        const activities = activityIds.length > 0
            ? await Activity.findAll({ where: { id: activityIds }, order: [['date', 'ASC']] })
            : [];

        const formattedActivities = activities.map(a => ({
            type: 'activity',
            title: `กิจกรรม: ${a.name}`,
            detail: `วันที่: ${new Date(a.date).toLocaleDateString('th-TH')} | สถานที่: ${a.location}`,
            timestamp: a.date,
            status: 'joined'
        }));

        const formattedBookings = bookings.map(b => ({
            type: 'vehicle',
            title: `จองรถไป ${b.destination}`,
            detail: `เวลา: ${b.scheduledTime} | ผู้โดยสาร: ${b.passengers} คน`,
            timestamp: b.createdAt,
            status: b.status
        }));

        // 4️⃣ Get notes
        const notes = await Note.findAll({
            where: { elderlyId }
        });

        const formattedNotes = notes.map(n => ({
            type: 'note',
            title: `โน้ต: ${n.title}`,
            detail: n.detail || '',
            timestamp: n.scheduledTime,
            status: 'note'
        }));

        // Combine and sort by timestamp
        const combined = [...formattedBookings, ...formattedActivities, ...formattedNotes].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        res.json(combined);

    } catch (error) {
        console.error('GET SCHEDULE ERROR:', error);
        res.status(500).json({ message: 'Error loading schedule' });
    }
};