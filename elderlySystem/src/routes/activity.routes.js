const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Public: view all activities (elderlyId from token if logged in)
router.get('/', authMiddleware, activityController.getActivities);

// Protected: user-specific actions
router.get('/my', authMiddleware, activityController.getMyActivities);
router.post('/join', authMiddleware, activityController.joinActivity);
router.post('/leave', authMiddleware, activityController.leaveActivity);

// Create activity (admin/staff only)
router.post('/', authMiddleware, roleCheck(['admin', 'staff']), activityController.createActivity);

// Update / Delete activity (admin/staff only)
router.put('/:id', authMiddleware, roleCheck(['admin', 'staff']), activityController.updateActivity);
router.delete('/:id', authMiddleware, roleCheck(['admin', 'staff']), activityController.deleteActivity);

module.exports = router;