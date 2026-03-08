const express = require('express');
const router = express.Router();

const activityController = require('../controllers/activity.controller');


// GET all activities
router.get('/', activityController.getActivities);
// GET my joined activities
router.get('/my/:elderlyId', activityController.getMyActivities);


router.post('/', activityController.createActivity);
// POST join activity
router.post('/join', activityController.joinActivity);

router.post('/leave', activityController.leaveActivity);

module.exports = router;