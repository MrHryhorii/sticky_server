import * as noteService from '../services/note_service.js';
import * as orderService from '../services/order_service.js';
import { isOrderNote } from '../utils/order_utils.js';
import { orderSchema } from '../schemas/order_schema.js'; 
import { ZodError } from 'zod'; 

// POST /api/orders
// Creates a new order by validating the request
export const createOrder = async (req, res) => {
    try {
        // Zod validation
        const items = orderSchema.parse(req.body); 
        const userId = req.user.id;
        // Checks product existence
        const orderData = await orderService.createStructuredOrder(userId, items);
        // Save as note content
        const noteTitle = `Order placed on ${new Date().toLocaleString()}`;
        const noteContent = JSON.stringify(orderData); 
        
        const lastID = await noteService.createNote(userId, { title: noteTitle, content: noteContent });
        
        return res.status(201).json({ 
            message: 'Order successfully created.', 
            orderId: lastID,
            totalAmount: orderData.total_amount
        });
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
             return res.status(400).json({ message: 'Validation failed for order items.', errors: error.errors });
        }
        // Handle service errors
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        // Handle all other unexpected errors
        console.error('Error creating order:', error);
        return res.status(500).json({ message: 'Internal server error while processing order.' });
    }
};


// GET /api/orders
// Fetches all notes for the current user
export const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        // Get all user notes
        const allNotes = await noteService.getAllNotes(userId); 
        // Return only notes that are Orders
        const orders = allNotes
            .filter(note => isOrderNote(note.content))
            .map(note => {
                // Parse JSON and use note ID as the order ID
                try {
                    const orderData = JSON.parse(note.content);
                    return {
                        orderId: note.id,
                        title: orderData.title || `Order #${note.id}`, 
                        ...orderData
                    };
                } catch (e) {
                    // This handles cases where JSON might be corrupt
                    console.warn(`Corrupt JSON data found in note ID ${note.id}: ${e.message}`);
                    return null;
                }
            })
            // Remove any null records in case of corrupt JSON
            .filter(order => order !== null);

        return res.status(200).json(orders);
    } catch (error) {
        // Handle database access errors for notes
        console.error('Error fetching orders:', error);
        return res.status(500).json({ message: 'Internal server error while fetching orders.' });
    }
};