import { Router } from 'express';
import * as noteController from './note_controller.js';
import { protect } from '../middleware/auth_middleware.js';

const router = Router();

// POST /api/notes (Create)
router.post('/', protect, noteController.createNote);

// GET /api/notes (Read all)
router.get('/', protect, noteController.getNotes);

// GET /api/notes/:id (Read single)
router.get('/:id', protect, noteController.getNote);

// PUT /api/notes/:id (Update)
router.put('/:id', protect, noteController.updateNote);

// DELETE /api/notes/:id (Delete)
router.delete('/:id', protect, noteController.deleteNote);

export default router;