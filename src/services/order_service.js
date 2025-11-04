import * as productService from './product_service.js';

// Creates an Order JSON from client input
export async function createStructuredOrder(userId, items) {
    let totalAmount = 0;
    const orderItems = [];
    const timestamp = new Date().toISOString();

    for (const item of items) {
        // Fetch real price from the master 'products' table
        const product = await productService.getProductById(item.productId);

        if (!product || product.is_active === 0) {
            // Error
            const error = new Error(`Product with ID ${item.productId} not found or is inactive.`);
            error.statusCode = 404;
            throw error; 
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
            productId: item.productId,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            total: itemTotal
        });
    }

    // Build the final Order object
    const orderData = {
        order_items: orderItems,
        total_amount: totalAmount,
        user_id: userId,
        status: 'PENDING',
        order_date: timestamp,
    };

    return orderData;
}