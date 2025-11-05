import { Router } from 'express';
import { protect } from '../middleware/auth_middleware.js';

import { createOrder, getOrders } from './order_controller.js';

const router = Router();

// POST /api/orders - Creates a new order
router.post('/', protect, createOrder); 

// GET /api/orders - Fetches a list of the current user's orders
router.get('/', protect, getOrders); 

export default router;