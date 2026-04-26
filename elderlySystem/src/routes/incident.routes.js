const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// Incident reporting requires authentication
router.post('/create', authMiddleware, incidentController.createIncident);

// Admin: view all incidents
router.get('/all', authMiddleware, roleCheck(['admin', 'staff']), incidentController.getAllIncidents);

module.exports = router;
