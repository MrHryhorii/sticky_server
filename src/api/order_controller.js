import * as orderService from '../services/order_service.js';
import { orderSchema } from '../schemas/order_schema.js';
import { ZodError } from 'zod';

// POST /api/orders - create a new order
export const createOrder = async (req, res) => {
    try {
        const items = orderSchema.parse(req.body);  // validate request body
        const userId = req.user.id;
        const orderId = await orderService.createOrder(userId, items);
        // return only the new order ID
        return res.status(201).json({
            message: 'Order successfully created.',
            orderId: orderId,
        });
    } catch (error) {
        // validation error
        if (error instanceof ZodError) {
            return res.status(400).json({ message: 'Validation failed for order items.', errors: error.errors });
        }
        // product not found or inactive (error from service)
        if (error.message && error.message.includes('not available')) {
            return res.status(404).json({ message: error.message });
        }
        // unexpected error
        console.error('Error creating order:', error);
        return res.status(500).json({ message: 'Internal server error while processing order.' });
    }
};

// GET /api/orders - get all orders for current user
export const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        // service returns parsed and filtered order objects
        const orders = await orderService.getAllOrders(userId);

        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ message: 'Internal server error while fetching orders.' });
    }
};