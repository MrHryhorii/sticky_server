import { ZodError } from 'zod';

// POST /api/orders - create a new order
export const createOrder = async (req, res) => {
    try {
        // dynamic import so tests can mock module after controller import
        const { orderSchema } = await import('../schemas/order_schema.js');
        const orderService = await import('../services/order_service.js');

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
        const orderService = await import('../services/order_service.js');

        const userId = req.user.id;
        // service returns parsed and filtered order objects
        const orders = await orderService.getAllOrders(userId);

        return res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ message: 'Internal server error while fetching orders.' });
    }
};

// GET /api/orders/:id - Get a single order by ID for current user
export const getOrderById = async (req, res) => {
    try {
        // Dynamic imports
        const orderService = await import('../services/order_service.js');

        const userId = req.user.id;
        const orderId = parseInt(req.params.id);

        if (isNaN(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID format.' });
        }

        const order = await orderService.getOrderById(orderId, userId);

        if (!order) {
            // Service will return null if the note/order is not found or does not belong to the user
            return res.status(404).json({ message: 'Order not found.' });
        }

        return res.status(200).json(order);

    } catch (error) {
        console.error('Error fetching single order:', error);
        return res.status(500).json({ message: 'Internal server error while fetching order.' });
    }
};