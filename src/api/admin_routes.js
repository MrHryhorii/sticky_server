import { Router } from 'express';
import * as adminController from './admin_controller.js';
import * as adminOrderController from './admin_order_controller.js';
import { protect } from '../middleware/auth_middleware.js';

import * as productController from './product_controller.js'; 


const router = Router();

const adminMiddleware = [protect, adminController.checkAdminRole];

// GET /api/admin/users - Get list of all users
router.get('/users', adminMiddleware, adminController.listUsers);

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminMiddleware, adminController.deleteUser);

// GET /api/admin/notes - Get list of all notes from all users
router.get('/notes', adminMiddleware, adminController.listAllNotes);

// GET /api/admin/orders/:id - Get a single order by ID
router.get('/orders/:id', adminMiddleware, adminOrderController.adminGetOrder);

// DELETE /api/admin/notes/:id - Delete a specific note
router.delete('/notes/:id', adminMiddleware, adminController.deleteNote);

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', adminMiddleware, adminOrderController.updateOrderStatus);

// GET /api/admin/orders - Get list of all orders
router.get('/orders', adminMiddleware, adminOrderController.adminListAllOrders);

// POST /api/admin/products - create product
router.post('/products', adminMiddleware, productController.createProduct);

// GET /api/admin/products - a list of all products
router.get('/products', adminMiddleware, productController.listAllProductsAdmin);

// PUT /api/admin/products/:id - update product
router.put('/products/:id', adminMiddleware, productController.updateProduct);

// DELETE /api/admin/products/:id - delete product
router.delete('/products/:id', adminMiddleware, productController.deleteProduct);

export default router;