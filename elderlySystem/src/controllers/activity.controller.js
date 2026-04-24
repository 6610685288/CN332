const Activity = require('../models/activity.model');
const ActivityJoin = require('../models/activityJoin.model');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// 1️⃣ Get all activities (with joined count in 2 queries total, not N+1)
exports.getActivities = async (req, res) => {
    try {
        // elderlyId comes from JWT token if provided, fallback to query param
        const elderlyId = req.user ? req.user.elderlyId : req.query.elderlyId;

        // Fetch all activities
        const activities = await Activity.findAll();
        const activityIds = activities.map(a => a.id);

        // Batch fetch all join counts in ONE query
        const joinCounts = await ActivityJoin.findAll({
            attributes: ['activityId', [sequelize.fn('COUNT', sequelize.col('activityId')), 'count']],
            where: { activityId: activityIds },
            group: ['activityId'],
            raw: true
        });

        // Batch fetch user's joins in ONE query (if elderlyId exists)
        let userJoins = [];
        if (elderlyId) {
            userJoins = await ActivityJoin.findAll({
                where: { elderlyId, activityId: activityIds },
                raw: true
            });
        }

        const joinCountMap = {};
        joinCounts.forEach(j => { joinCountMap[j.activityId] = parseInt(j.count); });

        const userJoinSet = new Set(userJoins.map(j => j.activityId));

        const formatted = activities.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description,
            time: new Date(a.date).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            date: new Date(a.date).toLocaleDateString('th-TH'),
            location: a.location,
            seats: a.maxSeats,
            joined: joinCountMap[a.id] || 0,
            hasJoined: userJoinSet.has(a.id),
            icon: a.icon
        }));

        res.json(formatted);

    } catch (error) {
        console.error('GET ACTIVITIES ERROR:', error);
        res.status(500).json({ 
            message: 'Error fetching activities', 
            error: error.message // ส่งข้อความ Error จริงออกมาด้วย
        });
    }
};


// 2️⃣ Join activity
exports.joinActivity = async (req, res) => {
    try {
        // elderlyId from JWT token (not from body - prevents impersonation)
        const elderlyId = req.user.elderlyId;
        const activityId = parseInt(req.body.activityId);

        if (!activityId || isNaN(activityId)) {
            return res.status(400).json({ message: 'activityId is required and must be a number' });
        }

        // Check if activity exists
        const activity = await Activity.findByPk(activityId);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        // Check capacity
        const joinedCount = await ActivityJoin.count({ where: { activityId } });
        if (joinedCount >= activity.maxSeats) {
            return res.status(400).json({ message: 'Activity is full' });
        }

        // Check if already joined
        const existingJoin = await ActivityJoin.findOne({
            where: { elderlyId, activityId }
        });
        if (existingJoin) {
            return res.status(409).json({ message: 'Already joined this activity' });
        }

        const join = await ActivityJoin.create({ elderlyId, activityId });
        res.status(201).json(join);

    } catch (error) {
        console.error('JOIN ACTIVITY ERROR:', error);
        res.status(500).json({ message: 'Error joining activity' });
    }
};


// 3️⃣ Get my activities
exports.getMyActivities = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId; // from JWT

        const joins = await ActivityJoin.findAll({
            where: { elderlyId },
            include: [{ model: Activity }] // ดึงข้อมูลกิจกรรมพ่วงมาด้วย
        });

        res.json(joins);
    } catch (error) {
        console.error('GET MY ACTIVITIES ERROR:', error);
        res.status(500).json({ message: 'Error fetching joined activities' });
    }
};


// 4️⃣ Create new activity (staff/admin only)
exports.createActivity = async (req, res) => {
    try {
        const { name, description, date, maxSeats, location, icon } = req.body;

        if (!name || !date) {
            return res.status(400).json({ message: 'Name and date are required' });
        }

        const activity = await Activity.create({
            name,
            description,
            date,
            maxSeats: maxSeats || 20,
            location: location || 'สโมสร',
            icon: icon || '🧘‍♂️'
        });

        res.status(201).json(activity);
    } catch (error) {
        console.error('CREATE ACTIVITY ERROR:', error);
        res.status(500).json({ message: 'Error creating activity' });
    }
};


// 5️⃣ Leave activity
exports.leaveActivity = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId; // from JWT
        const activityId = parseInt(req.body.activityId);

        if (!activityId || isNaN(activityId)) {
            return res.status(400).json({ message: 'activityId is required and must be a number' });
        }

        const join = await ActivityJoin.findOne({
            where: { elderlyId, activityId }
        });

        if (!join) {
            return res.status(404).json({ message: 'You have not joined this activity' });
        }

        await join.destroy();
        res.json({ message: 'Left activity successfully' });

    } catch (error) {
        console.error('LEAVE ACTIVITY ERROR:', error);
        res.status(500).json({ message: 'Error leaving activity' });
    }
};


// 6️⃣ Update activity (admin/staff only)
exports.updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, date, maxSeats, location, icon } = req.body;

        const activity = await Activity.findByPk(id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        if (name !== undefined) activity.name = name;
        if (description !== undefined) activity.description = description;
        if (date !== undefined) activity.date = date;
        if (maxSeats !== undefined) activity.maxSeats = maxSeats;
        if (location !== undefined) activity.location = location;
        if (icon !== undefined) activity.icon = icon;

        await activity.save();
        res.json({ message: 'Activity updated successfully', activity });
    } catch (error) {
        console.error('UPDATE ACTIVITY ERROR:', error);
        res.status(500).json({ message: 'Error updating activity' });
    }
};


// 7️⃣ Delete activity (admin/staff only)
exports.deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await Activity.findByPk(id);
        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        // Remove all joins first
        await ActivityJoin.destroy({ where: { activityId: id } });
        await activity.destroy();

        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('DELETE ACTIVITY ERROR:', error);
        res.status(500).json({ message: 'Error deleting activity' });
    }
};