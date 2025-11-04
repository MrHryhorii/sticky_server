import { Router } from 'express';
import * as productController from './product_controller.js';

const router = Router();

// GET /api/products - (Unprotected)
router.get('/', productController.listActiveProducts);

export default router;