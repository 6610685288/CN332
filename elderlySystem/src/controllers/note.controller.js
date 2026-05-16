const Note = require('../models/note.model');

exports.getMyNotes = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId;
        const notes = await Note.findAll({
            where: { elderlyId },
            order: [['scheduledTime', 'ASC']]
        });
        res.json(notes);
    } catch (error) {
        console.error('GET MY NOTES ERROR:', error);
        res.status(500).json({ message: 'Error fetching notes' });
    }
};

exports.createNote = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId;
        const { title, detail, scheduledTime } = req.body;

        if (!title || !scheduledTime) {
            return res.status(400).json({ message: "Title and scheduledTime are required" });
        }

        const newNote = await Note.create({
            elderlyId,
            title,
            detail,
            scheduledTime
        });

        res.status(201).json(newNote);
    } catch (error) {
        console.error('CREATE NOTE ERROR:', error);
        res.status(500).json({ message: 'Error creating note' });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const elderlyId = req.user.elderlyId;
        const noteId = req.params.id;

        const note = await Note.findOne({ where: { id: noteId, elderlyId } });
        if (!note) {
            return res.status(404).json({ message: "Note not found or unauthorized" });
        }

        await note.destroy();
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error('DELETE NOTE ERROR:', error);
        res.status(500).json({ message: 'Error deleting note' });
    }
};
