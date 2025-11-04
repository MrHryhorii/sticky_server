import { Router } from 'express';
import { protect } from '../middleware/auth_middleware.js';

import { createNote } from './note_controller.js'; 

const router = Router();

// POST /api/orders
router.post('/', protect, createNote); 

export default router;