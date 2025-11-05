export function isOrderNote(noteContent) {
    if (!noteContent) return false;
    try {
        const data = JSON.parse(noteContent);
        // Check if we have fields for an order
        return data.order_items && Array.isArray(data.order_items) && data.total_amount !== undefined;
    } catch (e) {
        // It is a note
        return false;
    }
}