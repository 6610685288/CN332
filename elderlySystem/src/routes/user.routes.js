const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// User routes (Own profile)
router.patch('/me', authMiddleware, userController.updateProfile);


// Admin only routes
router.get('/all', authMiddleware, roleCheck(['admin']), userController.getAllUsers);
router.patch('/:id/role', authMiddleware, roleCheck(['admin']), userController.updateUserRole);

module.exports = router;
