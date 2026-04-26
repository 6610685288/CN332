const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/social-login', authController.socialLogin);

// Protected route - get current user info
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
