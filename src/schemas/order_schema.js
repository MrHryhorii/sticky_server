import { z } from 'zod';

// Schema for an item in the order
export const orderItemSchema = z.object({
    productId: z.number().int().positive('Product ID must be a positive integer.'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
});

// Schema for the entire order
export const orderSchema = z.array(orderItemSchema).min(1, 'Order must contain at least one item.');

// Define the standard set of statuses for an order
const validStatuses = ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'];

// Schema for updating the order status (used by PUT /admin/orders/:id/status)
export const OrderStatusUpdateSchema = z.object({
    status: z.enum(validStatuses, { 
        errorMap: () => ({ message: `Status must be one of: ${validStatuses.join(', ')}` }) 
    }),
});