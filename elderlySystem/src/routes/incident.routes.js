const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');

// Define your routes
router.post('/create', incidentController.createIncident);  // Example endpoint

module.exports = router;
