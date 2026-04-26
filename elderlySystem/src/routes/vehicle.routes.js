const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// GET /api/vehicles
router.get('/', vehicleController.getAllVehicles);

// Admin: Update vehicle status
router.patch('/:id/status', authMiddleware, roleCheck(['admin', 'staff']), vehicleController.updateVehicleStatus);

module.exports = router;
