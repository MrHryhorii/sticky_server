import { Router } from 'express';
import { protect } from '../middleware/auth_middleware.js'; 
import * as productController from './product_controller.js';
import { requestLogger } from '../middleware/requestLogger.js';

const router = Router();

// Middleware: Ensures user is authenticated and has 'admin' role
const adminMiddleware = [protect, productController.checkAdminRole];

// GET /api/admin/products - Gets ALL products
router.get('/', requestLogger, adminMiddleware, productController.listAllProductsAdmin);

// GET /api/admin/products/:id
router.get('/:id', requestLogger, adminMiddleware, productController.getSingleProductAdmin);

// POST /api/admin/products - Creates a new product
router.post('/', requestLogger, adminMiddleware, productController.createProduct);

// PUT /api/admin/products/:id - Updates a product
router.put('/:id', requestLogger, adminMiddleware, productController.updateProduct);

// DELETE /api/admin/products/:id - Deletes a product
router.delete('/:id', requestLogger, adminMiddleware, productController.deleteProduct);

export default router;