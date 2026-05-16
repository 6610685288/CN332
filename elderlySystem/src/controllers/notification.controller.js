const Notification = require('../models/notification.model');
const User = require('../models/user.model');

// User: Get my notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId;
        const notifications = await Notification.findAll({
            where: { elderlyId },
            order: [['createdAt', 'DESC']]
        });
        res.json(notifications);
    } catch (error) {
        console.error('GET NOTIFICATIONS ERROR:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

// User: Mark as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const elderlyId = req.user.elderlyId;
        
        const notification = await Notification.findOne({ where: { id, elderlyId } });
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        
        notification.isRead = true;
        await notification.save();
        
        res.json({ message: 'Marked as read', notification });
    } catch (error) {
        console.error('MARK AS READ ERROR:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
};

// Admin: Send notification
exports.sendNotification = async (req, res) => {
    try {
        const { elderlyId, title, message } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }
        
        if (elderlyId === 'all') {
            const users = await User.findAll();
            const notifications = users.map(u => ({
                elderlyId: u.elderlyId,
                title,
                message
            }));
            await Notification.bulkCreate(notifications);
            return res.json({ message: `Sent to ${users.length} users` });
        } else if (elderlyId.startsWith('role:')) {
            const role = elderlyId.split(':')[1];
            const users = await User.findAll({ where: { role } });
            const notifications = users.map(u => ({
                elderlyId: u.elderlyId,
                title,
                message
            }));
            await Notification.bulkCreate(notifications);
            return res.json({ message: `Sent to ${users.length} ${role}s` });
        } else {
            const user = await User.findOne({ where: { elderlyId } });
            if (!user) return res.status(404).json({ message: 'User not found' });
            
            const notification = await Notification.create({
                elderlyId,
                title,
                message
            });
            return res.json({ message: 'Sent successfully', notification });
        }
    } catch (error) {
        console.error('SEND NOTIFICATION ERROR:', error);
        res.status(500).json({ message: 'Error sending notification' });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId;
        await Notification.update(
            { isRead: true },
            { where: { elderlyId, isRead: false } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('MARK ALL READ ERROR:', error);
        res.status(500).json({ message: 'Error marking notifications as read' });
    }
};
