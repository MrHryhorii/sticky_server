import { ZodError } from 'zod';
import { OrderStatusUpdateSchema } from '../schemas/order_schema.js'; 
import { isOrderNote } from '../utils/order_utils.js';
import * as db from '../data/db_adapter.js';

// Helper to get a note by ID without user check (Admin-level access).
async function adminGetNoteById(noteId) {
    return db.get(
        'SELECT id, title, content FROM notes WHERE id = ?', 
        [noteId]
    );
}

// Updates the status field within the JSON content of an Order note
// PUT /api/admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        // Zod
        const { status: newStatus } = OrderStatusUpdateSchema.parse(req.body);
        // Get the note/order by id
        const note = await adminGetNoteById(orderId);
        if (!note) {
            return res.status(404).json({ message: 'Order (Note) not found.' });
        }
        // Check if it is a valid order note by the util
        if (!isOrderNote(note.content)) {
            return res.status(400).json({ message: 'The requested record is not a valid order and cannot have its status updated.' });
        }
        // PARSE, UPDATE status, and STRINGIFY the content
        const orderData = JSON.parse(note.content);
        
        orderData.status = newStatus;
        orderData.updated_at = new Date().toISOString(); // Update timestamp on the content
        
        const newContent = JSON.stringify(orderData);

        // UPDATE the note content in the database
        const affectedRows = await db.run(
            'UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newContent, orderId]
        );

        if (affectedRows === 0) {
            return res.status(500).json({ message: 'Database update failed unexpectedly.' });
        }
        
        return res.status(200).json({ 
            message: `Order #${orderId} status updated to ${newStatus}.`,
            newStatus: newStatus
        });

    } catch (error) {
        if (error instanceof ZodError) {
             return res.status(400).json({ message: 'Validation failed for new status.', errors: error.errors });
        }
        console.error('Error updating order status for admin:', error);
        return res.status(500).json({ message: 'Internal server error during order status update.' });
    }
};