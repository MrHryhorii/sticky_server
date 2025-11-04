import { Router } from 'express';
import * as authController from './auth_controller.js';
import { protect } from '../middleware/auth_middleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// DELETE /api/auth/delete-account
router.delete('/delete-account', protect, authController.deleteSelf);

export default router; // Export the router instance