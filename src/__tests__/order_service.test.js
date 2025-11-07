import * as OrderService from '../services/order_service.js';
import * as NoteService from '../services/note_service.js';
import * as ProductService from '../services/product_service.js';

// Mock dependencies so we only test OrderService
jest.mock('../services/note_service.js');
jest.mock('../services/product_service.js');

const USER_ID = 1;

// Sample products
const MOCK_PIZZA = { id: 101, name: 'Pizza', price: 15.00, is_active: 1 };
const MOCK_DRINK = { id: 102, name: 'Cola', price: 3.00, is_active: 1 };
const MOCK_INACTIVE = { id: 103, name: 'Out of Stock', price: 10.00, is_active: 0 };

describe('OrderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Freeze Date for stable JSON content
        const mockDate = new Date('2025-11-07T10:00:00.000Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });
    
    afterAll(() => {
        // Restore original Date
        jest.restoreAllMocks();
    });

    // createOrder
    describe('createOrder', () => {
        const orderInput = [
            { productId: 101, quantity: 2 }, // 15.00 * 2 = 30.00
            { productId: 102, quantity: 1 }  // 3.00 * 1 = 3.00
        ];
        const expectedTotal = 33.00;
        const expectedNoteId = 50;

        test('creates an order, calculates total, and saves it as a note', async () => {
            // return active products for each item
            ProductService.getProductById
                .mockResolvedValueOnce(MOCK_PIZZA)
                .mockResolvedValueOnce(MOCK_DRINK);
            NoteService.createNote.mockResolvedValue(expectedNoteId);

            const result = await OrderService.createOrder(USER_ID, orderInput);

            // verify saved note content
            const callArgs = NoteService.createNote.mock.calls[0];
            const createdNoteContent = JSON.parse(callArgs[1].content);
            
            expect(createdNoteContent.total_amount).toBe(expectedTotal);
            expect(createdNoteContent.order_items.length).toBe(2);
            expect(result).toBe(expectedNoteId);
        });
        
        test('throws if a product is not found', async () => {
            ProductService.getProductById.mockResolvedValueOnce(null);

            await expect(OrderService.createOrder(USER_ID, orderInput)).rejects.toThrow(
                'Product ID 101 not available.'
            );
            expect(NoteService.createNote).not.toHaveBeenCalled();
        });

        test('throws if a product is inactive', async () => {
            ProductService.getProductById.mockResolvedValueOnce(MOCK_INACTIVE);
            
            await expect(OrderService.createOrder(USER_ID, orderInput)).rejects.toThrow(
                'Product ID 101 not available.'
            );
            expect(NoteService.createNote).not.toHaveBeenCalled();
        });
    });

    // getOrderById
    describe('getOrderById', () => {
        const MOCK_NOTE = {
            id: 50, title: 'Test Order', user_id: USER_ID,
            content: JSON.stringify({ total_amount: 50.00, order_items: [] })
        };

        test('fetches note and returns parsed order', async () => {
            NoteService.getNoteById.mockResolvedValue(MOCK_NOTE);
            const result = await OrderService.getOrderById(50, USER_ID);

            expect(result.orderId).toBe(50);
            expect(result.total_amount).toBe(50.00);
        });

        test('returns null for invalid JSON content', async () => {
            const invalidNote = { ...MOCK_NOTE, content: 'Invalid JSON' };
            NoteService.getNoteById.mockResolvedValue(invalidNote);
            
            const result = await OrderService.getOrderById(50, USER_ID);
            expect(result).toBeNull();
        });

        test('should return null if the note is not found (ID does not exist)', async () => {
            NoteService.getNoteById.mockResolvedValue(null);
            
            const result = await OrderService.getOrderById(999, USER_ID);
            expect(result).toBeNull();
        });

        test('should return null if note content is invalid JSON', async () => {
            const invalidNote = { id: 50, title: 'Test Order', user_id: USER_ID, content: '{invalid: json}' };
            NoteService.getNoteById.mockResolvedValue(invalidNote);
            
            const result = await OrderService.getOrderById(50, USER_ID);
            expect(result).toBeNull();
        });
    });

    // getAllOrders
    describe('getAllOrders', () => {
        const MOCK_NOTE_1 = {
            id: 50, title: 'Order 1', user_id: USER_ID, 
            content: JSON.stringify({ total_amount: 10.00, order_items: [] }),
            is_order: true
        };
        const MOCK_NOTE_2 = {
            id: 51, title: 'Order 2', user_id: USER_ID, 
            content: JSON.stringify({ total_amount: 20.00, order_items: [] }),
            is_order: true
        };
        const INVALID_NOTE = {
            id: 52, title: 'Invalid Order', user_id: USER_ID, 
            content: 'Not valid JSON',
            is_order: true
        };

        test('returns parsed orders and filters out invalid ones', async () => {
            NoteService.getAllNotes.mockResolvedValue([MOCK_NOTE_1, MOCK_NOTE_2, INVALID_NOTE]);

            const result = await OrderService.getAllOrders(USER_ID);
            
            // two valid orders remain after filtering invalid note
            expect(result.length).toBe(2); 
            expect(result[0].orderId).toBe(50);
        });
    });
});
