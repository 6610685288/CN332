const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

router.get('/my', authMiddleware, notificationController.getMyNotifications);
router.patch('/read-all', authMiddleware, notificationController.markAllAsRead);
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);
router.post('/send', [authMiddleware, roleCheck(['admin', 'staff'])], notificationController.sendNotification);

module.exports = router;
