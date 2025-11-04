import { Router } from 'express';
import { protect } from '../middleware/auth_middleware.js'; 
import * as productController from './product_controller.js';

const router = Router();

// Middleware: Ensures user is authenticated and has 'admin' role
const adminMiddleware = [protect, productController.checkAdminRole];

// GET /api/admin/products - Gets ALL products
router.get('/', adminMiddleware, productController.listAllProductsAdmin);

// POST /api/admin/products - Creates a new product
router.post('/', adminMiddleware, productController.createProduct);

// PUT /api/admin/products/:id - Updates a product
router.put('/:id', adminMiddleware, productController.updateProduct);

// DELETE /api/admin/products/:id - Deletes a product
router.delete('/:id', adminMiddleware, productController.deleteProduct);

export default router;