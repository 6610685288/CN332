const Announcement = require('../models/announcement.model');

// Get the current active announcement
exports.getActive = async (req, res) => {
    try {
        const announcement = await Announcement.findOne({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        });
        
        res.json(announcement || { message: "" });
    } catch (error) {
        console.error('GET ANNOUNCEMENT ERROR:', error);
        res.status(500).json({ error: 'Error fetching announcement' });
    }
};

// Update/Set new active announcement (Admin only)
exports.updateActive = async (req, res) => {
    try {
        // Validate role (Admin or Staff)
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const { message } = req.body;

        // Deactivate all previous announcements
        await Announcement.update({ isActive: false }, { where: { isActive: true } });

        // Create new active announcement (if message is provided and not empty)
        let newAnnouncement = null;
        if (message && message.trim() !== '') {
            newAnnouncement = await Announcement.create({
                message: message.trim(),
                isActive: true
            });
        }

        res.json({ message: "Announcement updated", data: newAnnouncement });
    } catch (error) {
        console.error('UPDATE ANNOUNCEMENT ERROR:', error);
        res.status(500).json({ error: 'Error updating announcement' });
    }
};
