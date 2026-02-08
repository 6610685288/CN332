const express = require('express');
const router = express.Router();

// Import your auth controller
const authController = require('../controllers/auth.controller');

// Define your route handlers
router.post('/login', authController.login);  // Make sure authController.login exists
router.post('/register', authController.register);  // If you're using a register route, too

module.exports = router;
