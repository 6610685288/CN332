const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcement.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public route to get current announcement
router.get('/', announcementController.getActive);

// Admin route to update announcement
router.post('/', authMiddleware, announcementController.updateActive);

module.exports = router;
