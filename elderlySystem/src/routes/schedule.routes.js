const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

router.get('/:elderlyId', scheduleController.getMySchedule);

module.exports = router;