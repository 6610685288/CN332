const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected - elderlyId comes from JWT token
router.get('/', authMiddleware, scheduleController.getMySchedule);

module.exports = router;