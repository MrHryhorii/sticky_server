import { Router } from 'express';
import * as adminController from './admin_controller.js';
import { protect } from '../middleware/auth_middleware.js';

const router = Router();

// GET /api/admin/users - Get list of all users
router.get('/users', protect, adminController.listUsers);

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminController.deleteUser);

// GET /api/admin/notes - Get list of all notes from all users
router.get('/notes', protect, adminController.listAllNotes);

// DELETE /api/admin/notes/:id - Delete a specific note
router.delete('/notes/:id', protect, adminController.deleteNote);

export default router;