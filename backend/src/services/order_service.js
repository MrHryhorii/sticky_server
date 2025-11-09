import * as NoteService from './note_service.js';
import * as ProductService from './product_service.js';

// Validate items, fetch prices, build order JSON
const processOrderItems = async (items) => {
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
        // get current product data
        const product = await ProductService.getProductById(item.productId);
        // product must exist and be active
        if (!product || product.is_active === 0) {
            throw new Error(`Product ID ${item.productId} not available.`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
            productId: item.productId,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            total: parseFloat(itemTotal.toFixed(2))
        });
    }

    // final order object (will be saved as JSON)
    const orderContent = {
        order_items: orderItems,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        status: 'PENDING',
        order_date: new Date().toISOString(),
    };

    return orderContent;
};

// Parse a note and return order object or null
const parseOrderNote = (note) => {
    if (!note || !note.content) return null; 
    try {
        const content = JSON.parse(note.content);
        if (!content.total_amount || !content.order_items) {
            return null;
        }
        return {
            orderId: note.id,
            title: note.title,
            user_id: note.user_id,
            ...content,
        };
    } catch (e) {
        return null;
    }
};

// Create an order: validate items, calculate totals, save as a note
export async function createOrder(userId, items) {
    if (!items || items.length === 0) {
        throw new Error('Order must contain at least one item.');
    }
    // build order content
    const orderContent = await processOrderItems(items);
    // prepare note payload
    const noteData = {
        title: `Order placed on ${new Date().toLocaleDateString()}`,
        content: JSON.stringify(orderContent),
        is_order: true,
        user_id: userId,
    };
    
    return NoteService.createNote(userId, noteData);
}

// Get a single order by ID for a user
export async function getOrderById(orderId, userId) {
    const note = await NoteService.getNoteById(orderId, userId); 
    return parseOrderNote(note);
}

// Get all orders for a user
export async function getAllOrders(userId) {
    const notes = await NoteService.getAllNotes(userId); 
    return notes
        .filter(note => note.is_order)
        .map(parseOrderNote)
        .filter(order => order !== null);
}

// Get all orders for Admin (uses NoteService.adminGetAllNotes)
export async function adminGetAllOrders(limit, offset) {
    const NoteService = await import('./note_service.js');
    
    const { notes, totalCount } = await NoteService.adminGetAllNotes(limit, offset);

    const parsedOrders = notes
        .map(note => parseOrderNote(note))
        .filter(order => order !== null);

    return { orders: parsedOrders, totalCount };
}

// Get a single order by ID for Admin
export async function adminGetOrderById(orderId) {
    const note = await NoteService.adminGetNoteById(orderId); 
    
    if (!note) return null;
    const parsedOrder = parseOrderNote(note); 
    return parsedOrder;
}
