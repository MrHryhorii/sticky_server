import { z } from 'zod';

// Schema for creating and updating a product/dish
export const productSchema = z.object({
    name: z.string().min(3, 'Product name is required and must be at least 3 characters.'),
    description: z.string().optional(),
    price: z.number().min(0.01, 'Price must be a positive number.'),
    
    // Flexible fields
    category: z.string().optional(),
    tags: z.string().optional(),
    extra_info: z.string().optional(),

    // field for image
    image_url: z.string().optional(),
    
    // Admin control field
    is_active: z.boolean().optional(),
});

// This schema will be used by the new Order Controller
export const orderItemSchema = z.object({
    productId: z.number().int().positive('Product ID must be a positive integer.'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
});

// Schema for the entire order payload
export const orderSchema = z.array(orderItemSchema).min(1, 'Order must contain at least one item.');