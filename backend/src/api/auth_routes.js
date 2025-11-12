import { Router } from 'express';
import * as authController from './auth_controller.js';
import { protect } from '../middleware/auth_middleware.js';
import { requestLogger } from '../middleware/requestLogger.js';

const router = Router();

// POST /api/auth/register
router.post('/register', requestLogger, authController.register);

// POST /api/auth/login
router.post('/login', requestLogger, authController.login);

// GET /api/auth/me
router.get('/me', protect, requestLogger, authController.getMe);

// POST /api/auth/logout
router.post('/logout', requestLogger, authController.logout);

// DELETE /api/auth/delete-account
router.delete('/delete-account', protect, requestLogger, authController.deleteSelf);

export default router; // Export the router instance