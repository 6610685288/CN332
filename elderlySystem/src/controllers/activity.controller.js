const Activity = require('../models/activity.model');
const ActivityJoin = require('../models/activityJoin.model');


// 1️⃣ Get all activities
exports.getActivities = async (req, res) => {
    try {
        const elderlyId = req.query.elderlyId;

        const activities = await Activity.findAll();

        const formatted = await Promise.all(
            activities.map(async (a) => {

                const joinedCount = await ActivityJoin.count({
                    where: { activityId: a.id }
                });

                let existingJoin = null;

                if (elderlyId) {
                    existingJoin = await ActivityJoin.findOne({
                        where: {
                            elderlyId: elderlyId,
                            activityId: a.id
                        }
                    });
                }

                return {
                    id: a.id,
                    name: a.name,
                    time: new Date(a.date).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    location: "สโมสร",
                    seats: 20,
                    joined: joinedCount,
                    hasJoined: existingJoin ? true : false,
                    icon: "🧘‍♂️"
                };
            })
        );

        res.json(formatted);

    } catch (error) {
        console.error("GET ACTIVITIES ERROR:", error);
        res.status(500).json({ message: 'Error fetching activities' });
    }
};


exports.joinActivity = async (req, res) => {
    try {
        const elderlyId = req.body.elderlyId;
        const activityId = parseInt(req.body.activityId);

        if (!elderlyId || !activityId) {
            return res.status(400).json({ message: 'elderlyId and activityId are required' });
        }

        // 🔎 Check if activity exists
        const activity = await Activity.findByPk(activityId);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        const joinedCount = await ActivityJoin.count({
            where: { activityId }
        });

        const maxSeats = 20;

        if (joinedCount >= maxSeats) {
            return res.status(400).json({ message: 'Activity is full' });
        }

        // 🔎 Check if already joined
        const existingJoin = await ActivityJoin.findOne({
            where: {
                elderlyId: elderlyId,
                activityId: activityId
            }
        });

        if (existingJoin) {
            return res.status(400).json({ message: 'Already joined this activity' });
        }

        const join = await ActivityJoin.create({
            elderlyId,
            activityId
        });

        res.status(201).json(join);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error joining activity' });
    }
};


// 3️⃣ Get my activities
exports.getMyActivities = async (req, res) => {
    try {
        const { elderlyId } = req.params;

        const joins = await ActivityJoin.findAll({
            where: { elderlyId }
        });

        res.json(joins);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching joined activities' });
    }
};

// 4️⃣ Create new activity
exports.createActivity = async (req, res) => {
    try {
        const { name, description, date } = req.body;

        if (!name || !date) {
            return res.status(400).json({ message: 'Name and date are required' });
        }

        const activity = await Activity.create({
            name,
            description,
            date
        });

        res.status(201).json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating activity' });
    }
};

// 5️⃣ Leave activity
exports.leaveActivity = async (req, res) => {
    try {
        const elderlyId = req.body.elderlyId;
        const activityId = parseInt(req.body.activityId);

        const join = await ActivityJoin.findOne({
            where: { elderlyId, activityId }
        });

        if (!join) {
            return res.status(404).json({ message: 'Join record not found' });
        }

        await join.destroy();

        res.json({ message: 'Left activity successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error leaving activity' });
    }
};