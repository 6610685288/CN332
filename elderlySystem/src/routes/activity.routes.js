const express = require('express');
const router = express.Router();

const activityController = require('../controllers/activity.controller');

router.post('/', activityController.createActivity);

// GET all activities
router.get('/', activityController.getActivities);

// POST join activity
router.post('/join', activityController.joinActivity);

// GET my joined activities
router.get('/my/:elderlyId', activityController.getMyActivities);


module.exports = router;