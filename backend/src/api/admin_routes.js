import { Router } from 'express';
import * as adminController from './admin_controller.js';
import * as adminOrderController from './admin_order_controller.js';
import { protect } from '../middleware/auth_middleware.js';


const router = Router();

const adminMiddleware = [protect, adminController.checkAdminRole];

// GET /api/admin/users - Get list of all users
router.get('/users', adminMiddleware, adminController.listUsers);

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminMiddleware, adminController.deleteUser);

// GET /api/admin/notes - Get list of all notes from all users
router.get('/notes', adminMiddleware, adminController.listAllNotes);

// DELETE /api/admin/notes/:id - Delete a specific note
router.delete('/notes/:id', adminMiddleware, adminController.deleteNote);

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', adminMiddleware, adminOrderController.updateOrderStatus);

// GET /api/admin/orders - Get list of all orders
router.get('/orders', adminMiddleware, adminOrderController.adminListAllOrders);

// GET /api/admin/orders/:id - Get a single order by ID
router.get('/orders/:id', adminMiddleware, adminOrderController.adminGetOrder);

export default router;