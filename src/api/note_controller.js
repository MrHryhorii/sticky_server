import * as noteService from '../services/note_service.js';
import { NoteSchema } from '../schemas/note_schema.js';

// Central handler for Zod errors
const handleZodError = (res, error) => {
    return res.status(400).json({ 
        message: 'Validation error in input data.', 
        errors: error.issues.map(issue => ({ path: issue.path[0], message: issue.message })) 
    });
};

// GET /api/notes
export const getNotes = async (req, res) => {
    try {
        // req.user.id is set by the 'protect' middleware!
        const userId = req.user.id; 
        const notes = await noteService.getAllNotes(userId);
        return res.status(200).json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// GET /api/notes/:id
export const getNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = parseInt(req.params.id);

        const note = await noteService.getNoteById(noteId, userId);

        if (!note) {
            // 404 Not Found: Note not found OR user does not own it
            return res.status(404).json({ message: 'Note not found.' });
        }
        return res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching single note:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /api/notes
export const createNote = async (req, res) => {
    try {
        // Zod Validation
        const validatedData = NoteSchema.parse(req.body);
        
        const userId = req.user.id;
        const noteId = await noteService.createNote(userId, validatedData);
        
        // 201 Created
        return res.status(201).json({ message: 'Note successfully created.', noteId });
    } catch (error) {
        if (error.name === 'ZodError') {
            return handleZodError(res, error);
        }
        console.error('Error creating note:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// PUT /api/notes/:id
export const updateNote = async (req, res) => {
    try {
        // Zod Validation
        const validatedData = NoteSchema.parse(req.body);
        
        const userId = req.user.id;
        const noteId = parseInt(req.params.id);

        // Check if note exists and is owned by the user before updating
        const existingNote = await noteService.getNoteById(noteId, userId);
        if (!existingNote) {
            return res.status(404).json({ message: 'Note not found or you do not own it.' });
        }

        await noteService.updateNote(noteId, userId, validatedData);

        // 200 OK
        return res.status(200).json({ message: 'Note successfully updated.' });
    } catch (error) {
        if (error.name === 'ZodError') {
            return handleZodError(res, error);
        }
        console.error('Error updating note:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const noteId = parseInt(req.params.id);

        // Check if note exists and is owned by the user before deleting
        const existingNote = await noteService.getNoteById(noteId, userId);
        if (!existingNote) {
            return res.status(404).json({ message: 'Note not found or you do not own it.' });
        }
        
        await noteService.deleteNote(noteId, userId);
        
        // 204 No Content (Successful deletion with no body)
        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};