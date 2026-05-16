const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/my', authMiddleware, noteController.getMyNotes);
router.post('/', authMiddleware, noteController.createNote);
router.delete('/:id', authMiddleware, noteController.deleteNote);

module.exports = router;
