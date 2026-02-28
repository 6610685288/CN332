const Activity = require('../models/activity.model');
const ActivityJoin = require('../models/activityJoin.model');


// 1️⃣ Get all activities
exports.getActivities = async (req, res) => {
    try {
        const activities = await Activity.findAll();

        const formatted = activities.map(a => ({
            id: a.id,
            name: a.name,
            time: new Date(a.date).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            location: "สโมสร",
            seats: 20,
            joined: 0,
            icon: "🧘‍♂️"
        }));

        res.json(formatted);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching activities' });
    }
};


exports.joinActivity = async (req, res) => {
    try {
        const { elderlyId, activityId } = req.body;

        if (!elderlyId || !activityId) {
            return res.status(400).json({ message: 'elderlyId and activityId are required' });
        }

        // 🔎 Check if activity exists
        const activity = await Activity.findByPk(activityId);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        // 🔎 Check if already joined
        const existingJoin = await ActivityJoin.findOne({
            where: { elderlyId, activityId }
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